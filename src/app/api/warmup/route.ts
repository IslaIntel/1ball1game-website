import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";

export const dynamic = "force-dynamic";

/** Keeps Amplify SSR compute warm so the Stripe widget does not wait on a cold start. */
export async function GET() {
  const stripe = getStripe();
  return NextResponse.json(
    { ok: true, stripe: Boolean(stripe) },
    { headers: { "Cache-Control": "no-store" } },
  );
}
