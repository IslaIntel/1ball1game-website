"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import type { PlayerInfo } from "@/lib/registration";
import {
  WINTER_SCHEDULE,
  WINTER_STREETBALL,
  winterSessionLabel,
} from "@/lib/winter-streetball";
import { hasPlace, type EnrollmentChild } from "@/lib/winter-capacity-config";

type RegistrationSuccessProps = {
  players: PlayerInfo[];
  email: string;
  season: string;
  /** False for Spring interest sign-ups, where no payment is taken. */
  paid?: boolean;
  /** With the Winter session cap on: each child's place or waitlist spot. */
  outcome?: EnrollmentChild[];
};

const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: 0.08 * i, duration: 0.55, ease: [0.16, 1, 0.3, 1] as const },
  }),
};

function WinterConfirmation({
  players,
  email,
  outcome,
}: Pick<RegistrationSuccessProps, "players" | "email" | "outcome">) {
  const waitlisted = (i: number) => Boolean(outcome?.[i] && !hasPlace(outcome[i]));
  const allWaitlisted = Boolean(outcome?.length) && players.every((_, i) => waitlisted(i));
  const someWaitlisted = !allWaitlisted && players.some((_, i) => waitlisted(i));
  return (
    <>
      <motion.div custom={1} variants={fadeUp} className="space-y-4 text-ink/70">
        {allWaitlisted ? (
          <p>
            The session{players.length > 1 ? "s you picked are" : " you picked is"} full,
            so we&apos;ve added your family to the free waitlist.{" "}
            <strong className="text-ink">No payment was collected</strong> and no card
            is on file. Being on the waitlist does not guarantee a place. If one
            opens, we&apos;ll email <strong className="text-ink">{email}</strong> a
            link to accept it, and you only pay if you accept.
          </p>
        ) : (
          <p>
            Your registration is confirmed and we can&apos;t wait to see your{" "}
            {players.length > 1 ? "players" : "player"} in the gym.
            {someWaitlisted
              ? " Players marked waitlisted were not charged and are not guaranteed a place; if one opens, we’ll email you a link to accept it."
              : ""}{" "}
            A confirmation email with these details is on its way to{" "}
            <strong className="text-ink">{email}</strong>.
          </p>
        )}
      </motion.div>

      <motion.div
        custom={2}
        variants={fadeUp}
        className="rounded-2xl border border-magenta/20 bg-magenta/5 px-5 py-5 sm:px-6"
      >
        <h2 className="font-semibold text-magenta-deep">
          {allWaitlisted ? "Waitlist" : "Your weekly session"}
        </h2>
        <ul className="mt-3 divide-y divide-magenta/15">
          {players.map((player, i) => (
            <li
              key={i}
              className="flex flex-col gap-0.5 py-2.5 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4"
            >
              <span className="font-semibold text-ink">
                {player.firstName} {player.lastName}
              </span>
              <span className="text-sm text-ink/70">
                {waitlisted(i) ? (
                  <strong className="text-magenta-deep">
                    Waitlisted — no payment collected ·{" "}
                  </strong>
                ) : null}
                {winterSessionLabel(player)}
              </span>
            </li>
          ))}
        </ul>
      </motion.div>

      <motion.div custom={3} variants={fadeUp} className="space-y-6">
        <p className="leading-relaxed text-ink/70">{WINTER_STREETBALL.intro}</p>

        <div>
          <h2 className="font-display text-2xl font-semibold text-ink">
            Program details
          </h2>
          <dl className="mt-3 space-y-2 text-ink/70">
            {WINTER_STREETBALL.details.map((detail) => (
              <div key={detail.label}>
                <dt className="inline font-semibold text-ink">{detail.label}:</dt>{" "}
                <dd className="inline">{detail.value}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div>
          <h2 className="font-display text-2xl font-semibold text-ink">
            Weekly schedule
          </h2>
          <div className="mt-3 grid gap-4 sm:grid-cols-3">
            {WINTER_SCHEDULE.map((day) => (
              <div key={day.day} className="rounded-xl border border-ink/10 px-4 py-3">
                <p className="font-semibold text-ink">{day.day}</p>
                {day.sessions.map((session) => (
                  <p key={session.group} className="mt-1 text-sm text-ink/70">
                    {session.time} · {session.group}
                  </p>
                ))}
              </div>
            ))}
          </div>
        </div>

        <p className="text-ink/70">
          {allWaitlisted ? "Best," : "See you on the court,"}
          <br />
          <strong className="text-ink">The 1B1G Team</strong>
        </p>
      </motion.div>
    </>
  );
}

function InterestConfirmation({ season }: { season: string }) {
  return (
    <motion.div custom={1} variants={fadeUp} className="space-y-4 text-ink/70">
      <p>
        Thank you for your interest in the{" "}
        <strong className="text-ink">{season}</strong> soccer season. We have
        successfully received your information, and no payment has been
        collected or is due at this time.
      </p>
      <p>
        Over the next few weeks, we will be working directly with your
        school&apos;s PTA and Fairfax County Public Schools / Community Use to
        identify and secure local field space.
      </p>
      <p>
        We will follow up via email in late January (or once field space is
        confirmed) with official registration options. That update will
        include the exact practice dates, times, and field locations so you
        have the complete schedule before formally registering. Thank you for
        helping us build a great soccer environment for your school community.
      </p>
      <p>
        Best,
        <br />
        <strong className="text-ink">The 1B1G Team</strong>
      </p>
    </motion.div>
  );
}

export function RegistrationSuccess({
  outcome,
  players,
  email,
  season,
  paid = true,
}: RegistrationSuccessProps) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      className="mx-auto max-w-3xl"
    >
      <div className="overflow-hidden rounded-[2rem] border border-ink/10 bg-cloud shadow-[0_30px_60px_-40px_rgba(10,17,56,0.35)]">
        <motion.div
          custom={0}
          variants={fadeUp}
          className="border-b border-ink/8 bg-gradient-to-b from-[#fff7fb] to-cloud px-6 py-8 text-center sm:px-10"
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
          <span className="eyebrow mt-6 inline-block text-magenta">
            {!paid
              ? "Information received"
              : allChildrenWaitlisted(outcome)
                ? "On the waitlist"
                : "Registration confirmed"}
          </span>
          <h1 className="mt-3 font-display text-3xl font-semibold text-ink sm:text-4xl">
            {!paid
              ? "Thank you for your interest"
              : allChildrenWaitlisted(outcome)
                ? "You’re on the Winter Streetball waitlist"
                : `Welcome to ${WINTER_STREETBALL.name}!`}
          </h1>
          {paid ? (
            <p className="mt-3 font-semibold text-ink">{WINTER_STREETBALL.dates}</p>
          ) : null}
        </motion.div>

        <div className="space-y-6 px-6 py-8 sm:px-10 sm:py-10">
          {paid ? (
            <WinterConfirmation players={players} email={email} outcome={outcome} />
          ) : (
            <InterestConfirmation season={season} />
          )}

          <motion.div custom={4} variants={fadeUp}>
            <Link
              href="/"
              className="inline-flex rounded-full bg-magenta px-7 py-3.5 text-sm font-semibold text-cloud transition-colors hover:bg-magenta-deep"
            >
              Return home
            </Link>
          </motion.div>
        </div>

        <motion.div
          custom={5}
          variants={fadeUp}
          className="border-t border-ink/8 bg-paper/60 px-6 py-5 text-center sm:px-10"
        >
          <p className="text-xs text-ink/50">
            Questions? Contact us at{" "}
            <a
              href="mailto:registration@1ball1game.org"
              className="font-medium text-magenta underline-offset-2 hover:underline"
            >
              registration@1ball1game.org
            </a>
          </p>
        </motion.div>
      </div>
    </motion.div>
  );
}

function allChildrenWaitlisted(outcome: EnrollmentChild[] | undefined) {
  return Boolean(outcome?.length) && outcome!.every((child) => !hasPlace(child));
}
