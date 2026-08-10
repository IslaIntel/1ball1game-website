import {
  formatUsd,
  isVolunteering,
  registrationTotalCents,
  WAIVERS,
  type RegistrationPayload,
} from "@/lib/registration";

export function buildRegistrationSummaryText(
  payload: RegistrationPayload,
  options: {
    paymentStatus: string;
    stripePaymentIntentId?: string;
    submittedAt: string;
    clientIp?: string;
  },
) {
  const { parent, players, volunteer, waivers, parentSignature } = payload;
  const totalCents = registrationTotalCents(players.length);
  const lines: string[] = [
    "New Fall 2026 soccer registration",
    "",
    "PARENT / GUARDIAN",
    `Name: ${parent.firstName} ${parent.lastName} (${parent.relationship})`,
    `Email: ${parent.email}`,
    `Phone: ${parent.phone}`,
    `Address: ${parent.street}, ${parent.city}, ${parent.state} ${parent.zip}`,
  ];

  if (parent.secondaryName.trim() || parent.secondaryPhone.trim() || parent.secondaryEmail.trim()) {
    lines.push(
      `Secondary contact: ${parent.secondaryName || "—"} · ${parent.secondaryPhone || "—"} · ${parent.secondaryEmail || "—"}`,
    );
  }

  lines.push(
    "",
    "PLAYERS",
    `Count: ${players.length}`,
    `Total due: ${formatUsd(totalCents)}`,
    `Payment status: ${options.paymentStatus}`,
  );

  if (options.stripePaymentIntentId) {
    lines.push(`Stripe payment ID: ${options.stripePaymentIntentId}`);
  }

  players.forEach((player, i) => {
    lines.push(
      "",
      `Player ${i + 1}: ${player.firstName} ${player.lastName}`,
      `  DOB: ${player.dateOfBirth}`,
      `  Gender: ${player.gender}`,
      `  Grade: ${player.grade}`,
      `  School: ${player.school}`,
      `  Jersey: ${player.jerseySize}`,
      `  Buddy request: ${player.buddyRequest.trim() || "—"}`,
      `  Emergency: ${player.emergencyContactName} · ${player.emergencyPhone}`,
      `  Medical conditions: ${player.hasMedicalConditions === "yes" ? "Yes" : "No"}`,
      `  Medical details: ${player.medicalDetails.trim() || "—"}`,
    );
  });

  lines.push(
    "",
    "VOLUNTEER",
    volunteer.role || "—",
  );
  if (isVolunteering(volunteer.role)) {
    lines.push(`  Name: ${volunteer.name}`, `  Shirt size: ${volunteer.shirtSize}`);
  }

  lines.push("", "WAIVERS ACKNOWLEDGED");
  for (const waiver of WAIVERS) {
    lines.push(`  ${waivers[waiver.key] ? "✓" : "✗"} ${waiver.title}`);
  }

  lines.push(
    "",
    "SIGNATURE",
    `Typed signature: ${parentSignature.trim()}`,
    "",
    `Submitted: ${options.submittedAt}`,
  );

  if (options.clientIp) {
    lines.push(`IP address: ${options.clientIp}`);
  }

  return lines.join("\n");
}
