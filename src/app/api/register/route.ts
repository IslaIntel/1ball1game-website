import { NextResponse } from "next/server";
import {
  FEE_CENTS,
  MAX_PLAYERS,
  isVolunteering,
  type ParentInfo,
  type PlayerInfo,
  type VolunteerInfo,
  type Waivers,
  validateStep,
} from "@/lib/registration";

const WEBHOOK_URL =
  process.env.REGISTER_WEBHOOK_URL ??
  "https://waves.islaintel.com/api/v1/webhooks/oQwh7JAcfDrZ8CgUvymgO";

type RegisterBody = {
  parent: ParentInfo;
  players: PlayerInfo[];
  volunteer: VolunteerInfo;
  waivers: Waivers;
  totalCents?: number;
  playerCount?: number;
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

export async function POST(request: Request) {
  if (!WEBHOOK_URL) {
    return NextResponse.json(
      { error: "Registration is temporarily unavailable. Please email info@1ball1game.org." },
      { status: 503 },
    );
  }

  let body: RegisterBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { parent, players, volunteer, waivers } = body;
  if (!parent || !Array.isArray(players) || players.length === 0 || !volunteer || !waivers) {
    return NextResponse.json({ error: "Incomplete registration." }, { status: 400 });
  }

  const payload = { parent, players, volunteer, waivers };
  for (let step = 0; step <= 4; step++) {
    const errors = validateStep(step, payload);
    if (Object.keys(errors).length) {
      return NextResponse.json(
        { error: "Please complete all required registration fields." },
        { status: 400 },
      );
    }
  }

  const playerCount = players.length;
  if (playerCount > MAX_PLAYERS) {
    return NextResponse.json(
      { error: `You can register up to ${MAX_PLAYERS} players at a time.` },
      { status: 400 },
    );
  }
  const totalCents = playerCount * FEE_CENTS;
  const submittedAt = new Date().toISOString();

  const sheetRow = {
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
    player_count: playerCount,
    total_cents: totalCents,
    total_usd: (totalCents / 100).toFixed(2),
    payment_status: "pending",
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
    players_json: JSON.stringify(players),
    ...flattenPlayers(players),
  };

  try {
    const response = await fetch(WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(sheetRow),
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: "Unable to submit registration right now. Please try again." },
        { status: 502 },
      );
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "Unable to submit registration right now. Please try again." },
      { status: 502 },
    );
  }
}
