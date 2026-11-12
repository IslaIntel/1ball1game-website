import type Stripe from "stripe";
import type { RegistrationPayload } from "@/lib/registration";
import { encodeRegistrationMetadata } from "@/lib/registration-metadata";
import type { WinterStreetballPrice } from "@/lib/stripe-winter-product";

const REUSABLE_STATUSES = new Set([
  "requires_payment_method",
  "requires_confirmation",
  "requires_action",
]);

const IN_PROGRESS_STATUSES = new Set(["processing", "requires_capture"]);

/** Bump this if create params change so stale Stripe idempotency keys cannot collide. */
export const PAYMENT_INTENT_KEY_PREFIX = "reg_card_v6_";

export type PaymentAttempt = {
  intent: Stripe.PaymentIntent;
  idempotencyKey: string;
};

export function paymentAttemptKey(fingerprint: string, suffix?: string) {
  return `${PAYMENT_INTENT_KEY_PREFIX}${fingerprint}${suffix ?? ""}`;
}

export function stripeRequestId(error: unknown) {
  if (!error || typeof error !== "object" || !("requestId" in error)) return undefined;
  const requestId = (error as { requestId?: unknown }).requestId;
  return typeof requestId === "string" ? requestId : undefined;
}

/** Settled or still collectable. A canceled payment is neither. */
function isCurrentPayment(status: Stripe.PaymentIntent.Status) {
  return (
    status === "succeeded" ||
    IN_PROGRESS_STATUSES.has(status) ||
    REUSABLE_STATUSES.has(status)
  );
}

export function isStripeIdempotencyConflict(error: unknown) {
  if (!error || typeof error !== "object") return false;
  const typed = error as { type?: string; code?: string; message?: string };
  if (typed.type === "StripeIdempotencyError" || typed.type === "idempotency_error") {
    return true;
  }
  return Boolean(
    typed.message?.includes("Keys for idempotent requests can only be used"),
  );
}

export function stablePaymentIntentParams(options: {
  amount: number;
  email: string;
  playerCount: number;
  fingerprint: string;
  season: string;
  price: WinterStreetballPrice;
  extraMetadata?: Record<string, string>;
}): Stripe.PaymentIntentCreateParams {
  return {
    amount: options.amount,
    currency: "usd",
    receipt_email: options.email,
    description: options.price.productName,
    payment_method_types: ["card"],
    amount_details: {
      line_items: [
        {
          product_name: options.price.productName,
          quantity: options.playerCount,
          unit_cost: options.price.unitAmount,
        },
      ],
    },
    metadata: {
      player_count: String(options.playerCount),
      fee_per_player_cents: String(options.price.unitAmount),
      stripe_product_id: options.price.productId,
      stripe_price_id: options.price.priceId,
      season: options.season,
      source: "1ball1game-website-register",
      registration_fingerprint: options.fingerprint,
      registration_submitted: "false",
      ...options.extraMetadata,
    },
  };
}

export function extraPaymentIntentMetadata(
  payload: RegistrationPayload,
  clientIp: string,
  fingerprint: string,
  price?: WinterStreetballPrice,
): Stripe.MetadataParam {
  return {
    player_count: String(payload.players.length),
    ...(price
      ? {
          fee_per_player_cents: String(price.unitAmount),
          stripe_product_id: price.productId,
          stripe_price_id: price.priceId,
        }
      : {}),
    ...(payload.season ? { season: payload.season } : {}),
    source: "1ball1game-website-register",
    registration_fingerprint: fingerprint,
    registration_submitted: "false",
    client_ip: clientIp,
    parent_signature: payload.parentSignature.trim(),
    ...encodeRegistrationMetadata(payload),
  };
}

export async function findExistingPaymentIntent(
  stripe: Stripe,
  fingerprint: string,
  amount: number,
) {
  const listed = await stripe.paymentIntents.list({ limit: 40 });
  const matches = listed.data.filter(
    (intent) =>
      intent.metadata.registration_fingerprint === fingerprint &&
      intent.amount === amount,
  );

  return (
    matches.find((intent) => intent.status === "succeeded") ??
    matches.find((intent) => IN_PROGRESS_STATUSES.has(intent.status)) ??
    matches.find((intent) => REUSABLE_STATUSES.has(intent.status)) ??
    null
  );
}

/**
 * Stripe stores a create response for 24 hours. That copy keeps the status from
 * the moment of creation, so a payment canceled later still comes back as
 * `requires_payment_method`. Always retrieve the live payment before using it.
 * A replacement key includes the canceled id, so a retry and a second tab share
 * one new payment instead of each minting their own.
 */
export async function createPaymentAttempt(
  stripe: Stripe,
  params: Stripe.PaymentIntentCreateParams,
  idempotencyKey: string,
): Promise<PaymentAttempt> {
  const created = await stripe.paymentIntents.create(params, { idempotencyKey });
  const live = await stripe.paymentIntents.retrieve(created.id);
  if (live.status !== "canceled") {
    return { intent: live, idempotencyKey };
  }

  const replacementKey = `${idempotencyKey}_${live.id}`;
  const replacement = await stripe.paymentIntents.create(params, {
    idempotencyKey: replacementKey,
  });
  return {
    intent: await stripe.paymentIntents.retrieve(replacement.id),
    idempotencyKey: replacementKey,
  };
}

export async function createOrReusePaymentIntent(
  stripe: Stripe,
  options: {
    amount: number;
    email: string;
    playerCount: number;
    fingerprint: string;
    season: string;
    price: WinterStreetballPrice;
    extraMetadata?: Record<string, string>;
    /** Changes the idempotency key, e.g. when the number of paid places changes. */
    idempotencySuffix?: string;
  },
): Promise<PaymentAttempt> {
  const params = stablePaymentIntentParams(options);
  const idempotencyKey = paymentAttemptKey(
    options.fingerprint,
    options.idempotencySuffix,
  );

  const existing = await findExistingPaymentIntent(
    stripe,
    options.fingerprint,
    options.amount,
  );
  if (existing) {
    const live = await stripe.paymentIntents.retrieve(existing.id);
    if (isCurrentPayment(live.status)) {
      return { intent: live, idempotencyKey };
    }
  }

  try {
    return await createPaymentAttempt(stripe, params, idempotencyKey);
  } catch (error) {
    const recovered = await findExistingPaymentIntent(
      stripe,
      options.fingerprint,
      options.amount,
    );
    if (recovered) {
      const live = await stripe.paymentIntents.retrieve(recovered.id);
      if (isCurrentPayment(live.status)) {
        return { intent: live, idempotencyKey };
      }
    }
    throw error;
  }
}

export async function syncPaymentIntentDetails(
  stripe: Stripe,
  paymentIntentId: string,
  payload: RegistrationPayload,
  clientIp: string,
  fingerprint: string,
  price?: WinterStreetballPrice,
) {
  try {
    await stripe.paymentIntents.update(paymentIntentId, {
      metadata: extraPaymentIntentMetadata(payload, clientIp, fingerprint, price),
    });
  } catch (error) {
    console.error("Stripe paymentIntents.update after create failed:", error);
  }
}
