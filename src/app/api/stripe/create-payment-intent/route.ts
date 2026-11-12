import { after, NextResponse } from "next/server";
import { MAX_PLAYERS, type RegistrationPayload } from "@/lib/registration";
import { registrationClosedResponse } from "@/lib/registration-guard";
import { registrationFingerprint } from "@/lib/registration-idempotency";
import { getClientIp } from "@/lib/client-ip";
import { getStripe } from "@/lib/stripe";
import {
  createOrReusePaymentIntent,
  syncPaymentIntentDetails,
} from "@/lib/stripe-payment-intent";
import { validateRegistrationPayload } from "@/lib/submit-registration";
import { SPRING_SEASON, WINTER_SEASON } from "@/lib/registration-status";
import { getWinterStreetballPrice } from "@/lib/stripe-winter-product";
import {
  attachPayment,
  billableChildren,
  getRegistrationChildren,
  winterCapActive,
} from "@/lib/winter-capacity";

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

  const { parent, players, volunteer, waivers, parentSignature = "", season } = body;
  if (!parent || !Array.isArray(players) || players.length === 0 || !volunteer || !waivers) {
    return NextResponse.json({ error: "Incomplete registration." }, { status: 400 });
  }

  if (season === SPRING_SEASON) {
    return NextResponse.json(
      { error: "Spring 2027 registration does not require payment." },
      { status: 400 },
    );
  }

  if (season !== WINTER_SEASON) {
    return NextResponse.json(
      { error: "Choose Winter 2026 before paying." },
      { status: 400 },
    );
  }

  const payload: RegistrationPayload = {
    parent,
    players,
    volunteer,
    waivers,
    parentSignature,
    season: WINTER_SEASON,
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

  const email = parent.email.trim();
  const fingerprint = registrationFingerprint(payload);
  const clientIp = getClientIp(request);

  // Price lookup does not depend on the sheet, so start it before the capacity read.
  const pricePromise = getWinterStreetballPrice(stripe);
  void pricePromise.catch(() => undefined);

  // With the session cap on, charge only the children who hold a place.
  let capacity: { registrationId: string; billableIds: string[] } | null = null;
  if (winterCapActive()) {
    try {
      const { registrationId, children } = await getRegistrationChildren(payload);
      const billable = billableChildren(children);
      if (billable.length === 0) {
        return NextResponse.json(
          {
            error: "No places are being held for payment. Please go back and continue again.",
            waitlistOnly: children.length > 0,
          },
          { status: 409 },
        );
      }
      capacity = { registrationId, billableIds: billable.map((c) => c.playerId) };
    } catch (error) {
      console.error("Capacity lookup before payment failed:", error);
      return NextResponse.json(
        { error: "We could not confirm your places. Please try again." },
        { status: 502 },
      );
    }
  }

  try {
    const price = await pricePromise;
    const chargedCount = capacity ? capacity.billableIds.length : playerCount;
    const amount = price.unitAmount * chargedCount;
    const paymentIntent = await createOrReusePaymentIntent(stripe, {
      amount,
      email,
      playerCount: chargedCount,
      fingerprint,
      season: WINTER_SEASON,
      price,
      ...(capacity
        ? {
            extraMetadata: {
              registration_id: capacity.registrationId,
              billable_count: String(chargedCount),
              billable_player_ids: capacity.billableIds.join(","),
            },
            // Player numbers only, to stay well under Stripe's key length limit.
            idempotencySuffix: `_cap_${capacity.billableIds.map((id) => id.split(":").pop()).join("+")}`,
          }
        : {}),
    });

    if (!paymentIntent.client_secret) {
      return NextResponse.json(
        { error: "Unable to start payment. Please try again." },
        { status: 502 },
      );
    }

    // Recording the payment on the sheet and copying registration details onto
    // the intent are not needed to show the card form. Do them after the
    // response so parents are not stuck on "Connecting to secure payment…".
    const paymentIntentId = paymentIntent.id;
    after(async () => {
      try {
        if (capacity) {
          await attachPayment({
            playerIds: capacity.billableIds,
            paymentIntentId,
          });
        }
        await syncPaymentIntentDetails(
          stripe,
          paymentIntentId,
          payload,
          clientIp,
          fingerprint,
          price,
        );
      } catch (error) {
        console.error("Payment setup after the card form loaded failed:", error);
      }
    });

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
