"use client";

import { FEE_CENTS, formatUsd } from "@/lib/registration";

type PaymentSectionProps = {
  playerCount: number;
  totalCents: number;
  /** Stripe Payment Element mounts here once wired up tomorrow. */
  paymentReady?: boolean;
};

/**
 * Amount summary + Stripe mount point on the review step.
 * Tomorrow: wrap with Elements provider and render PaymentElement in #stripe-payment-element.
 */
export function PaymentSection({
  playerCount,
  totalCents,
  paymentReady = false,
}: PaymentSectionProps) {
  const feeDisplay = formatUsd(FEE_CENTS).replace(".00", "");

  return (
    <div className="rounded-2xl border border-magenta/25 bg-magenta/5 p-5">
      <div className="eyebrow text-magenta">Amount due</div>
      <div className="mt-2 flex items-baseline justify-between gap-4">
        <p className="text-ink/70">
          {playerCount} player{playerCount === 1 ? "" : "s"} × {feeDisplay}
        </p>
        <p className="font-display text-3xl font-semibold text-ink">
          {formatUsd(totalCents)}
        </p>
      </div>

      <div
        id="stripe-payment-element"
        className="mt-5 min-h-[120px] rounded-xl border border-ink/10 bg-cloud p-4"
        aria-hidden={!paymentReady}
      >
        {!paymentReady ? (
          <p className="text-sm text-ink/50">
            Secure card payment will appear here once Stripe is connected.
          </p>
        ) : null}
      </div>

      <p className="mt-3 text-sm text-ink/60">
        Payment completes your registration for the fall season. A confirmation
        email will follow.
      </p>
    </div>
  );
}
