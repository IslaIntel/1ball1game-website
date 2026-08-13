"use client";

import { forwardRef, useEffect, useImperativeHandle } from "react";
import { PaymentSection } from "@/components/register/PaymentSection";
import { FEE_CENTS, type RegistrationPayload } from "@/lib/registration";
import { registrationFingerprint } from "@/lib/registration-fingerprint";
import { saveRegistrationDraft } from "@/lib/registration-draft";
import {
  buildStripeCheckoutUrl,
  getStripePaymentLinkUrl,
  hasPerCountPaymentLinks,
} from "@/lib/stripe-payment-link";

export type RegistrationPaymentHandle = {
  confirmPayment: (
    payload: RegistrationPayload,
  ) => Promise<{ ok: true } | { ok: false; error: string }>;
  isReady: () => boolean;
};

type RegistrationPaymentProps = {
  payload: RegistrationPayload;
  totalCents: number;
  playerCount: number;
  onReadyChange?: (ready: boolean) => void;
  onError?: (message: string) => void;
};

/**
 * Hosted Stripe Payment Link checkout — no Amplify SSR / API routes required.
 * Draft registration is saved to sessionStorage; after Stripe redirects back
 * to /register/?paid=1 the form completes the Waves webhook submit.
 */
export const RegistrationPayment = forwardRef<
  RegistrationPaymentHandle,
  RegistrationPaymentProps
>(function RegistrationPayment(
  { totalCents, playerCount, onReadyChange, onError },
  ref,
) {
  const paymentLinkUrl = getStripePaymentLinkUrl(playerCount);
  const ready = Boolean(paymentLinkUrl);

  useEffect(() => {
    onReadyChange?.(ready);
    if (!ready) {
      onError?.(
        "Payment is temporarily unavailable. Please email info@1ball1game.org.",
      );
    }
  }, [ready, onReadyChange, onError]);

  useImperativeHandle(ref, () => ({
    isReady: () => ready,
    async confirmPayment(nextPayload: RegistrationPayload) {
      const link = getStripePaymentLinkUrl(nextPayload.players.length);
      if (!link) {
        return {
          ok: false,
          error:
            "Payment is temporarily unavailable. Please email info@1ball1game.org.",
        };
      }

      const fingerprint = registrationFingerprint(nextPayload);
      saveRegistrationDraft({
        payload: nextPayload,
        fingerprint,
        totalCents: nextPayload.players.length * FEE_CENTS,
        savedAt: new Date().toISOString(),
      });

      window.location.assign(
        buildStripeCheckoutUrl({
          paymentLinkUrl: link,
          email: nextPayload.parent.email,
          clientReferenceId: fingerprint,
        }),
      );

      return { ok: true };
    },
  }));

  return (
    <PaymentSection playerCount={playerCount} totalCents={totalCents}>
      {ready ? (
        <div className="space-y-2 text-sm text-ink/70">
          <p className="font-medium text-ink">Pay securely on Stripe Checkout</p>
          <p>
            Click <span className="font-semibold">Pay &amp; register</span> to
            open Stripe&apos;s hosted payment page. Your registration details are
            saved for when you return.
          </p>
          {!hasPerCountPaymentLinks() ? (
            <p className="text-ink/55">
              On Stripe, set the quantity to{" "}
              <strong className="font-semibold text-ink/70">{playerCount}</strong>{" "}
              so the total is correct.
            </p>
          ) : null}
        </div>
      ) : (
        <p className="text-sm text-magenta-deep">
          Payment form unavailable. Please refresh or contact info@1ball1game.org.
        </p>
      )}
    </PaymentSection>
  );
});
