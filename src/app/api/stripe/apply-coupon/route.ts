import { NextResponse } from "next/server";
import { MAX_PLAYERS } from "@/lib/registration";
import { registrationClosedResponse } from "@/lib/registration-guard";
import { lookupScholarshipCode } from "@/lib/stripe-coupon";
import { getWinterStreetballPrice } from "@/lib/stripe-winter-product";
import { getStripe } from "@/lib/stripe";

type ApplyCouponBody = {
  code?: string;
  playerCount?: number;
};

export async function POST(request: Request) {
  const closed = registrationClosedResponse();
  if (closed) return closed;

  const stripe = getStripe();
  if (!stripe) {
    return NextResponse.json(
      { error: "Scholarship codes are temporarily unavailable." },
      { status: 503 },
    );
  }

  let body: ApplyCouponBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const playerCount = Number(body.playerCount);
  if (!Number.isInteger(playerCount) || playerCount < 1 || playerCount > MAX_PLAYERS) {
    return NextResponse.json({ error: "Invalid player count." }, { status: 400 });
  }

  try {
    const price = await getWinterStreetballPrice(stripe);
    const result = await lookupScholarshipCode(
      stripe,
      body.code ?? "",
      playerCount,
      price.unitAmount,
    );
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    return NextResponse.json({
      code: result.lookup.code,
      amountDueCents: result.lookup.amountDueCents,
      discountCents: result.lookup.discountCents,
    });
  } catch (error) {
    console.error("Scholarship code lookup failed:", error);
    return NextResponse.json(
      { error: "Unable to check this scholarship code. Please try again." },
      { status: 502 },
    );
  }
}
