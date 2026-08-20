import type Stripe from "stripe";
import { registrationTotalCents } from "@/lib/registration";

export type ScholarshipLookup = {
  code: string;
  couponId: string;
  promotionCodeId?: string;
  amountDueCents: number;
  discountCents: number;
  percentOff: number | null;
};

export type ScholarshipRedeemResult = ScholarshipLookup & {
  invoiceId?: string;
  customerId?: string;
  redemption: "invoice" | "deactivated";
};

function normalizeCode(raw: string) {
  return raw.trim();
}

function couponDiscountCents(coupon: Stripe.Coupon, subtotalCents: number) {
  if (coupon.percent_off != null) {
    return Math.min(
      subtotalCents,
      Math.round(subtotalCents * (coupon.percent_off / 100)),
    );
  }
  if (coupon.amount_off != null) {
    return Math.min(subtotalCents, coupon.amount_off);
  }
  return 0;
}

function couponIsRedeemable(coupon: Stripe.Coupon) {
  if (!coupon.valid) return "This scholarship code is no longer valid.";
  if (coupon.redeem_by && coupon.redeem_by * 1000 < Date.now()) {
    return "This scholarship code has expired.";
  }
  if (
    coupon.max_redemptions != null &&
    coupon.times_redeemed >= coupon.max_redemptions
  ) {
    return "This scholarship code has already been used.";
  }
  return null;
}

function promotionIsRedeemable(promo: Stripe.PromotionCode) {
  if (!promo.active) return "This scholarship code has already been used.";
  if (promo.expires_at && promo.expires_at * 1000 < Date.now()) {
    return "This scholarship code has expired.";
  }
  if (
    promo.max_redemptions != null &&
    promo.times_redeemed >= promo.max_redemptions
  ) {
    return "This scholarship code has already been used.";
  }
  const coupon = couponFromPromotion(promo);
  if (coupon && typeof coupon !== "string") {
    const couponError = couponIsRedeemable(coupon);
    if (couponError) return couponError;
  }
  return null;
}

function couponFromPromotion(promo: Stripe.PromotionCode) {
  return promo.promotion?.coupon ?? null;
}

function toLookup(
  code: string,
  coupon: Stripe.Coupon,
  subtotalCents: number,
  promotionCodeId?: string,
): ScholarshipLookup {
  const discountCents = couponDiscountCents(coupon, subtotalCents);
  return {
    code,
    couponId: coupon.id,
    promotionCodeId,
    amountDueCents: Math.max(0, subtotalCents - discountCents),
    discountCents,
    percentOff: coupon.percent_off,
  };
}

export function assertFullScholarship(lookup: ScholarshipLookup) {
  if (lookup.amountDueCents > 0) {
    return "This code does not cover the full registration. Please use a 100% scholarship code or pay by card.";
  }
  return null;
}

async function findPromotionCode(stripe: Stripe, code: string) {
  const listed = await stripe.promotionCodes.list({
    code,
    limit: 1,
    expand: ["data.promotion.coupon"],
  });
  return listed.data[0] ?? null;
}

export async function lookupScholarshipCode(
  stripe: Stripe,
  rawCode: string,
  playerCount: number,
): Promise<{ ok: true; lookup: ScholarshipLookup } | { ok: false; error: string }> {
  const code = normalizeCode(rawCode);
  if (!code) {
    return { ok: false, error: "Enter a scholarship code." };
  }

  const subtotalCents = registrationTotalCents(playerCount);

  const promo = await findPromotionCode(stripe, code);
  if (promo) {
    const redeemError = promotionIsRedeemable(promo);
    if (redeemError) return { ok: false, error: redeemError };

    const attached = couponFromPromotion(promo);
    if (!attached) {
      return { ok: false, error: "This scholarship code is not valid." };
    }
    const coupon =
      typeof attached === "string"
        ? await stripe.coupons.retrieve(attached)
        : attached;
    const lookup = toLookup(promo.code, coupon, subtotalCents, promo.id);
    const scholarshipError = assertFullScholarship(lookup);
    if (scholarshipError) return { ok: false, error: scholarshipError };
    return { ok: true, lookup };
  }

  try {
    const coupon = await stripe.coupons.retrieve(code);
    const redeemError = couponIsRedeemable(coupon);
    if (redeemError) return { ok: false, error: redeemError };
    const lookup = toLookup(coupon.id, coupon, subtotalCents);
    const scholarshipError = assertFullScholarship(lookup);
    if (scholarshipError) return { ok: false, error: scholarshipError };
    return { ok: true, lookup };
  } catch {
    return { ok: false, error: "This scholarship code is not valid." };
  }
}

async function redeemViaInvoice(
  stripe: Stripe,
  lookup: ScholarshipLookup,
  context: {
    email: string;
    name: string;
    fingerprint: string;
    playerCount: number;
  },
) {
  const customer = await stripe.customers.create({
    email: context.email,
    name: context.name,
    metadata: {
      source: "1ball1game-website-register",
      season: "Fall 2026",
      registration_fingerprint: context.fingerprint,
      scholarship: "true",
    },
  });

  await stripe.invoiceItems.create({
    customer: customer.id,
    amount: registrationTotalCents(context.playerCount),
    currency: "usd",
    description: `Fall 2026 soccer registration (${context.playerCount} player${
      context.playerCount === 1 ? "" : "s"
    })`,
  });

  const invoice = await stripe.invoices.create({
    customer: customer.id,
    collection_method: "charge_automatically",
    auto_advance: false,
    pending_invoice_items_behavior: "include",
    discounts: lookup.promotionCodeId
      ? [{ promotion_code: lookup.promotionCodeId }]
      : [{ coupon: lookup.couponId }],
    metadata: {
      source: "1ball1game-website-register",
      season: "Fall 2026",
      scholarship: "true",
      registration_fingerprint: context.fingerprint,
      coupon_code: lookup.code,
      player_count: String(context.playerCount),
    },
  });

  if (!invoice.id) {
    throw new Error("Stripe did not return an invoice id.");
  }

  const finalized = await stripe.invoices.finalizeInvoice(invoice.id);
  if ((finalized.amount_due ?? 0) > 0) {
    throw new Error("Scholarship code did not reduce the balance to $0.");
  }

  if (finalized.status !== "paid") {
    await stripe.invoices.pay(invoice.id, { paid_out_of_band: true });
  }

  return {
    invoiceId: finalized.id,
    customerId: customer.id,
  };
}

async function deactivateOneUseCode(stripe: Stripe, lookup: ScholarshipLookup) {
  if (lookup.promotionCodeId) {
    await stripe.promotionCodes.update(lookup.promotionCodeId, { active: false });
    return;
  }
  throw new Error("Unable to mark this scholarship code as used.");
}

export async function redeemScholarshipCode(
  stripe: Stripe,
  rawCode: string,
  playerCount: number,
  context: {
    email: string;
    name: string;
    fingerprint: string;
  },
): Promise<
  { ok: true; result: ScholarshipRedeemResult } | { ok: false; error: string }
> {
  const found = await lookupScholarshipCode(stripe, rawCode, playerCount);
  if (!found.ok) return found;

  const { lookup } = found;
  try {
    const redeemed = await redeemViaInvoice(stripe, lookup, {
      ...context,
      playerCount,
    });
    return {
      ok: true,
      result: {
        ...lookup,
        ...redeemed,
        redemption: "invoice",
      },
    };
  } catch (error) {
    console.error("Stripe invoice scholarship redemption failed:", error);
    try {
      await deactivateOneUseCode(stripe, lookup);
      return {
        ok: true,
        result: {
          ...lookup,
          redemption: "deactivated",
        },
      };
    } catch (fallbackError) {
      console.error("Scholarship code deactivation failed:", fallbackError);
      return {
        ok: false,
        error:
          "Unable to apply this scholarship code. Please try again or contact info@1ball1game.org.",
      };
    }
  }
}
