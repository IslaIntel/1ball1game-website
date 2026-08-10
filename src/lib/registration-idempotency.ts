import { createHash } from "crypto";
import type { RegistrationPayload } from "@/lib/registration";

/** Stable hash for idempotent PaymentIntent creation (same family = same key). */
export function registrationFingerprint(payload: RegistrationPayload): string {
  const normalized = {
    email: payload.parent.email.trim().toLowerCase(),
    players: payload.players.map((player) => ({
      firstName: player.firstName.trim().toLowerCase(),
      lastName: player.lastName.trim().toLowerCase(),
      dateOfBirth: player.dateOfBirth,
    })),
  };

  return createHash("sha256")
    .update(JSON.stringify(normalized))
    .digest("hex")
    .slice(0, 32);
}
