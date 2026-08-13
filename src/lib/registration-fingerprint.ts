import type { RegistrationPayload } from "@/lib/registration";

/** Browser- and Node-safe fingerprint for Stripe client_reference_id. */
export function registrationFingerprint(payload: RegistrationPayload): string {
  const normalized = JSON.stringify({
    email: payload.parent.email.trim().toLowerCase(),
    players: payload.players.map((player) => ({
      firstName: player.firstName.trim().toLowerCase(),
      lastName: player.lastName.trim().toLowerCase(),
      dateOfBirth: player.dateOfBirth,
    })),
  });

  // FNV-1a 32-bit, expanded to 32 hex chars via repeated rounds
  let round = normalized;
  let out = "";
  for (let i = 0; i < 4; i++) {
    let hash = 0x811c9dc5;
    for (let j = 0; j < round.length; j++) {
      hash ^= round.charCodeAt(j);
      hash = Math.imul(hash, 0x01000193);
    }
    out += (hash >>> 0).toString(16).padStart(8, "0");
    round = out;
  }
  return out.slice(0, 32);
}
