import type Stripe from "stripe";
import type { RegistrationPayload } from "@/lib/registration";
import { encodeRegistrationMetadata } from "@/lib/registration-metadata";
import type { WinterStreetballPrice } from "@/lib/stripe-winter-product";

const REUSABLE_STATUSES = new Set([
  "requires_payment_method",
  "requires_confirmation",
  "requires_action",
]);

/** Bump this if create params change so stale Stripe idempotency keys cannot collide. */
export const PAYMENT_INTENT_KEY_PREFIX = "reg_card_v5_";

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
    (intent) => intent.metadata.registration_fingerprint === fingerprint,
  );

  const reusable = matches.find(
    (intent) => intent.amount === amount && REUSABLE_STATUSES.has(intent.status),
  );
  if (reusable) return reusable;

  return matches.find((intent) => intent.status === "succeeded") ?? null;
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
) {
  const params = stablePaymentIntentParams(options);
  const idempotencyKey = `${PAYMENT_INTENT_KEY_PREFIX}${options.fingerprint}${options.idempotencySuffix ?? ""}`;

  try {
    const intent = await stripe.paymentIntents.create(params, { idempotencyKey });
    if (intent.status === "canceled" && options.idempotencySuffix !== undefined) {
      // The hold expired and this payment was cancelled; start a fresh one.
      return await stripe.paymentIntents.create(params, {
        idempotencyKey: `${idempotencyKey}_${Date.now()}`,
      });
    }
    return intent;
  } catch (error) {
    const existing = await findExistingPaymentIntent(
      stripe,
      options.fingerprint,
      options.amount,
    );
    if (existing) return existing;

    if (!isStripeIdempotencyConflict(error)) {
      throw error;
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
