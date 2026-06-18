"use client";

import { motion } from "framer-motion";
import { TrackedSection } from "@/components/analytics/TrackedSection";
import { AnimatedNumber } from "@/components/ui/AnimatedNumber";
import { Reveal, RevealGroup } from "@/components/ui/Reveal";
import { EVENTS, track } from "@/lib/analytics";

const USES = [
  {
    title: "Buy back cut positions",
    body: "Help schools restore instructional assistants and student-support roles lost to budget reductions.",
  },
  {
    title: "Educational resources",
    body: "Fund classroom materials, enrichment, and the everyday tools teachers rely on.",
  },
  {
    title: "Student needs",
    body: "Support school initiatives for the students and families who need them most.",
  },
];

const cardVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] as const } },
};

export function Impact() {
  return (
    <TrackedSection
      id="impact"
      name="The Impact — 75% Back to Schools"
      className="relative scroll-mt-24 overflow-hidden bg-ink py-24 text-cloud lg:py-32"
    >
      {/* gradient mesh */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -right-32 top-0 h-[36rem] w-[36rem] rounded-full bg-royal/50 blur-[140px]" />
        <div className="absolute -left-20 bottom-0 h-[28rem] w-[28rem] rounded-full bg-magenta/25 blur-[140px]" />
      </div>

      <div className="relative mx-auto max-w-7xl px-5 sm:px-8">
        <div className="grid grid-cols-1 items-end gap-10 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <Reveal>
              <span className="eyebrow text-sky">The impact · Beyond the field</span>
            </Reveal>
            <Reveal delay={0.05}>
              <h2 className="mt-6 font-display text-[clamp(2rem,4.5vw,3.8rem)] font-semibold leading-[1.04]">
                Unlike traditional youth sports, our model reinvests directly into
                schools.
              </h2>
            </Reveal>
          </div>
          <div className="lg:col-span-5">
            <Reveal delay={0.1}>
              <p className="text-lg leading-relaxed text-cloud/70">
                The majority of registration revenue is returned directly to
                participating schools through their PTAs — strengthening
                school-community partnerships at the grassroots level.
              </p>
            </Reveal>
          </div>
        </div>

        {/* The big number */}
        <div className="mt-16 grid grid-cols-1 items-center gap-12 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <div className="flex items-baseline">
              <AnimatedNumber
                value={75}
                suffix="%"
                className="font-display text-[clamp(7rem,18vw,15rem)] font-semibold leading-none text-cloud"
                onComplete={() => track(EVENTS.IMPACT_COUNTER_COMPLETE, { value: 75 })}
              />
            </div>
            <p className="mt-2 max-w-sm text-lg text-cloud/70">
              of every registration fee goes directly back to participating school
              PTAs.
            </p>
          </div>

          {/* Allocation bar */}
          <div className="lg:col-span-7">
            <Reveal>
              <div className="rounded-3xl border border-cloud/10 bg-cloud/[0.04] p-7 backdrop-blur-sm">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-cloud">
                    Where every registration dollar goes
                  </span>
                </div>
                <div className="mt-5 flex h-5 w-full overflow-hidden rounded-full bg-cloud/10">
                  <motion.div
                    className="flex items-center bg-magenta"
                    initial={{ width: 0 }}
                    whileInView={{ width: "75%" }}
                    viewport={{ once: true }}
                    transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
                  />
                  <motion.div
                    className="bg-azure"
                    initial={{ width: 0 }}
                    whileInView={{ width: "25%" }}
                    viewport={{ once: true }}
                    transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1], delay: 0.4 }}
                  />
                </div>
                <div className="mt-4 flex justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full bg-magenta" />
                    <span className="text-cloud/80">75% → School PTAs</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full bg-azure" />
                    <span className="text-cloud/80">25% → Program operations</span>
                  </div>
                </div>
              </div>
            </Reveal>
          </div>
        </div>

        {/* Uses of funds */}
        <RevealGroup className="mt-16 grid grid-cols-1 gap-5 md:grid-cols-3">
          {USES.map((use) => (
            <motion.div
              key={use.title}
              variants={cardVariants}
              className="group rounded-3xl border border-cloud/10 bg-cloud/[0.03] p-7 transition-colors duration-300 hover:border-magenta/50 hover:bg-cloud/[0.06]"
            >
              <div className="font-display text-2xl font-medium text-cloud">
                {use.title}
              </div>
              <p className="mt-3 text-cloud/65">{use.body}</p>
            </motion.div>
          ))}
        </RevealGroup>
      </div>
    </TrackedSection>
  );
}
