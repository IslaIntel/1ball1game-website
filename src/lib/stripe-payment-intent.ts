import type Stripe from "stripe";
import {
  FEE_CENTS,
  type RegistrationPayload,
} from "@/lib/registration";
import { encodeRegistrationMetadata } from "@/lib/registration-metadata";
import { REGISTRATION_SEASON } from "@/lib/registration-status";

const REUSABLE_STATUSES = new Set([
  "requires_payment_method",
  "requires_confirmation",
  "requires_action",
]);

/** Bump this if create params change so stale Stripe idempotency keys cannot collide. */
export const PAYMENT_INTENT_KEY_PREFIX = "reg_card_v3_";

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
}): Stripe.PaymentIntentCreateParams {
  return {
    amount: options.amount,
    currency: "usd",
    receipt_email: options.email,
    payment_method_types: ["card"],
    metadata: {
      player_count: String(options.playerCount),
      fee_per_player_cents: String(FEE_CENTS),
      season: REGISTRATION_SEASON,
      source: "1ball1game-website-register",
      registration_fingerprint: options.fingerprint,
      registration_submitted: "false",
    },
  };
}

export function extraPaymentIntentMetadata(
  payload: RegistrationPayload,
  clientIp: string,
  fingerprint: string,
): Stripe.MetadataParam {
  return {
    player_count: String(payload.players.length),
    fee_per_player_cents: String(FEE_CENTS),
    season: REGISTRATION_SEASON,
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
  },
) {
  const params = stablePaymentIntentParams(options);
  const idempotencyKey = `${PAYMENT_INTENT_KEY_PREFIX}${options.fingerprint}`;

  try {
    return await stripe.paymentIntents.create(params, { idempotencyKey });
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
) {
  try {
    await stripe.paymentIntents.update(paymentIntentId, {
      metadata: extraPaymentIntentMetadata(payload, clientIp, fingerprint),
    });
  } catch (error) {
    console.error("Stripe paymentIntents.update after create failed:", error);
  }
}
