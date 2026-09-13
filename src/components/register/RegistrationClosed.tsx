"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect } from "react";
import { motion } from "framer-motion";
import { EVENTS, track } from "@/lib/analytics";
import {
  REGISTRATION_CLOSED_COPY,
  REGISTRATION_CONTACT_EMAIL,
  REGISTRATION_SEASON,
} from "@/lib/registration-status";

const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: 0.08 * i, duration: 0.55, ease: [0.16, 1, 0.3, 1] as const },
  }),
};

export function RegistrationClosed() {
  useEffect(() => {
    track(EVENTS.REGISTER_CLOSED_VIEW, { season: REGISTRATION_SEASON });
  }, []);

  return (
    <motion.div initial="hidden" animate="visible" className="mx-auto max-w-3xl">
      <div className="overflow-hidden rounded-[2rem] border border-ink/10 bg-cloud shadow-[0_30px_60px_-40px_rgba(10,17,56,0.35)]">
        <motion.div
          custom={0}
          variants={fadeUp}
          className="border-b border-ink/8 bg-gradient-to-b from-[#f6f5fb] to-cloud px-6 py-8 text-center sm:px-10"
        >
          <Image
            src="/images/logo.svg"
            alt="1 Ball 1 Game Foundation"
            width={72}
            height={70}
            priority
            className="mx-auto h-14 w-auto"
          />
          <p className="mt-4 text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-ink/45">
            In partnership with
          </p>
          <Image
            src="/images/surf-nation-logo.png"
            alt="Surf Nation"
            width={56}
            height={56}
            className="mx-auto mt-2 h-12 w-12 object-contain"
          />
          <span className="eyebrow mt-6 inline-flex items-center gap-2 rounded-full border border-ink/15 bg-ink/[0.04] px-4 py-1.5 !tracking-[0.18em] text-ink/55">
            <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-ink/30" />
            {REGISTRATION_CLOSED_COPY.badge}
          </span>
          <h1 className="mt-4 font-display text-3xl font-semibold text-ink sm:text-4xl">
            {REGISTRATION_CLOSED_COPY.heading}
          </h1>
        </motion.div>

        <div className="space-y-6 px-6 py-8 sm:px-10 sm:py-10">
          <motion.div custom={1} variants={fadeUp} className="space-y-4 text-ink/70">
            <p>Dear Parent/Guardian,</p>
            <p>{REGISTRATION_CLOSED_COPY.intro}</p>
            <p>
              We are grateful to every family, school PTA, and volunteer coach who
              made this season possible. Thanks to you,{" "}
              <strong className="text-ink">75% of every registration fee</strong>{" "}
              goes directly back to participating school PTAs.
            </p>
          </motion.div>

          <motion.div
            custom={2}
            variants={fadeUp}
            className="space-y-5 rounded-2xl border border-ink/10 bg-paper/70 px-5 py-5 sm:px-6"
          >
            <div>
              <h2 className="font-semibold text-ink">
                Already registered for {REGISTRATION_SEASON}?
              </h2>
              <p className="mt-1.5 text-sm leading-relaxed text-ink/70">
                Your player&apos;s spot is confirmed — nothing further is needed.
                As teams form around the schedules of our parent volunteer
                coaches, you will receive an email with practice times and
                rosters. Games are played on Saturdays.
              </p>
            </div>
            <div>
              <h2 className="font-semibold text-ink">
                Interested in the next season?
              </h2>
              <p className="mt-1.5 text-sm leading-relaxed text-ink/70">
                Email us at{" "}
                <a
                  href={`mailto:${REGISTRATION_CONTACT_EMAIL}?subject=Next%20season%20interest`}
                  className="font-medium text-magenta underline-offset-2 hover:underline"
                >
                  {REGISTRATION_CONTACT_EMAIL}
                </a>{" "}
                and we will notify your family first when registration reopens.
              </p>
            </div>
            <div>
              <h2 className="font-semibold text-ink">
                Are you a school or PTA leader?
              </h2>
              <p className="mt-1.5 text-sm leading-relaxed text-ink/70">
                We are already planning the next season with partner schools.
                Reach out and we will walk you through bringing 1B1G soccer to
                your community.
              </p>
            </div>
          </motion.div>

          <motion.div
            custom={3}
            variants={fadeUp}
            className="flex flex-wrap items-center gap-3"
          >
            <Link
              href="/"
              className="inline-flex rounded-full bg-magenta px-7 py-3.5 text-sm font-semibold text-cloud transition-colors hover:bg-magenta-deep"
            >
              Return home
            </Link>
            <Link
              href="/#partner"
              className="inline-flex rounded-full border border-ink/25 px-7 py-3.5 text-sm font-semibold text-ink transition-colors hover:border-ink hover:bg-ink hover:text-paper"
            >
              Partner with us
            </Link>
          </motion.div>
        </div>

        <motion.div
          custom={4}
          variants={fadeUp}
          className="border-t border-ink/8 bg-paper/60 px-6 py-5 text-center sm:px-10"
        >
          <p className="text-xs text-ink/50">
            Questions? Contact us at{" "}
            <a
              href={`mailto:${REGISTRATION_CONTACT_EMAIL}`}
              className="font-medium text-magenta underline-offset-2 hover:underline"
            >
              {REGISTRATION_CONTACT_EMAIL}
            </a>
          </p>
        </motion.div>
      </div>
    </motion.div>
  );
}
