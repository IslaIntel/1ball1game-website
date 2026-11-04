import { NextResponse } from "next/server";
import Stripe from "stripe";
import { registrationTotalCents } from "@/lib/registration";
import { WINTER_STREETBALL_PRODUCT_ID } from "@/lib/stripe-winter-product";
import { decodeRegistrationMetadata } from "@/lib/registration-metadata";
import { submitRegistration } from "@/lib/submit-registration";
import { getStripe } from "@/lib/stripe";
import {
  confirmPlaces,
  getRegistrationChildren,
  winterCapActive,
} from "@/lib/winter-capacity";

export const runtime = "nodejs";

async function markSubmitted(paymentIntentId: string) {
  const stripe = getStripe();
  if (stripe) {
    await stripe.paymentIntents.update(paymentIntentId, {
      metadata: { registration_submitted: "true" },
    });
  }
}

/** A waitlisted family accepted an offered place and paid for it. */
async function handleOfferPayment(paymentIntent: Stripe.PaymentIntent) {
  const playerId = paymentIntent.metadata.offer_player_id;
  await confirmPlaces({
    playerIds: [playerId],
    paymentIntentId: paymentIntent.id,
    paymentStatus: "paid",
    amountPaidCentsPerChild: paymentIntent.amount,
    notify: true,
  });
  await markSubmitted(paymentIntent.id);
}

async function handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  if (paymentIntent.metadata.registration_submitted === "true") {
    return;
  }

  if (paymentIntent.metadata.offer_player_id) {
    await handleOfferPayment(paymentIntent);
    return;
  }

  const payload = decodeRegistrationMetadata(paymentIntent.metadata);
  if (!payload) {
    console.error("Stripe webhook: missing registration payload metadata", paymentIntent.id);
    return;
  }

  const playerCount = payload.players.length;
  // With the session cap, only children who held a place were charged.
  const billableCount = Number(paymentIntent.metadata.billable_count);
  const chargedCount =
    Number.isInteger(billableCount) && billableCount > 0 ? billableCount : playerCount;
  const unitFromProduct = Number(paymentIntent.metadata.fee_per_player_cents);
  const expectedAmount =
    Number.isFinite(unitFromProduct) && unitFromProduct > 0
      ? unitFromProduct * chargedCount
      : registrationTotalCents(chargedCount);
  const productId = paymentIntent.metadata.stripe_product_id;
  if (productId && productId !== WINTER_STREETBALL_PRODUCT_ID) {
    console.error(
      "Stripe webhook: unexpected product",
      paymentIntent.id,
      productId,
    );
    return;
  }
  if (paymentIntent.amount !== expectedAmount) {
    console.error(
      "Stripe webhook: amount mismatch",
      paymentIntent.id,
      paymentIntent.amount,
      expectedAmount,
    );
    return;
  }

  const metadataPlayerCount = Number(paymentIntent.metadata.player_count);
  if (metadataPlayerCount !== playerCount) {
    console.error(
      "Stripe webhook: player count mismatch",
      paymentIntent.id,
      metadataPlayerCount,
      playerCount,
    );
    return;
  }

  const registrationId = paymentIntent.metadata.registration_id;
  let enrollment: Awaited<ReturnType<typeof getRegistrationChildren>>["children"] | undefined;
  if (registrationId) {
    if (!winterCapActive()) {
      throw new Error(`Capacity script not configured; cannot confirm ${registrationId}`);
    }
    // Repeating this for the same payment changes nothing, so a retried webhook is safe.
    await confirmPlaces({
      registrationId,
      paymentIntentId: paymentIntent.id,
      paymentStatus: "paid",
      amountPaidCentsPerChild: paymentIntent.amount / chargedCount,
    });
    enrollment = (await getRegistrationChildren(payload)).children;
  }

  await submitRegistration(payload, {
    paymentStatus: "paid",
    season: payload.season || paymentIntent.metadata.season,
    stripePaymentIntentId: paymentIntent.id,
    clientIp: paymentIntent.metadata.client_ip ?? "",
    amountPaidCents: paymentIntent.amount,
    ...(registrationId ? { registrationId, enrollment } : {}),
  });

  await markSubmitted(paymentIntent.id);
}

export async function POST(request: Request) {
  const stripe = getStripe();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!stripe || !webhookSecret) {
    return NextResponse.json(
      { error: "Stripe webhook is not configured." },
      { status: 503 },
    );
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing Stripe signature." }, { status: 400 });
  }

  const body = await request.text();
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (error) {
    console.error("Stripe webhook signature verification failed:", error);
    return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
  }

  try {
    if (event.type === "payment_intent.succeeded") {
      await handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent);
    }
  } catch (error) {
    console.error("Stripe webhook handler error:", error);
    return NextResponse.json({ error: "Webhook handler failed." }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
