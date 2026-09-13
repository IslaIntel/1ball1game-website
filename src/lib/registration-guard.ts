import { NextResponse } from "next/server";
import {
  REGISTRATION_CONTACT_EMAIL,
  REGISTRATION_OPEN,
  REGISTRATION_SEASON,
} from "@/lib/registration-status";

/**
 * Rejects registration and payment requests once the season closes, so a stale
 * tab or direct POST cannot create a new charge. Returns null while open.
 *
 * The Stripe webhook is deliberately not guarded — payments that succeeded
 * before the cutoff must still be recorded.
 */
export function registrationClosedResponse(): NextResponse | null {
  if (REGISTRATION_OPEN) return null;

  return NextResponse.json(
    {
      error: `${REGISTRATION_SEASON} registration is closed. Please email ${REGISTRATION_CONTACT_EMAIL} with any questions.`,
    },
    { status: 403 },
  );
}
