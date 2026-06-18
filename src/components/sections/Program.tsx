"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { TrackedSection } from "@/components/analytics/TrackedSection";
import { Reveal, RevealGroup } from "@/components/ui/Reveal";

const PILLARS = [
  {
    no: "01",
    title: "Grade-Based Teams",
    body: "Students are placed on teams with classmates from their same school and grade — a fun, familiar, supportive environment where friends play and grow together, on and off the field.",
  },
  {
    no: "02",
    title: "Home School Practices",
    body: "Every practice takes place directly at each participating school, making it easier for families to take part while strengthening school pride and community connection.",
  },
  {
    no: "03",
    title: "Community Through Sport",
    body: "We welcome new and beginner players, spark lasting friendships, deepen family involvement, and foster teamwork, confidence, and a real sense of belonging.",
  },
];

const cardVariants = {
  hidden: { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] as const } },
};

export function Program() {
  return (
    <TrackedSection
      id="program"
      name="Program Structure"
      className="relative scroll-mt-24 bg-paper-2 py-24 lg:py-32"
    >
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-7">
            <Reveal>
              <span className="eyebrow text-magenta">Program structure</span>
            </Reveal>
            <Reveal delay={0.05}>
              <h2 className="mt-6 font-display text-[clamp(2rem,4.5vw,3.8rem)] font-semibold leading-[1.04] text-ink">
                Built around the friendships kids already have.
              </h2>
            </Reveal>
          </div>
          <div className="lg:col-span-5">
            <Reveal delay={0.1}>
              <p className="text-lg leading-relaxed text-ink/70">
                One of the most unique aspects of the program is that it&apos;s
                intentionally designed to strengthen existing school communities
                and friendships.
              </p>
            </Reveal>
          </div>
        </div>

        {/* Featured image */}
        <Reveal delay={0.1}>
          <div className="relative mt-12 aspect-[16/8] overflow-hidden rounded-[2rem] border border-ink/10 shadow-[0_30px_60px_-30px_rgba(10,17,56,0.4)]">
            <Image
              src="/images/program-practice-k2.png"
              alt="K–2 students running a soccer drill on a school field"
              fill
              sizes="100vw"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-ink/50 to-transparent" />
            <div className="absolute bottom-6 left-6 max-w-md">
              <span className="font-display text-2xl font-medium text-cloud sm:text-3xl">
                Practice right where they already belong — at school.
              </span>
            </div>
          </div>
        </Reveal>

        {/* Pillars */}
        <RevealGroup className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-3">
          {PILLARS.map((pillar) => (
            <motion.div
              key={pillar.no}
              variants={cardVariants}
              className="group relative overflow-hidden rounded-3xl border border-ink/10 bg-paper p-8 transition-all duration-300 hover:-translate-y-1 hover:border-ink/20 hover:shadow-[0_24px_50px_-30px_rgba(10,17,56,0.5)]"
            >
              <div className="font-mono text-sm font-medium text-magenta">
                {pillar.no}
              </div>
              <h3 className="mt-4 font-display text-2xl font-semibold text-ink">
                {pillar.title}
              </h3>
              <p className="mt-3 leading-relaxed text-ink/65">{pillar.body}</p>
              <div className="absolute -bottom-10 -right-10 h-28 w-28 rounded-full bg-sky/0 transition-colors duration-500 group-hover:bg-sky/20" />
            </motion.div>
          ))}
        </RevealGroup>
      </div>
    </TrackedSection>
  );
}
