import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import {
  confirmPlaces,
  listExpiredHolds,
  releasePlaces,
  winterCapActive,
} from "@/lib/winter-capacity";
import type { EnrollmentChild } from "@/lib/winter-capacity-config";

export const dynamic = "force-dynamic";

const CANCELABLE = new Set<Stripe.PaymentIntent.Status>([
  "requires_payment_method",
  "requires_confirmation",
  "requires_action",
]);

/**
 * Runs every 5 minutes (vercel.json). Gives back places whose 30-minute
 * checkout hold or 48-hour waitlist offer ran out, but only after Stripe can no
 * longer collect payment for them: the payment is cancelled first, and a
 * payment that already went through is confirmed instead of released.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Not allowed." }, { status: 401 });
  }
  if (!winterCapActive()) {
    return NextResponse.json({ skipped: "cap not active" });
  }

  const stripe = getStripe();
  const expired = await listExpiredHolds();
  const byPayment = new Map<string, EnrollmentChild[]>();
  for (const child of expired) {
    const key = child.paymentIntentId || "";
    byPayment.set(key, [...(byPayment.get(key) ?? []), child]);
  }

  const summary = { released: 0, confirmed: 0, waiting: 0, errors: 0 };

  for (const [paymentIntentId, children] of byPayment) {
    const playerIds = children.map((c) => c.playerId);
    try {
      if (!paymentIntentId) {
        summary.released += (
          await releasePlaces(playerIds, "Expired with no payment started")
        ).length;
        continue;
      }
      if (!stripe) {
        summary.waiting += children.length;
        continue;
      }

      let intent = await stripe.paymentIntents.retrieve(paymentIntentId);
      if (CANCELABLE.has(intent.status)) {
        intent = await stripe.paymentIntents.cancel(paymentIntentId, {
          cancellation_reason: "abandoned",
        });
      }

      if (intent.status === "canceled") {
        summary.released += (
          await releasePlaces(playerIds, `Expired; payment ${paymentIntentId} cancelled`)
        ).length;
      } else if (intent.status === "succeeded") {
        // Paid at the last moment. Keep the places; the webhook records the rest.
        summary.confirmed += (
          await confirmPlaces({
            playerIds,
            paymentIntentId,
            paymentStatus: "paid",
            amountPaidCentsPerChild: Math.round(intent.amount / playerIds.length),
          })
        ).length;
      } else {
        // processing / requires_capture: Stripe may still collect. Check next run.
        summary.waiting += children.length;
      }
    } catch (error) {
      summary.errors += children.length;
      console.error("Releasing expired holds failed:", paymentIntentId, error);
    }
  }

  return NextResponse.json(summary);
}
