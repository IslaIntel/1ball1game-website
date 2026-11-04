import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import {
  WINTER_STREETBALL_PRODUCT_ID,
  getWinterStreetballPrice,
} from "@/lib/stripe-winter-product";
import { WINTER_SEASON } from "@/lib/registration-status";
import { winterSessionById, winterSessionText } from "@/lib/winter-streetball";
import { attachPayment, lookupOffer, winterCapActive } from "@/lib/winter-capacity";

/**
 * Starts payment for a waitlist offer. The offered place is already reserved
 * by the capacity script; nothing is charged until the parent confirms the card.
 */
export async function POST(request: Request) {
  if (!winterCapActive()) {
    return NextResponse.json({ error: "Offers are not active." }, { status: 404 });
  }
  const stripe = getStripe();
  if (!stripe) {
    return NextResponse.json({ error: "Payment is temporarily unavailable." }, { status: 503 });
  }

  let token = "";
  try {
    token = String(((await request.json()) as { token?: string }).token ?? "");
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const offer = await lookupOffer(token);
  if (!offer.ok) {
    return NextResponse.json({ error: offer.error }, { status: 410 });
  }
  const child = offer.child;
  const session = winterSessionById(child.sessionId);

  try {
    const price = await getWinterStreetballPrice(stripe);
    const params = {
      amount: price.unitAmount,
      currency: "usd",
      receipt_email: child.parentEmail || undefined,
      description: `${price.productName} — waitlist offer`,
      payment_method_types: ["card"],
      metadata: {
        source: "1ball1game-website-offer",
        season: WINTER_SEASON,
        stripe_product_id: WINTER_STREETBALL_PRODUCT_ID,
        stripe_price_id: price.priceId,
        fee_per_player_cents: String(price.unitAmount),
        registration_id: child.registrationId,
        offer_player_id: child.playerId,
        registration_submitted: "false",
      },
    };
    let intent = await stripe.paymentIntents.create(params, {
      idempotencyKey: `offer_v1_${token}`,
    });
    if (intent.status === "canceled") {
      intent = await stripe.paymentIntents.create(params, {
        idempotencyKey: `offer_v1_${token}_${Date.now()}`,
      });
    }
    await attachPayment({ playerIds: [child.playerId], paymentIntentId: intent.id });

    return NextResponse.json({
      clientSecret: intent.client_secret,
      alreadyPaid: intent.status === "succeeded",
      amountCents: price.unitAmount,
      playerName: child.playerName,
      session: session ? winterSessionText(session) : child.sessionId,
      expiresAt: child.reservationExpiresAt,
    });
  } catch (error) {
    console.error("Offer payment setup failed:", error);
    return NextResponse.json({ error: "Unable to start payment. Please try again." }, { status: 502 });
  }
}
