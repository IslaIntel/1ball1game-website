import posthog from "posthog-js";

/**
 * Central event registry — every tracked "marker" on the landing page lives
 * here so analytics stay consistent and discoverable. Naming follows the
 * PostHog convention: lowercase, noun-verb, snake-ish with colons for scope.
 */
export const EVENTS = {
  // Navigation
  NAV_LINK_CLICK: "nav:link_click",
  NAV_LOGO_CLICK: "nav:logo_click",

  // Primary calls to action
  CTA_CLICK: "cta:click",

  // Section visibility (fired once per section via IntersectionObserver)
  SECTION_VIEW: "section:view",

  // Scroll depth milestones
  SCROLL_DEPTH: "engagement:scroll_depth",

  // Contact intent
  CONTACT_EMAIL_CLICK: "contact:email_click",
  CONTACT_FORM_SUBMIT: "contact:form_submit",

  // Stat / impact engagement
  IMPACT_COUNTER_COMPLETE: "impact:counter_complete",
} as const;

export type EventName = (typeof EVENTS)[keyof typeof EVENTS];

type Props = Record<string, unknown>;

/** Safe wrapper — no-ops cleanly if PostHog has not been initialised. */
export function track(event: EventName, properties?: Props) {
  if (typeof window === "undefined") return;
  try {
    posthog.capture(event, properties);
  } catch {
    /* analytics should never break the UI */
  }
}
