import { MAX_PLAYERS } from "@/lib/registration";

/**
 * Resolve the Stripe Payment Link for a given player count.
 *
 * Prefer per-count links (locked quantity) via NEXT_PUBLIC_STRIPE_PAYMENT_LINK_1…6.
 * Fall back to a single adjustable-quantity link: NEXT_PUBLIC_STRIPE_PAYMENT_LINK.
 *
 * Note: NEXT_PUBLIC_* must be referenced statically so Next can inline them
 * into the static export.
 */
const PAYMENT_LINKS_BY_COUNT = [
  process.env.NEXT_PUBLIC_STRIPE_PAYMENT_LINK_1,
  process.env.NEXT_PUBLIC_STRIPE_PAYMENT_LINK_2,
  process.env.NEXT_PUBLIC_STRIPE_PAYMENT_LINK_3,
  process.env.NEXT_PUBLIC_STRIPE_PAYMENT_LINK_4,
  process.env.NEXT_PUBLIC_STRIPE_PAYMENT_LINK_5,
  process.env.NEXT_PUBLIC_STRIPE_PAYMENT_LINK_6,
] as const;

const SHARED_PAYMENT_LINK = process.env.NEXT_PUBLIC_STRIPE_PAYMENT_LINK;

export function getStripePaymentLinkUrl(playerCount: number): string | null {
  if (playerCount < 1 || playerCount > MAX_PLAYERS) return null;

  const perCount = PAYMENT_LINKS_BY_COUNT[playerCount - 1]?.trim();
  if (perCount) return perCount;

  const shared = SHARED_PAYMENT_LINK?.trim();
  return shared || null;
}

export function buildStripeCheckoutUrl(options: {
  paymentLinkUrl: string;
  email: string;
  clientReferenceId: string;
}): string {
  const url = new URL(options.paymentLinkUrl);
  if (options.email) {
    url.searchParams.set("prefilled_email", options.email.trim());
  }
  if (options.clientReferenceId) {
    url.searchParams.set("client_reference_id", options.clientReferenceId);
  }
  return url.toString();
}

export function isStripePaymentLinkConfigured(playerCount = 1): boolean {
  return Boolean(getStripePaymentLinkUrl(playerCount));
}

export function hasPerCountPaymentLinks(): boolean {
  return Boolean(PAYMENT_LINKS_BY_COUNT[0]?.trim());
}
