import {
  FEE_CENTS,
  MAX_PLAYERS,
  isVolunteering,
  registrationTotalCents,
  SPRING_WAIVERS,
  validateStep,
  WAIVERS,
  type WaiverDoc,
  type PlayerInfo,
  type RegistrationPayload,
} from "@/lib/registration";
import { buildRegistrationSummaryText } from "@/lib/build-registration-summary";
import { WINTER_SEASON } from "@/lib/registration-status";
import { buildWinterWelcomeEmail } from "@/lib/build-winter-welcome-email";
import { hasPlace, type EnrollmentChild } from "@/lib/winter-capacity-config";

const WEBHOOK_URL =
  process.env.REGISTER_WEBHOOK_URL ??
  "https://waves.islaintel.com/api/v1/webhooks/oQwh7JAcfDrZ8CgUvymgO";

const INFO_EMAIL = "info@1ball1game.org";

export type SubmitRegistrationOptions = {
  paymentStatus: "paid" | "pending" | "scholarship" | "not_required" | "waitlisted";
  /** Overrides the season stored on the payload. Used for checkouts started before season choice existed. */
  season?: string;
  stripePaymentIntentId?: string;
  stripeInvoiceId?: string;
  couponCode?: string;
  amountPaidCents?: number;
  submittedAt?: string;
  clientIp?: string;
  /** Set when the Winter cap is on: the family ID and each child's place or waitlist spot. */
  registrationId?: string;
  enrollment?: EnrollmentChild[];
};

type ValidateOptions = {
  requireSignature?: boolean;
  waiverDocs?: WaiverDoc[];
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

/** player_N_player_id / session_id / enrollment_status, matching the player_N_* columns. */
function flattenEnrollment(enrollment: EnrollmentChild[] | undefined) {
  const flat: Record<string, string> = {};
  enrollment?.forEach((child, i) => {
    const n = i + 1;
    flat[`player_${n}_player_id`] = child.playerId;
    flat[`player_${n}_session_id`] = child.sessionId;
    flat[`player_${n}_enrollment_status`] = child.enrollmentStatus;
    flat[`player_${n}_payment_status`] = child.paymentStatus;
    flat[`player_${n}_waitlisted_at`] = child.waitlistedAt;
  });
  return flat;
}

export function validateRegistrationPayload(
  payload: RegistrationPayload,
  options: ValidateOptions = {},
) {
  const lastStep = options.requireSignature ? 4 : 3;
  for (let step = 0; step <= lastStep; step++) {
    const errors = validateStep(step, payload, options.waiverDocs);
    if (Object.keys(errors).length) {
      return errors;
    }
  }
  return null;
}

type ResendEmail = {
  to: string[];
  bcc?: string[];
  subject: string;
  text: string;
  html?: string;
};

async function sendResendEmail(email: ResendEmail) {
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
    body: JSON.stringify({ from, reply_to: INFO_EMAIL, ...email }),
  });
}

export async function submitRegistration(
  payload: RegistrationPayload,
  options: SubmitRegistrationOptions,
) {
  if (!WEBHOOK_URL) {
    throw new Error("Registration webhook is not configured.");
  }

  const season = options.season ?? payload.season ?? WINTER_SEASON;
  const complimentary = options.paymentStatus === "not_required";
  const enrollment = options.enrollment;
  const enrolledCount = enrollment ? enrollment.filter(hasPlace).length : null;

  const validationErrors = validateRegistrationPayload(payload, {
    requireSignature: true,
    waiverDocs: complimentary ? SPRING_WAIVERS : WAIVERS,
  });
  if (validationErrors) {
    throw new Error("Registration validation failed.");
  }

  const { parent, players, volunteer, waivers, parentSignature } = payload;
  const playerCount = players.length;
  if (playerCount < 1 || playerCount > MAX_PLAYERS) {
    throw new Error("Invalid player count.");
  }

  const totalCents = complimentary
    ? 0
    : registrationTotalCents(enrolledCount ?? playerCount);
  const submittedAt = options.submittedAt ?? new Date().toISOString();
  const clientIp = options.clientIp ?? "";

  const amountPaidCents = complimentary ? 0 : (options.amountPaidCents ?? totalCents);
  const registrationEmailBody = buildRegistrationSummaryText(payload, {
    season,
    paymentStatus: options.paymentStatus,
    stripePaymentIntentId: options.stripePaymentIntentId,
    stripeInvoiceId: options.stripeInvoiceId,
    couponCode: options.couponCode,
    amountPaidCents,
    submittedAt,
    clientIp,
    totalCents,
    enrollment,
  });

  // Winter families get a welcome email; the full summary goes to the team only.
  const welcomeEmail = complimentary ? null : buildWinterWelcomeEmail(payload, enrollment);

  const waiverSummary = WAIVERS.map(
    (waiver) => `${waivers[waiver.key] ? "Agreed" : "Not agreed"}: ${waiver.title}`,
  ).join("\n");

  const sheetRow = {
    submitted_at: submittedAt,
    source: "1ball1game-website-register",
    season,
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
    amount_paid_cents: amountPaidCents,
    amount_paid_usd: (amountPaidCents / 100).toFixed(2),
    payment_status: options.paymentStatus,
    coupon_code: options.couponCode ?? "",
    stripe_payment_intent_id: options.stripePaymentIntentId ?? "",
    stripe_invoice_id: options.stripeInvoiceId ?? "",
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
    registration_email_subject: `New 1B1G ${season} registration — ${parent.firstName.trim()} ${parent.lastName.trim()}`,
    registration_id: options.registrationId ?? "",
    program: complimentary ? "" : "winter-streetball",
    enrolled_count: enrolledCount ?? "",
    waitlisted_count: enrollment
      ? enrollment.filter((c) => c.enrollmentStatus === "waitlisted").length
      : "",
    enrollment_json: enrollment ? JSON.stringify(enrollment) : "",
    ...flattenEnrollment(enrollment),
    parent_email_subject: welcomeEmail?.subject ?? "",
    parent_email_text: welcomeEmail?.text ?? "",
    parent_email_html: welcomeEmail?.html ?? "",
    ...flattenPlayers(players),
  };

  const response = await fetch(WEBHOOK_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(sheetRow),
  });

  if (!response.ok) {
    throw new Error("Unable to submit registration to webhook.");
  }

  if (welcomeEmail) {
    await sendResendEmail({
      to: [parent.email.trim()],
      subject: welcomeEmail.subject,
      text: welcomeEmail.text,
      html: welcomeEmail.html,
    });
    await sendResendEmail({
      to: [INFO_EMAIL],
      subject: sheetRow.registration_email_subject,
      text: registrationEmailBody,
    });
  } else {
    await sendResendEmail({
      to: [parent.email.trim()],
      bcc: [INFO_EMAIL],
      subject: sheetRow.registration_email_subject,
      text: registrationEmailBody,
    });
  }

  return { playerCount, totalCents, feePerPlayerCents: FEE_CENTS };
}
