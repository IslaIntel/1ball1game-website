/**
 * Switch for the Winter Streetball 12-per-session cap and free waitlist.
 * Off by default. With it off, Winter checkout works exactly as before.
 * Turn on with NEXT_PUBLIC_WINTER_CAP_ENABLED=true once the capacity script is
 * deployed and CAPACITY_SCRIPT_URL / CAPACITY_SCRIPT_SECRET are set.
 */
export const WINTER_CAP_ENABLED = process.env.NEXT_PUBLIC_WINTER_CAP_ENABLED === "true";

export const WINTER_SESSION_CAPACITY = 12;

/** Per-child result of asking the capacity script for a place. */
export type EnrollmentStatus =
  | "confirmed"
  | "checkout_hold"
  | "offer_reserved"
  | "waitlisted"
  | "released"
  | "cancelled";

export type EnrollmentChild = {
  registrationId: string;
  playerId: string;
  sessionId: string;
  playerName: string;
  parentEmail: string;
  enrollmentStatus: EnrollmentStatus;
  paymentStatus: string;
  amountDueCents: number;
  amountPaidCents: number;
  paymentIntentId: string;
  waitlistedAt: string;
  reservationExpiresAt: string;
};

export type SessionAvailability = {
  id: string;
  capacity: number;
  occupied: number;
  remaining: number;
  waitlistCount: number;
  label: string;
};

/** A child who has (or is about to pay for) one of the 12 places. */
export function hasPlace(child: Pick<EnrollmentChild, "enrollmentStatus">) {
  return (
    child.enrollmentStatus === "checkout_hold" ||
    child.enrollmentStatus === "confirmed" ||
    child.enrollmentStatus === "offer_reserved"
  );
}
