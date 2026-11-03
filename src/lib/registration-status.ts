/**
 * Single switch for the registration window.
 *
 * The code default is open. Families choose Winter 2026 (full paid form) or
 * Spring 2027 (player information only, no payment) on the registration page.
 * To close both without a code change, set NEXT_PUBLIC_REGISTRATION_OPEN=false
 * in Amplify → App settings → Environment variables and redeploy.
 */
const flag = process.env.NEXT_PUBLIC_REGISTRATION_OPEN;

export const REGISTRATION_OPEN = flag === undefined ? true : flag === "true";

/** Paid registration. Same form as the previous season, including checkout. */
export const WINTER_SEASON = "Winter 2026" as const;

/** Player details only. No fee and no card payment. */
export const SPRING_SEASON = "Spring 2027" as const;

export const REGISTRATION_SEASONS = [WINTER_SEASON, SPRING_SEASON] as const;

export type RegistrationSeason = (typeof REGISTRATION_SEASONS)[number];

export function isRegistrationSeason(value: unknown): value is RegistrationSeason {
  return value === WINTER_SEASON || value === SPRING_SEASON;
}

export function seasonRequiresPayment(season: RegistrationSeason) {
  return season === WINTER_SEASON;
}

/** Combined label for pages that are not inside a chosen season. */
export const REGISTRATION_SEASON = "Winter 2026 and Spring 2027";

export const REGISTRATION_CONTACT_EMAIL = "registration@1ball1game.org";

export const REGISTRATION_CLOSED_COPY = {
  /** Label on every entry-point button once the window closes. */
  ctaLabel: "Registration Closed",
  badge: "Registration Closed",
  heading: `${REGISTRATION_SEASON} registration is now closed`,
  intro: `Thank you — we reached the close of our ${REGISTRATION_SEASON} registration window. We are no longer accepting new players for this season.`,
} as const;
