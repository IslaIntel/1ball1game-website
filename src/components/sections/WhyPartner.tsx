"use client";

import { motion } from "framer-motion";
import { TrackedSection } from "@/components/analytics/TrackedSection";
import { Reveal, RevealGroup } from "@/components/ui/Reveal";

const BENEFITS = [
  "Directly support local schools and students",
  "Help offset educational funding challenges in your community",
  "Increase access to youth sports and healthy activity",
  "Align your brand with education, teamwork, wellness, and inclusion",
  "Increase visibility within the local community",
  "Reach families, schools, athletes, and community leaders",
];

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] as const } },
};

export function WhyPartner() {
  return (
    <TrackedSection
      id="partner"
      name="Why Partner With Us"
      className="relative mx-auto max-w-7xl scroll-mt-28 px-5 py-24 sm:px-8 lg:py-32"
    >
      <div className="grid grid-cols-1 gap-12 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <div className="lg:sticky lg:top-32">
            <Reveal>
              <span className="eyebrow text-magenta">Why partner with us</span>
            </Reveal>
            <Reveal delay={0.05}>
              <h2 className="mt-6 font-display text-[clamp(2rem,4.5vw,3.4rem)] font-semibold leading-[1.05] text-ink">
                Good for kids. Good for schools. Good for your brand.
              </h2>
            </Reveal>
            <Reveal delay={0.1}>
              <p className="mt-6 text-lg leading-relaxed text-ink/70">
                By partnering with us, your organization makes a visible,
                meaningful difference during a critical funding period.
              </p>
            </Reveal>
          </div>
        </div>

        <RevealGroup
          className="grid grid-cols-1 gap-px overflow-hidden rounded-3xl border border-ink/10 bg-ink/10 sm:grid-cols-2 lg:col-span-8"
          stagger={0.07}
        >
          {BENEFITS.map((benefit, i) => (
            <motion.div
              key={benefit}
              variants={cardVariants}
              className="group flex flex-col justify-between gap-8 bg-paper p-8 transition-colors duration-300 hover:bg-cloud"
            >
              <span className="font-mono text-sm text-ink/40">
                {String(i + 1).padStart(2, "0")}
              </span>
              <p className="font-display text-xl leading-snug text-ink">
                {benefit}
              </p>
            </motion.div>
          ))}
        </RevealGroup>
      </div>
    </TrackedSection>
  );
}
