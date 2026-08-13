import { NextResponse } from "next/server";
import type { RegistrationPayload } from "@/lib/registration";
import { encodeRegistrationMetadata } from "@/lib/registration-metadata";
import { validateRegistrationPayload } from "@/lib/submit-registration";
import { getClientIp } from "@/lib/client-ip";
import { getStripe } from "@/lib/stripe";

type SyncBody = {
  paymentIntentId: string;
  payload: RegistrationPayload;
};

export async function POST(request: Request) {
  const stripe = getStripe();
  if (!stripe) {
    return NextResponse.json({ error: "Payment is unavailable." }, { status: 503 });
  }

  let body: SyncBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { paymentIntentId, payload } = body;
  if (!paymentIntentId || !payload) {
    return NextResponse.json({ error: "Incomplete request." }, { status: 400 });
  }

  const validationErrors = validateRegistrationPayload(payload, { requireSignature: true });
  if (validationErrors) {
    return NextResponse.json(
      { error: "Please complete all required registration fields." },
      { status: 400 },
    );
  }

  const clientIp = getClientIp(request);

  try {
    await stripe.paymentIntents.update(paymentIntentId, {
      metadata: {
        player_count: String(payload.players.length),
        parent_signature: payload.parentSignature.trim(),
        client_ip: clientIp,
        ...encodeRegistrationMetadata(payload),
      },
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Stripe paymentIntents.update failed:", error);
    return NextResponse.json(
      { error: "Unable to save registration details." },
      { status: 502 },
    );
  }
}
