import { NextResponse } from "next/server";
import {
  FEE_CENTS,
  MAX_PLAYERS,
  registrationTotalCents,
  type RegistrationPayload,
} from "@/lib/registration";
import { registrationFingerprint } from "@/lib/registration-idempotency";
import { encodeRegistrationMetadata } from "@/lib/registration-metadata";
import { validateRegistrationPayload } from "@/lib/submit-registration";
import { getStripe } from "@/lib/stripe";

type CreatePaymentIntentBody = RegistrationPayload;

export async function POST(request: Request) {
  const stripe = getStripe();
  if (!stripe) {
    return NextResponse.json(
      { error: "Payment is temporarily unavailable." },
      { status: 503 },
    );
  }

  let body: CreatePaymentIntentBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { parent, players, volunteer, waivers } = body;
  if (!parent || !Array.isArray(players) || players.length === 0 || !volunteer || !waivers) {
    return NextResponse.json({ error: "Incomplete registration." }, { status: 400 });
  }

  const payload: RegistrationPayload = { parent, players, volunteer, waivers };
  const validationErrors = validateRegistrationPayload(payload);
  if (validationErrors) {
    return NextResponse.json(
      { error: "Please complete all required registration fields." },
      { status: 400 },
    );
  }

  const playerCount = players.length;
  if (playerCount > MAX_PLAYERS) {
    return NextResponse.json(
      { error: `You can register up to ${MAX_PLAYERS} players at a time.` },
      { status: 400 },
    );
  }

  const amount = registrationTotalCents(playerCount);
  const email = parent.email.trim();
  const fingerprint = registrationFingerprint(payload);
  const idempotencyKey = `reg_${fingerprint}`;

  try {
    const paymentIntent = await stripe.paymentIntents.create(
      {
        amount,
        currency: "usd",
        receipt_email: email,
        payment_method_types: ["card"],
        metadata: {
          player_count: String(playerCount),
          fee_per_player_cents: String(FEE_CENTS),
          season: "Fall 2026",
          source: "1ball1game-website-register",
          registration_fingerprint: fingerprint,
          registration_submitted: "false",
          ...encodeRegistrationMetadata(payload),
        },
      },
      { idempotencyKey },
    );

    if (paymentIntent.status === "succeeded") {
      return NextResponse.json({
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        amount,
        alreadyPaid: true,
      });
    }

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      amount,
    });
  } catch {
    return NextResponse.json(
      { error: "Unable to start payment. Please try again." },
      { status: 502 },
    );
  }
}
