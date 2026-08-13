import {
  FEE_CENTS,
  MAX_PLAYERS,
  isVolunteering,
  registrationTotalCents,
  validateStep,
  WAIVERS,
  type PlayerInfo,
  type RegistrationPayload,
} from "@/lib/registration";
import { buildRegistrationSummaryText } from "@/lib/build-registration-summary";
import { REGISTER_WEBHOOK_URL } from "@/lib/webhooks";

const INFO_EMAIL = "info@1ball1game.org";

export type SubmitRegistrationOptions = {
  paymentStatus: "paid" | "pending" | "paid_client_confirmed";
  stripePaymentIntentId?: string;
  stripeClientReferenceId?: string;
  submittedAt?: string;
  clientIp?: string;
};

type ValidateOptions = {
  requireSignature?: boolean;
};

function flattenPlayers(players: PlayerInfo[]) {
  const flat: Record<string, string> = {};
  players.forEach((player, i) => {
    const n = i + 1;
    flat[`player_${n}_first_name`] = player.firstName.trim();
    flat[`player_${n}_last_name`] = player.lastName.trim();
    flat[`player_${n}_date_of_birth`] = player.dateOfBirth;
    flat[`player_${n}_gender`] = player.gender;
    flat[`player_${n}_grade`] = player.grade;
    flat[`player_${n}_school`] = player.school;
    flat[`player_${n}_jersey_size`] = player.jerseySize;
    flat[`player_${n}_buddy_request`] = player.buddyRequest.trim();
    flat[`player_${n}_emergency_contact_name`] =
      player.emergencyContactName.trim();
    flat[`player_${n}_emergency_phone`] = player.emergencyPhone.trim();
    flat[`player_${n}_has_medical_conditions`] = player.hasMedicalConditions;
    flat[`player_${n}_medical_details`] = player.medicalDetails.trim();
  });
  return flat;
}

export function validateRegistrationPayload(
  payload: RegistrationPayload,
  options: ValidateOptions = {},
) {
  const lastStep = options.requireSignature ? 5 : 4;
  for (let step = 0; step <= lastStep; step++) {
    const errors = validateStep(step, payload);
    if (Object.keys(errors).length) {
      return errors;
    }
  }
  return null;
}

export function buildRegistrationSheetRow(
  payload: RegistrationPayload,
  options: SubmitRegistrationOptions,
) {
  const { parent, players, volunteer, waivers, parentSignature } = payload;
  const playerCount = players.length;
  const totalCents = registrationTotalCents(playerCount);
  const submittedAt = options.submittedAt ?? new Date().toISOString();
  const clientIp = options.clientIp ?? "";

  const registrationEmailBody = buildRegistrationSummaryText(payload, {
    paymentStatus: options.paymentStatus,
    stripePaymentIntentId: options.stripePaymentIntentId,
    submittedAt,
    clientIp,
  });

  const waiverSummary = WAIVERS.map(
    (waiver) => `${waivers[waiver.key] ? "Agreed" : "Not agreed"}: ${waiver.title}`,
  ).join("\n");

  return {
    submitted_at: submittedAt,
    source: "1ball1game-website-register",
    season: "Fall 2026",
    parent_first_name: parent.firstName.trim(),
    parent_last_name: parent.lastName.trim(),
    parent_relationship: parent.relationship,
    parent_email: parent.email.trim(),
    parent_phone: parent.phone.trim(),
    parent_street: parent.street.trim(),
    parent_city: parent.city.trim(),
    parent_state: parent.state.trim(),
    parent_zip: parent.zip.trim(),
    secondary_name: parent.secondaryName.trim(),
    secondary_phone: parent.secondaryPhone.trim(),
    secondary_email: parent.secondaryEmail.trim(),
    parent_signature: parentSignature.trim(),
    client_ip: clientIp,
    player_count: playerCount,
    total_cents: totalCents,
    total_usd: (totalCents / 100).toFixed(2),
    payment_status: options.paymentStatus,
    stripe_payment_intent_id: options.stripePaymentIntentId ?? "",
    stripe_client_reference_id: options.stripeClientReferenceId ?? "",
    volunteer_role: volunteer.role,
    volunteer_name: isVolunteering(volunteer.role) ? volunteer.name.trim() : "",
    volunteer_shirt_size: isVolunteering(volunteer.role)
      ? volunteer.shirtSize
      : "",
    waiver_program_administration: waivers.programAdministration,
    waiver_liability_release: waivers.liabilityRelease,
    waiver_photo_media: waivers.photoMedia,
    waiver_code_of_conduct: waivers.codeOfConduct,
    waiver_fundraising_agreement: waivers.fundraisingAgreement,
    waiver_summary: waiverSummary,
    players_json: JSON.stringify(players),
    email_to: parent.email.trim(),
    email_bcc: INFO_EMAIL,
    notification_recipients: `${parent.email.trim()},${INFO_EMAIL}`,
    registration_email_body: registrationEmailBody,
    registration_email_subject: `New 1B1G registration — ${parent.firstName.trim()} ${parent.lastName.trim()}`,
    ...flattenPlayers(players),
  };
}

/** Browser-safe registration submit (static Amplify site → Waves). */
export async function submitRegistrationClient(
  payload: RegistrationPayload,
  options: SubmitRegistrationOptions,
) {
  if (!REGISTER_WEBHOOK_URL) {
    throw new Error("Registration webhook is not configured.");
  }

  const validationErrors = validateRegistrationPayload(payload, {
    requireSignature: true,
  });
  if (validationErrors) {
    throw new Error("Registration validation failed.");
  }

  const playerCount = payload.players.length;
  if (playerCount < 1 || playerCount > MAX_PLAYERS) {
    throw new Error("Invalid player count.");
  }

  const sheetRow = buildRegistrationSheetRow(payload, options);
  const response = await fetch(REGISTER_WEBHOOK_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(sheetRow),
  });

  if (!response.ok) {
    throw new Error("Unable to submit registration to webhook.");
  }

  return {
    playerCount,
    totalCents: registrationTotalCents(playerCount),
    feePerPlayerCents: FEE_CENTS,
  };
}

async function sendResendNotification(
  parentEmail: string,
  subject: string,
  body: string,
) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return;

  const from =
    process.env.REGISTER_EMAIL_FROM ??
    "1 Ball 1 Game Registration <registration@1ball1game.org>";

  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [parentEmail],
      bcc: [INFO_EMAIL],
      subject,
      text: body,
    }),
  });
}

/** Server-side submit (optional webhook worker) including Resend email. */
export async function submitRegistration(
  payload: RegistrationPayload,
  options: SubmitRegistrationOptions,
) {
  const result = await submitRegistrationClient(payload, options);
  const sheetRow = buildRegistrationSheetRow(payload, options);
  await sendResendNotification(
    payload.parent.email.trim(),
    sheetRow.registration_email_subject,
    sheetRow.registration_email_body,
  );
  return result;
}
