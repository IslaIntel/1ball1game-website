"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";

type RegistrationSuccessProps = {
  playerNames: string;
  email: string;
};

const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: 0.08 * i, duration: 0.55, ease: [0.16, 1, 0.3, 1] as const },
  }),
};

export function RegistrationSuccess({
  playerNames,
  email,
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
            Registration received
          </span>
          <h1 className="mt-3 font-display text-3xl font-semibold text-ink sm:text-4xl">
            Welcome to the Fall Soccer Season
          </h1>
        </motion.div>

        <div className="space-y-6 px-6 py-8 sm:px-10 sm:py-10">
          <motion.div custom={1} variants={fadeUp} className="space-y-4 text-ink/70">
            <p>Dear Parent/Guardian,</p>
            <p>
              Thank you for registering{" "}
              <strong className="text-ink">{playerNames}</strong> for the{" "}
              <strong className="text-ink">1B1G Fall Soccer League</strong> in
              partnership with your school&apos;s PTA! We are thrilled to welcome
              your family to the program and are excited to serve your school
              community.
            </p>
            <p>
              A confirmation email will be sent to{" "}
              <strong className="text-ink">{email}</strong>.
            </p>
            <p>
              This season, <strong className="text-ink">1B1G</strong> and{" "}
              <strong className="text-ink">Surf Soccer Nation</strong> are
              operating hand-in-hand with your PTA leadership to build the most
              welcoming, fun, and engaging soccer environment possible for our
              players.
            </p>
            <p>
              Here is a look at what your active registration includes through
              1B1G and Surf Soccer:
            </p>
          </motion.div>

          <motion.div
            custom={2}
            variants={fadeUp}
            className="space-y-5 rounded-2xl border border-magenta/20 bg-magenta/5 px-5 py-5 sm:px-6"
          >
            <div>
              <h2 className="font-semibold text-magenta-deep">
                Player &amp; Coaching Development Modules
              </h2>
              <p className="mt-1.5 text-sm leading-relaxed text-ink/70">
                As part of your membership in 1B1G and our partnership with the
                national soccer brand, Surf Soccer, you will receive access to
                exclusive coaching and player training modules directly through
                their platform.
              </p>
            </div>
            <div>
              <h2 className="font-semibold text-magenta-deep">
                Direct Equipment Support for Your School
              </h2>
              <p className="mt-1.5 text-sm leading-relaxed text-ink/70">
                To keep as many of your registration dollars in your school as
                possible, 1B1G and Surf Soccer are making a donation of balls,
                pinnies, goals, and cones directly to your school&apos;s program.
              </p>
            </div>
          </motion.div>

          <motion.div custom={3} variants={fadeUp} className="space-y-3">
            <h2 className="font-display text-2xl font-semibold text-ink">
              What&apos;s Next?
            </h2>
            <p className="text-ink/70">
              As teams form and we work around the schedules of our parent
              volunteer coaches, you will receive a detailed email with practice
              times and rosters. Practices are set to begin the week of{" "}
              <strong className="text-ink">September 14th</strong>, with games
              played on Saturdays. Please keep an eye out for additional updates
              from 1B1G and your PTA in the coming weeks.
            </p>
            <p className="text-ink/70">
              Welcome to the club, and we look forward to an amazing fall season
              together!
            </p>
            <p className="text-ink/70">
              Best regards,
              <br />
              <strong className="text-ink">The 1B1G / Surf McLean Team</strong>
              <br />
              <span className="text-ink/55">
                In Partnership with Surf Soccer Nation &amp; Your School&apos;s
                PTA
              </span>
            </p>
          </motion.div>

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
