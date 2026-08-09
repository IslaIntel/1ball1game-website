import { NextResponse } from "next/server";
import {
  FEE_CENTS,
  MAX_PLAYERS,
  registrationTotalCents,
} from "@/lib/registration";
import { getStripe } from "@/lib/stripe";

type CreatePaymentIntentBody = {
  playerCount: number;
  parentEmail: string;
};

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

  const playerCount = Math.floor(Number(body.playerCount));
  if (!playerCount || playerCount < 1 || playerCount > MAX_PLAYERS) {
    return NextResponse.json({ error: "Invalid player count." }, { status: 400 });
  }

  const email = body.parentEmail?.trim();
  if (!email?.includes("@")) {
    return NextResponse.json({ error: "A valid email is required." }, { status: 400 });
  }

  const amount = registrationTotalCents(playerCount);

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: "usd",
      receipt_email: email,
      automatic_payment_methods: { enabled: true },
      metadata: {
        player_count: String(playerCount),
        fee_per_player_cents: String(FEE_CENTS),
        season: "Fall 2026",
        source: "1ball1game-website-register",
      },
    });

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      amount,
    });
  } catch {
    return NextResponse.json(
      { error: "Unable to start payment. Please try again." },
      { status: 502 },
    );
  }
}
