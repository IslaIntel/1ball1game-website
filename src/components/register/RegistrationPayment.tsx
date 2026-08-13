"use client";

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import { PaymentSection } from "@/components/register/PaymentSection";
import type { RegistrationPayload } from "@/lib/registration";
import { registrationFingerprint } from "@/lib/registration-idempotency";

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "",
);

const stripeAppearance = {
  theme: "stripe" as const,
  variables: {
    colorPrimary: "#e2269d",
    colorBackground: "#ffffff",
    colorText: "#0a1138",
    colorDanger: "#b81a7e",
    fontFamily: "system-ui, sans-serif",
    borderRadius: "12px",
    spacingUnit: "4px",
  },
  rules: {
    ".Input": {
      border: "1px solid rgba(10, 17, 56, 0.15)",
      boxShadow: "none",
    },
    ".Input:focus": {
      border: "1px solid #e2269d",
      boxShadow: "none",
    },
  },
};

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

type PaymentFormProps = {
  onReadyChange?: (ready: boolean) => void;
  paymentIntentId: string | null;
};

const PaymentForm = forwardRef<RegistrationPaymentHandle, PaymentFormProps>(
  function PaymentForm({ onReadyChange, paymentIntentId }, ref) {
    const stripe = useStripe();
    const elements = useElements();
    const processingRef = useRef(false);

    useImperativeHandle(ref, () => ({
      isReady: () => Boolean(stripe && elements && paymentIntentId),
      async confirmPayment(payload: RegistrationPayload) {
        if (!stripe || !elements || !paymentIntentId) {
          return { ok: false, error: "Payment form is still loading. Please wait." };
        }
        if (processingRef.current) {
          return { ok: false, error: "Payment is already processing." };
        }

        processingRef.current = true;
        try {
          const syncResponse = await fetch("/api/stripe/sync-registration", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ paymentIntentId, payload }),
          });
          if (!syncResponse.ok) {
            const data = (await syncResponse.json().catch(() => null)) as {
              error?: string;
            } | null;
            return {
              ok: false,
              error: data?.error ?? "Unable to save your signature and registration details.",
            };
          }

          const { error: submitError } = await elements.submit();
          if (submitError) {
            return {
              ok: false,
              error: submitError.message ?? "Please check your payment details.",
            };
          }

          const { error, paymentIntent } = await stripe.confirmPayment({
            elements,
            redirect: "if_required",
          });

          if (error) {
            return {
              ok: false,
              error: error.message ?? "Payment could not be completed.",
            };
          }

          if (paymentIntent?.status !== "succeeded") {
            return {
              ok: false,
              error: "Payment was not completed. Please try again.",
            };
          }

          return { ok: true };
        } finally {
          processingRef.current = false;
        }
      },
    }));

    return (
      <PaymentElement
        onReady={() => onReadyChange?.(true)}
        onLoadError={() => onReadyChange?.(false)}
        options={{
          layout: {
            type: "accordion",
            defaultCollapsed: false,
          },
          paymentMethodOrder: ["card"],
          wallets: {
            applePay: "never",
            googlePay: "never",
            link: "never",
          },
        }}
      />
    );
  },
);

export const RegistrationPayment = forwardRef<
  RegistrationPaymentHandle,
  RegistrationPaymentProps
>(function RegistrationPayment(
  { payload, totalCents, playerCount, onReadyChange, onError },
  ref,
) {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [elementReady, setElementReady] = useState(false);
  const paymentFormRef = useRef<RegistrationPaymentHandle>(null);
  const fingerprint = useMemo(
    () => registrationFingerprint(payload),
    [payload],
  );

  useImperativeHandle(ref, () => ({
    isReady: () =>
      Boolean(clientSecret && elementReady && paymentFormRef.current?.isReady()),
    confirmPayment: async (payload: RegistrationPayload) => {
      if (!paymentFormRef.current) {
        return { ok: false, error: "Payment form is still loading. Please wait." };
      }
      return paymentFormRef.current.confirmPayment(payload);
    },
  }));

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setClientSecret(null);
    setPaymentIntentId(null);
    setElementReady(false);
    onReadyChange?.(false);

    async function createIntent() {
      const maxAttempts = 3;
      let lastError = "Unable to load payment form.";

      for (let attempt = 0; attempt < maxAttempts; attempt++) {
        try {
          const response = await fetch("/api/stripe/create-payment-intent", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });

          const data = (await response.json().catch(() => null)) as {
            clientSecret?: string;
            paymentIntentId?: string;
            alreadyPaid?: boolean;
            error?: string;
          } | null;

          if (cancelled) return;

          if (response.ok && data?.clientSecret && data?.paymentIntentId) {
            setClientSecret(data.clientSecret);
            setPaymentIntentId(data.paymentIntentId);
            setLoading(false);
            return;
          }

          lastError = data?.error ?? "Unable to load payment form.";
          const retryable = response.status >= 500 || response.status === 429;
          if (!retryable || attempt === maxAttempts - 1) {
            onError?.(lastError);
            setLoading(false);
            return;
          }
        } catch {
          if (cancelled) return;
          lastError = "Unable to load payment form.";
          if (attempt === maxAttempts - 1) {
            onError?.(lastError);
            setLoading(false);
            return;
          }
        }

        await new Promise((resolve) => setTimeout(resolve, 400 * 2 ** attempt));
        if (cancelled) return;
      }
    }

    createIntent();
    return () => {
      cancelled = true;
    };
  }, [fingerprint, onError, onReadyChange]);

  useEffect(() => {
    onReadyChange?.(Boolean(clientSecret && elementReady));
  }, [clientSecret, elementReady, onReadyChange]);

  return (
    <PaymentSection playerCount={playerCount} totalCents={totalCents}>
      {loading && !clientSecret ? (
        <p className="text-sm text-ink/50">Connecting to secure payment…</p>
      ) : clientSecret ? (
        <Elements
          stripe={stripePromise}
          options={{
            clientSecret,
            appearance: stripeAppearance,
          }}
        >
          <PaymentForm
            ref={paymentFormRef}
            paymentIntentId={paymentIntentId}
            onReadyChange={setElementReady}
          />
        </Elements>
      ) : (
        <p className="text-sm text-magenta-deep">
          Payment form unavailable. Please refresh or contact info@1ball1game.org.
        </p>
      )}
    </PaymentSection>
  );
});
