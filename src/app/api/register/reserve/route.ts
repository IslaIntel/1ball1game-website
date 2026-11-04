import { NextResponse } from "next/server";
import { FEE_CENTS, MAX_PLAYERS, type RegistrationPayload } from "@/lib/registration";
import { registrationClosedResponse } from "@/lib/registration-guard";
import { WINTER_SEASON } from "@/lib/registration-status";
import { getStripe } from "@/lib/stripe";
import { getWinterStreetballPrice } from "@/lib/stripe-winter-product";
import { validateRegistrationPayload } from "@/lib/submit-registration";
import {
  billableChildren,
  reservePlaces,
  winterCapActive,
} from "@/lib/winter-capacity";

/**
 * Checks places again at submit time and holds them. Each child gets a place
 * (held for 30 minutes while the parent pays) or a free waitlist spot.
 * Repeating the call for the same family does not take extra places.
 */
export async function POST(request: Request) {
  const closed = registrationClosedResponse();
  if (closed) return closed;

  if (!winterCapActive()) {
    return NextResponse.json({ error: "Session limits are not active." }, { status: 404 });
  }

  let payload: RegistrationPayload;
  try {
    payload = (await request.json()) as RegistrationPayload;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (payload?.season !== WINTER_SEASON || !Array.isArray(payload.players)) {
    return NextResponse.json({ error: "Choose Winter 2026 first." }, { status: 400 });
  }
  if (payload.players.length < 1 || payload.players.length > MAX_PLAYERS) {
    return NextResponse.json({ error: "Invalid player count." }, { status: 400 });
  }
  if (validateRegistrationPayload(payload)) {
    return NextResponse.json(
      { error: "Please complete all required registration fields." },
      { status: 400 },
    );
  }

  try {
    const stripe = getStripe();
    const unitPriceCents = stripe
      ? (await getWinterStreetballPrice(stripe)).unitAmount
      : FEE_CENTS;
    const { registrationId, children } = await reservePlaces(payload, unitPriceCents);
    const billable = billableChildren(children);
    return NextResponse.json({
      registrationId,
      children,
      billableCount: billable.length,
      unitPriceCents,
      amountDueCents: billable.length * unitPriceCents,
    });
  } catch (error) {
    console.error("Reserving places failed:", error);
    return NextResponse.json(
      { error: "We could not check places right now. Please try again in a moment." },
      { status: 502 },
    );
  }
}
