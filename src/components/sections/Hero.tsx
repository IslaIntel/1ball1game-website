"use client";

import Image from "next/image";
import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { CTAButton } from "@/components/ui/CTAButton";
import { BallGlyph } from "@/components/ui/BallGlyph";

const container = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08, delayChildren: 0.15 } },
};
const item = {
  hidden: { opacity: 0, y: 32, filter: "blur(8px)" },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.9, ease: [0.16, 1, 0.3, 1] as const },
  },
};

export function Hero() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });
  const imgY = useTransform(scrollYProgress, [0, 1], [0, 120]);
  const textY = useTransform(scrollYProgress, [0, 1], [0, -60]);

  return (
    <div ref={ref} id="top" className="relative overflow-hidden pt-32 sm:pt-40">
      {/* Atmospheric background */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -left-40 top-10 h-[34rem] w-[34rem] rounded-full bg-sky/30 blur-[120px]" />
        <div className="absolute right-0 top-40 h-[28rem] w-[28rem] rounded-full bg-magenta/15 blur-[130px]" />
      </div>

      <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-12 px-5 pb-20 sm:px-8 lg:grid-cols-12 lg:gap-8 lg:pb-28">
        {/* Copy */}
        <motion.div
          style={{ y: textY }}
          variants={container}
          initial="hidden"
          animate="visible"
          className="lg:col-span-7"
        >
          <motion.div variants={item} className="mb-6 flex items-center gap-3">
            <span className="h-px w-10 bg-magenta" />
            <span className="eyebrow text-ink/60">
              1 Ball 1 Game Foundation
            </span>
          </motion.div>

          <h1 className="headline font-display text-[clamp(2.8rem,7.5vw,6.2rem)] font-semibold text-ink">
            <motion.span variants={item} className="block">
              Soccer that sends
            </motion.span>
            <motion.span variants={item} className="block">
              <span className="relative inline-block text-magenta">
                75% back
                <svg
                  className="absolute -bottom-2 left-0 w-full"
                  viewBox="0 0 300 16"
                  fill="none"
                  preserveAspectRatio="none"
                >
                  <motion.path
                    d="M2 11 C 60 4, 120 4, 180 8 S 260 13, 298 6"
                    stroke="var(--magenta)"
                    strokeWidth="4"
                    strokeLinecap="round"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 1.1, delay: 1, ease: "easeInOut" }}
                  />
                </svg>
              </span>{" "}
              to our schools.
            </motion.span>
          </h1>

          <motion.p
            variants={item}
            className="mt-8 max-w-xl text-lg leading-relaxed text-ink/70"
          >
            We create access, opportunity, and community through youth soccer —
            funding programming while returning the majority of every
            registration fee directly to participating school PTAs.
          </motion.p>

          <motion.div variants={item} className="mt-10 flex flex-wrap items-center gap-4">
            <CTAButton href="#partner" marker="hero_primary" location="hero">
              Partner With Us
            </CTAButton>
            <CTAButton
              href="#impact"
              marker="hero_secondary"
              location="hero"
              variant="outline"
            >
              See the impact
            </CTAButton>
          </motion.div>

          <motion.div
            variants={item}
            className="mt-12 flex flex-wrap items-center gap-x-10 gap-y-4 border-t border-ink/10 pt-6"
          >
            {[
              ["75%", "back to PTAs"],
              ["100%", "local impact"],
            ].map(([stat, label]) => (
              <div key={label}>
                <div className="font-display text-3xl font-semibold text-ink">
                  {stat}
                </div>
                <div className="eyebrow mt-1 text-ink/50">{label}</div>
              </div>
            ))}
          </motion.div>
        </motion.div>

        {/* Visual */}
        <div className="relative lg:col-span-5">
          <motion.div
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="relative"
          >
            <div className="relative aspect-[4/5] overflow-hidden rounded-[2.5rem] rounded-tr-[7rem] border border-ink/10 shadow-[0_40px_80px_-30px_rgba(10,17,56,0.45)]">
              <motion.div style={{ y: imgY }} className="absolute inset-0 -top-16 bottom-0">
                <Image
                  src="/images/hero-soccer-k2.png"
                  alt="Kindergarten through 2nd grade children playing youth soccer"
                  fill
                  priority
                  sizes="(max-width: 1024px) 100vw, 40vw"
                  className="object-cover"
                />
              </motion.div>
              <div className="absolute inset-0 bg-gradient-to-t from-ink/40 via-transparent to-transparent" />
            </div>

            {/* Floating ball */}
            <motion.div
              className="animate-float absolute -left-6 top-10 hidden sm:block"
              initial={{ opacity: 0, rotate: -40 }}
              animate={{ opacity: 1, rotate: 0 }}
              transition={{ delay: 0.7, duration: 0.8 }}
            >
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-royal shadow-xl">
                <BallGlyph className="animate-spin-slow h-11 w-11 text-cloud" />
              </div>
            </motion.div>

            {/* Floating 75% card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9, duration: 0.7 }}
              className="absolute -bottom-6 -right-3 w-52 rounded-2xl border border-ink/10 bg-paper/95 p-4 backdrop-blur-xl shadow-[0_20px_50px_-20px_rgba(10,17,56,0.5)] sm:-right-8"
            >
              <div className="eyebrow text-magenta">Direct school impact</div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="font-display text-4xl font-semibold text-ink">
                  75%
                </span>
                <span className="text-xs leading-tight text-ink/60">
                  of every fee → school PTAs
                </span>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
