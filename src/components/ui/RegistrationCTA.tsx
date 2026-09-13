"use client";

import { CTAButton } from "@/components/ui/CTAButton";
import { EVENTS, track } from "@/lib/analytics";
import {
  REGISTRATION_CLOSED_COPY,
  REGISTRATION_OPEN,
  REGISTRATION_SEASON,
} from "@/lib/registration-status";

type RegistrationCTAProps = {
  marker: string;
  location: string;
  /** Shape classes shared by both the live and closed states. */
  className?: string;
  /** Extra classes applied only while registration is open (e.g. the magenta glow). */
  openClassName?: string;
  children?: React.ReactNode;
};

const closedClass =
  "relative inline-flex cursor-not-allowed select-none items-center justify-center gap-2.5 rounded-full border border-ink/15 bg-ink/[0.04] px-7 py-3.5 text-sm font-semibold tracking-wide text-ink/45";

export function RegistrationCTA({
  marker,
  location,
  className = "",
  openClassName = "",
  children = "Register Now",
}: RegistrationCTAProps) {
  if (REGISTRATION_OPEN) {
    return (
      <CTAButton
        href="/register"
        marker={marker}
        location={location}
        variant="solid"
        className={`${className} ${openClassName}`}
      >
        {children}
      </CTAButton>
    );
  }

  return (
    <button
      type="button"
      aria-disabled="true"
      title={`${REGISTRATION_SEASON} registration is closed`}
      onClick={() => track(EVENTS.REGISTER_CLOSED_CTA_CLICK, { marker, location })}
      className={`${closedClass} ${className}`}
    >
      <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-ink/25" />
      {REGISTRATION_CLOSED_COPY.ctaLabel}
    </button>
  );
}
