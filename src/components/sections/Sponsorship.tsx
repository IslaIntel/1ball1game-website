"use client";

import { useEffect, useRef } from "react";
import { motion, useInView } from "framer-motion";
import { TrackedSection } from "@/components/analytics/TrackedSection";
import { Reveal } from "@/components/ui/Reveal";
import { BallGlyph } from "@/components/ui/BallGlyph";
import { EVENTS, track } from "@/lib/analytics";

type Tier = {
  id: string;
  name: string;
  price: string;
  amount: number;
  tagline: string;
  benefits: string[];
};

const PRESENTING: Tier = {
  id: "presenting",
  name: "Presenting Sponsor",
  price: "$25,000",
  amount: 25000,
  tagline: "Exclusive — one sponsor only",
  benefits: [
    'Exclusive "1 Ball 1 Game Presented By [Sponsor]" naming rights',
    "Sole recognition at the top sponsorship level",
    "Front-chest, exclusive logo on all jerseys & uniforms (~1,800 participants)",
    "Premier logo on all marketing, website, registration & enrollment emails",
    "Dedicated sponsor spotlight email to participating families",
    "Dedicated social media campaign highlighting your support",
    "Speaking opportunity at the End of Season Celebration",
    "Premium activation space at the End of Season Celebration",
    "Featured recognition in media outreach and press releases",
    "Promotional materials in participant welcome packets",
    "First right of refusal for future presenting sponsorships",
  ],
};

const TIERS: Tier[] = [
  {
    id: "gold",
    name: "Gold Sponsor",
    price: "$15,000",
    amount: 15000,
    tagline: "High visibility, full season",
    benefits: [
      "Large logo on back of jerseys & uniforms",
      "Logo on website, registration pages & promo materials",
      "Recognition in enrollment emails",
      "Social media recognition throughout the season",
      "Booth / table at the End of Season Celebration",
      "Opportunity to provide branded giveaways",
    ],
  },
  {
    id: "silver",
    name: "Silver Sponsor",
    price: "$10,000",
    amount: 10000,
    tagline: "Strong presence across the program",
    benefits: [
      "Logo placement on jerseys & uniforms",
      "Recognition on website & registration pages",
      "Recognition on event signage",
      "Social media recognition",
      "Recognition in sponsor communications",
    ],
  },
  {
    id: "bronze",
    name: "Bronze Sponsor",
    price: "$5,000",
    amount: 5000,
    tagline: "A meaningful first step",
    benefits: [
      "Logo on back of jerseys & uniforms",
      "Recognition on website",
      "Recognition in sponsor thank-you communication",
    ],
  },
];

function mailtoFor(tier: Tier) {
  const subject = encodeURIComponent(`Sponsorship inquiry — ${tier.name} (${tier.price})`);
  const body = encodeURIComponent(
    `Hi Kate,\n\nWe're interested in the ${tier.name} (${tier.price}) sponsorship for the 1 Ball 1 Game Foundation. Please send next steps.\n\nThank you,`,
  );
  return `mailto:kate@1ball1game.org?subject=${subject}&body=${body}`;
}

function Check() {
  return (
    <svg viewBox="0 0 20 20" className="mt-1 h-4 w-4 shrink-0" aria-hidden="true">
      <path
        d="M4 10.5l4 4 8-9"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function TierCard({ tier, featured }: { tier: Tier; featured?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-10%" });
  const viewed = useRef(false);

  useEffect(() => {
    if (inView && !viewed.current) {
      viewed.current = true;
      track(EVENTS.SPONSOR_TIER_VIEW, { tier: tier.id, amount: tier.amount });
    }
  }, [inView, tier.id, tier.amount]);

  const select = () =>
    track(EVENTS.SPONSOR_TIER_SELECT, { tier: tier.id, amount: tier.amount });
  const cta = () =>
    track(EVENTS.SPONSOR_TIER_CTA, { tier: tier.id, amount: tier.amount });

  if (featured) {
    return (
      <motion.div
        ref={ref}
        onClick={select}
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="relative overflow-hidden rounded-[2rem] bg-ink p-8 text-cloud shadow-[0_40px_80px_-40px_rgba(10,17,56,0.7)] sm:p-10"
      >
        <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-magenta/30 blur-[100px]" />
        <BallGlyph className="animate-spin-slow pointer-events-none absolute -bottom-8 -right-8 h-40 w-40 text-cloud/5" />

        <div className="relative grid grid-cols-1 gap-8 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <span className="inline-flex items-center gap-2 rounded-full bg-magenta px-3 py-1 text-xs font-semibold uppercase tracking-wider text-cloud">
              Exclusive opportunity
            </span>
            <h3 className="mt-5 font-display text-4xl font-semibold sm:text-5xl">
              {tier.name}
            </h3>
            <div className="mt-3 font-display text-6xl font-semibold text-magenta">
              {tier.price}
            </div>
            <p className="mt-3 text-cloud/60">{tier.tagline}</p>
            <a
              href={mailtoFor(tier)}
              onClick={cta}
              className="mt-8 inline-flex items-center gap-3 rounded-full bg-cloud px-7 py-3.5 text-sm font-semibold text-ink transition-transform hover:-translate-y-0.5"
            >
              Claim presenting rights
              <span className="h-1.5 w-1.5 rounded-full bg-magenta" />
            </a>
          </div>
          <ul className="grid grid-cols-1 gap-x-8 gap-y-3 sm:grid-cols-2 lg:col-span-7">
            {tier.benefits.map((b) => (
              <li key={b} className="flex gap-3 text-sm text-cloud/80">
                <span className="text-magenta">
                  <Check />
                </span>
                {b}
              </li>
            ))}
          </ul>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      ref={ref}
      onClick={select}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      className="group flex flex-col rounded-[1.75rem] border border-ink/10 bg-paper p-7 transition-all duration-300 hover:-translate-y-1.5 hover:border-ink/25 hover:shadow-[0_30px_60px_-35px_rgba(10,17,56,0.5)]"
    >
      <h3 className="font-display text-2xl font-semibold text-ink">{tier.name}</h3>
      <div className="mt-2 font-display text-4xl font-semibold text-ink">
        {tier.price}
      </div>
      <p className="mt-2 text-sm text-ink/55">{tier.tagline}</p>

      <ul className="mt-6 flex-1 space-y-3 border-t border-ink/10 pt-6">
        {tier.benefits.map((b) => (
          <li key={b} className="flex gap-2.5 text-sm text-ink/70">
            <span className="text-magenta">
              <Check />
            </span>
            {b}
          </li>
        ))}
      </ul>

      <a
        href={mailtoFor(tier)}
        onClick={cta}
        className="mt-7 inline-flex items-center justify-center gap-2 rounded-full border border-ink/20 px-5 py-3 text-sm font-semibold text-ink transition-colors duration-300 group-hover:bg-ink group-hover:text-paper"
      >
        Sponsor at this level
      </a>
    </motion.div>
  );
}

export function Sponsorship() {
  return (
    <TrackedSection
      id="sponsorship"
      name="Sponsorship Opportunities"
      className="relative scroll-mt-24 bg-paper-2 py-24 lg:py-32"
    >
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="max-w-2xl">
          <Reveal>
            <span className="eyebrow text-magenta">Sponsorship opportunities</span>
          </Reveal>
          <Reveal delay={0.05}>
            <h2 className="mt-6 font-display text-[clamp(2rem,4.8vw,3.8rem)] font-semibold leading-[1.04] text-ink">
              Choose the level that fits your impact.
            </h2>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="mt-5 text-lg leading-relaxed text-ink/70">
              Every tier puts your brand in front of families, schools, athletes,
              and community leaders — while directly supporting local schools
              during a critical funding period.
            </p>
          </Reveal>
        </div>

        <div className="mt-12">
          <TierCard tier={PRESENTING} featured />
        </div>

        <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-3">
          {TIERS.map((tier) => (
            <TierCard key={tier.id} tier={tier} />
          ))}
        </div>
      </div>
    </TrackedSection>
  );
}
