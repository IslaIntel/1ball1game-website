"use client";

import { FEE_CENTS, formatUsd, ptaReturnCents } from "@/lib/registration";

type PaymentSectionProps = {
  playerCount: number;
  totalCents: number;
  amountDueCents?: number;
  discountCents?: number;
  couponCode?: string;
  children?: React.ReactNode;
};

export function PaymentSection({
  playerCount,
  totalCents,
  amountDueCents = totalCents,
  discountCents = 0,
  couponCode,
  children,
}: PaymentSectionProps) {
  const feeDisplay = formatUsd(FEE_CENTS).replace(".00", "");
  const ptaCents = ptaReturnCents(totalCents);
  const scholarshipApplied = Boolean(couponCode && amountDueCents === 0);

  return (
    <div className="rounded-2xl border border-magenta/25 bg-magenta/5 p-5">
      <div className="eyebrow text-magenta">Amount due</div>
      <div className="mt-2 flex items-start justify-between gap-4">
        <div className="text-ink/70">
          <p>
            {playerCount} player{playerCount === 1 ? "" : "s"} × {feeDisplay}
          </p>
          {discountCents > 0 ? (
            <p className="mt-1 text-sm font-medium text-magenta-deep">
              Scholarship{couponCode ? ` · ${couponCode}` : ""} −
              {formatUsd(discountCents)}
            </p>
          ) : (
            <p className="mt-1 text-sm font-medium text-magenta-deep">
              ({formatUsd(ptaCents)} going right back to your school&apos;s PTA!)
            </p>
          )}
        </div>
        <div className="shrink-0 text-right">
          {discountCents > 0 ? (
            <p className="text-sm text-ink/40 line-through">{formatUsd(totalCents)}</p>
          ) : null}
          <p className="font-display text-3xl font-semibold text-ink">
            {formatUsd(amountDueCents)}
          </p>
        </div>
      </div>

      <div className="mt-5 min-h-[120px] rounded-xl border border-ink/10 bg-cloud p-4">
        {children}
      </div>

      <p className="mt-3 flex items-center gap-2 text-sm text-ink/60">
        <svg
          aria-hidden
          className="h-4 w-4 shrink-0 text-ink/45"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
          />
        </svg>
        <span>
          {scholarshipApplied ? (
            <>
              This registration is covered by a one-time scholarship code. No
              card payment is required.
            </>
          ) : (
            <>
              Card payments are securely processed by{" "}
              <strong className="font-semibold text-ink/70">Stripe</strong>. We
              never store your card details.
            </>
          )}
        </span>
      </p>

      <p className="mt-2 text-sm text-ink/60">
        {scholarshipApplied
          ? "Submitting completes your registration for the fall season. A confirmation email will follow."
          : "Payment completes your registration for the fall season. A confirmation email will follow."}
      </p>
    </div>
  );
}
