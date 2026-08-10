import { NextResponse } from "next/server";
import Stripe from "stripe";
import { registrationTotalCents } from "@/lib/registration";
import { decodeRegistrationMetadata } from "@/lib/registration-metadata";
import { submitRegistration } from "@/lib/submit-registration";
import { getStripe } from "@/lib/stripe";

export const runtime = "nodejs";

async function handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  if (paymentIntent.metadata.registration_submitted === "true") {
    return;
  }

  const payload = decodeRegistrationMetadata(paymentIntent.metadata);
  if (!payload) {
    console.error("Stripe webhook: missing registration payload metadata", paymentIntent.id);
    return;
  }

  const playerCount = payload.players.length;
  const expectedAmount = registrationTotalCents(playerCount);
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

  await submitRegistration(payload, {
    paymentStatus: "paid",
    stripePaymentIntentId: paymentIntent.id,
    clientIp: paymentIntent.metadata.client_ip ?? "",
  });

  const stripe = getStripe();
  if (stripe) {
    await stripe.paymentIntents.update(paymentIntent.id, {
      metadata: { registration_submitted: "true" },
    });
  }
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
