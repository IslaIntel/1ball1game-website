"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import { formatUsd } from "@/lib/registration";
import { WINTER_STREETBALL } from "@/lib/winter-streetball";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "");

type Offer = {
  clientSecret?: string;
  alreadyPaid?: boolean;
  processing?: boolean;
  amountCents: number;
  playerName: string;
  session: string;
  expiresAt: string;
};

const card = "rounded-[2rem] border border-ink/10 bg-cloud p-6 shadow-[0_30px_60px_-40px_rgba(10,17,56,0.35)] sm:p-8";

export function OfferCheckout({ token }: { token: string }) {
  const [offer, setOffer] = useState<Offer | null>(null);
  const [error, setError] = useState("");
  const [paid, setPaid] = useState(false);

  useEffect(() => {
    if (!token) {
      setError("This link is missing its offer code. Please use the link from your email.");
      return;
    }
    let cancelled = false;
    void (async () => {
      const response = await fetch("/api/register/offer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const data = (await response.json().catch(() => null)) as (Offer & { error?: string }) | null;
      if (cancelled) return;
      if (
        !response.ok ||
        !data ||
        (!data.clientSecret && !data.alreadyPaid && !data.processing)
      ) {
        setError(data?.error ?? "This offer is no longer available.");
        return;
      }
      setOffer(data);
      if (data.alreadyPaid) setPaid(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  if (paid && offer) {
    return (
      <div className={card}>
        <span className="eyebrow text-magenta">Place confirmed</span>
        <h1 className="mt-3 font-display text-3xl font-semibold text-ink">
          {offer.playerName} is enrolled!
        </h1>
        <p className="mt-4 text-ink/70">
          Welcome to {WINTER_STREETBALL.name}: {offer.session}. A confirmation email
          is on its way.
        </p>
        <p className="mt-2 text-ink/70">{WINTER_STREETBALL.dates}</p>
        <Link
          href="/"
          className="mt-6 inline-flex rounded-full bg-magenta px-7 py-3.5 text-sm font-semibold text-cloud hover:bg-magenta-deep"
        >
          Return home
        </Link>
      </div>
    );
  }

  if (error) {
    return (
      <div className={card}>
        <span className="eyebrow text-magenta">Waitlist offer</span>
        <h1 className="mt-3 font-display text-3xl font-semibold text-ink">
          This offer can’t be used
        </h1>
        <p className="mt-4 text-ink/70">{error}</p>
        <p className="mt-2 text-ink/70">
          Questions? Email{" "}
          <a className="font-medium text-magenta" href="mailto:registration@1ball1game.org">
            registration@1ball1game.org
          </a>
          .
        </p>
      </div>
    );
  }

  if (!offer) {
    return (
      <div className={card}>
        <p className="text-ink/60">Loading your offer…</p>
      </div>
    );
  }

  const deadline = new Date(offer.expiresAt).toLocaleString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "America/New_York",
  });

  return (
    <div className={card}>
      <span className="eyebrow text-magenta">A place opened up</span>
      <h1 className="mt-3 font-display text-3xl font-semibold text-ink">
        Accept {offer.playerName}’s place
      </h1>
      <p className="mt-4 text-ink/70">
        {WINTER_STREETBALL.name}: <strong className="text-ink">{offer.session}</strong>
      </p>
      <p className="mt-1 text-ink/70">{WINTER_STREETBALL.dates}</p>
      <p className="mt-4 rounded-xl border border-magenta/20 bg-magenta/5 px-4 py-3 text-sm text-ink/75">
        We’re holding this place until <strong>{deadline} (Eastern)</strong>. Nothing is
        charged unless you pay below.
      </p>
      <div className="mt-6 flex items-baseline justify-between">
        <span className="text-ink/70">Amount due</span>
        <span className="font-display text-3xl font-semibold text-ink">
          {formatUsd(offer.amountCents)}
        </span>
      </div>
      <div className="mt-4">
        {offer.processing ? (
          <p className="rounded-xl border border-magenta/20 bg-magenta/5 px-4 py-3 text-sm text-ink/75">
            Your payment is processing. This page will not charge the card again.
            You can leave it open, or refresh in a few minutes for the confirmation.
          </p>
        ) : offer.clientSecret ? (
          <Elements stripe={stripePromise} options={{ clientSecret: offer.clientSecret }}>
            <OfferPaymentForm amountCents={offer.amountCents} onPaid={() => setPaid(true)} />
          </Elements>
        ) : null}
      </div>
    </div>
  );
}

function OfferPaymentForm({
  amountCents,
  onPaid,
}: {
  amountCents: number;
  onPaid: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  const pay = async () => {
    if (!stripe || !elements) return;
    setBusy(true);
    setMessage("");
    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      redirect: "if_required",
    });
    setBusy(false);
    if (error) {
      setMessage(error.message ?? "Payment could not be completed.");
      return;
    }
    if (paymentIntent?.status === "succeeded") onPaid();
    else setMessage("Payment was not completed. Please try again.");
  };

  return (
    <div className="space-y-4">
      <PaymentElement options={{ wallets: { applePay: "never", googlePay: "never", link: "never" } }} />
      {message ? <p className="text-sm text-magenta-deep">{message}</p> : null}
      <button
        type="button"
        onClick={() => void pay()}
        disabled={busy || !stripe}
        className="w-full rounded-full bg-magenta px-7 py-3.5 text-sm font-semibold text-cloud hover:bg-magenta-deep disabled:opacity-60"
      >
        {busy ? "Processing…" : `Accept and pay ${formatUsd(amountCents)}`}
      </button>
    </div>
  );
}
