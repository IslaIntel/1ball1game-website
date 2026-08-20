import { NextResponse } from "next/server";
import { MAX_PLAYERS, type RegistrationPayload } from "@/lib/registration";
import { registrationFingerprint } from "@/lib/registration-idempotency";
import { getClientIp } from "@/lib/client-ip";
import { redeemScholarshipCode } from "@/lib/stripe-coupon";
import { submitRegistration, validateRegistrationPayload } from "@/lib/submit-registration";
import { getStripe } from "@/lib/stripe";

type ScholarshipBody = {
  payload?: RegistrationPayload;
  promotionCode?: string;
};

export async function POST(request: Request) {
  const stripe = getStripe();
  if (!stripe) {
    return NextResponse.json(
      { error: "Scholarship registration is temporarily unavailable." },
      { status: 503 },
    );
  }

  let body: ScholarshipBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { payload, promotionCode } = body;
  if (!payload || !promotionCode?.trim()) {
    return NextResponse.json({ error: "Incomplete scholarship request." }, { status: 400 });
  }

  const validationErrors = validateRegistrationPayload(payload, {
    requireSignature: true,
  });
  if (validationErrors) {
    return NextResponse.json(
      { error: "Please complete all required registration fields." },
      { status: 400 },
    );
  }

  const playerCount = payload.players.length;
  if (playerCount < 1 || playerCount > MAX_PLAYERS) {
    return NextResponse.json({ error: "Invalid player count." }, { status: 400 });
  }

  const parentName = `${payload.parent.firstName.trim()} ${payload.parent.lastName.trim()}`.trim();
  const fingerprint = registrationFingerprint(payload);

  let redeemed: Awaited<ReturnType<typeof redeemScholarshipCode>>;
  try {
    redeemed = await redeemScholarshipCode(stripe, promotionCode, playerCount, {
      email: payload.parent.email.trim(),
      name: parentName,
      fingerprint,
    });
  } catch (error) {
    console.error("Scholarship code redemption failed:", error);
    return NextResponse.json(
      { error: "Unable to apply this scholarship code. Please try again." },
      { status: 502 },
    );
  }

  if (!redeemed.ok) {
    return NextResponse.json({ error: redeemed.error }, { status: 400 });
  }

  try {
    await submitRegistration(payload, {
      paymentStatus: "scholarship",
      couponCode: redeemed.result.code,
      stripeInvoiceId: redeemed.result.invoiceId,
      amountPaidCents: 0,
      clientIp: getClientIp(request),
    });

    return NextResponse.json({
      ok: true,
      amountDueCents: 0,
      couponCode: redeemed.result.code,
    });
  } catch (error) {
    console.error("Scholarship registration submit failed:", error);
    return NextResponse.json(
      {
        error:
          "The scholarship code was applied, but we could not finish saving your registration. Please email info@1ball1game.org.",
      },
      { status: 502 },
    );
  }
}
