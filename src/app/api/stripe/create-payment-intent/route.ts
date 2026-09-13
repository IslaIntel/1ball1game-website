import { NextResponse } from "next/server";
import {
  MAX_PLAYERS,
  registrationTotalCents,
  type RegistrationPayload,
} from "@/lib/registration";
import { registrationClosedResponse } from "@/lib/registration-guard";
import { registrationFingerprint } from "@/lib/registration-idempotency";
import { getClientIp } from "@/lib/client-ip";
import { getStripe } from "@/lib/stripe";
import {
  createOrReusePaymentIntent,
  syncPaymentIntentDetails,
} from "@/lib/stripe-payment-intent";
import { validateRegistrationPayload } from "@/lib/submit-registration";

type CreatePaymentIntentBody = RegistrationPayload;

export async function POST(request: Request) {
  const closed = registrationClosedResponse();
  if (closed) return closed;

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

  const { parent, players, volunteer, waivers, parentSignature = "" } = body;
  if (!parent || !Array.isArray(players) || players.length === 0 || !volunteer || !waivers) {
    return NextResponse.json({ error: "Incomplete registration." }, { status: 400 });
  }

  const payload: RegistrationPayload = {
    parent,
    players,
    volunteer,
    waivers,
    parentSignature,
  };
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
  const clientIp = getClientIp(request);

  try {
    const paymentIntent = await createOrReusePaymentIntent(stripe, {
      amount,
      email,
      playerCount,
      fingerprint,
    });

    await syncPaymentIntentDetails(
      stripe,
      paymentIntent.id,
      payload,
      clientIp,
      fingerprint,
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
  } catch (error) {
    console.error("Stripe paymentIntents.create failed:", error);
    return NextResponse.json(
      { error: "Unable to start payment. Please try again." },
      { status: 502 },
    );
  }
}
