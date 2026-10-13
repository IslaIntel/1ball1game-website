/**
 * Single switch for the registration window.
 *
 * The code default is open for the Spring 2027 season. To close without a
 * code change, set NEXT_PUBLIC_REGISTRATION_OPEN=false in Amplify →
 * App settings → Environment variables and redeploy.
 */
const flag = process.env.NEXT_PUBLIC_REGISTRATION_OPEN;

export const REGISTRATION_OPEN = flag === undefined ? true : flag === "true";

export const REGISTRATION_SEASON = "Spring 2027";

export const REGISTRATION_CONTACT_EMAIL = "registration@1ball1game.org";

export const REGISTRATION_CLOSED_COPY = {
  /** Label on every entry-point button once the window closes. */
  ctaLabel: "Registration Closed",
  badge: "Registration Closed",
  heading: `${REGISTRATION_SEASON} registration is now closed`,
  intro: `Thank you — we reached the close of our ${REGISTRATION_SEASON} registration window. We are no longer accepting new players for this season.`,
} as const;
