import Image from "next/image";
import { TrackedSection } from "@/components/analytics/TrackedSection";
import { AnimatedNumber } from "@/components/ui/AnimatedNumber";
import { Reveal } from "@/components/ui/Reveal";

const CUTS = [
  "Instructional assistants (IAs)",
  "Student support positions",
  "Classroom support services",
  "Enrichment opportunities",
];

export function WhyMatters() {
  return (
    <TrackedSection
      id="why"
      name="Why This Matters — School Funding"
      className="relative mx-auto max-w-7xl scroll-mt-28 px-5 py-24 sm:px-8 lg:py-32"
    >
      <div className="grid grid-cols-1 items-center gap-14 lg:grid-cols-12 lg:gap-12">
        <div className="order-2 lg:order-1 lg:col-span-5">
          <Reveal>
            <div className="relative aspect-square overflow-hidden rounded-[2.5rem] rounded-tl-[7rem] border border-ink/10 shadow-[0_30px_60px_-30px_rgba(10,17,56,0.4)]">
              <Image
                src="/images/impact-classroom-k2.png"
                alt="A teacher supporting kindergarten through 2nd grade students in a classroom"
                fill
                sizes="(max-width: 1024px) 100vw, 40vw"
                className="object-cover"
              />
            </div>
          </Reveal>
        </div>

        <div className="order-1 lg:order-2 lg:col-span-7">
          <Reveal>
            <span className="eyebrow text-magenta">Why this matters</span>
          </Reveal>

          <Reveal delay={0.05}>
            <div className="mt-6 flex flex-wrap items-end gap-x-4">
              <span className="font-display text-[clamp(3.5rem,9vw,7rem)] font-semibold leading-none text-ink">
                <AnimatedNumber value={28} prefix="$" suffix="M" />
              </span>
              <span className="pb-3 text-lg font-medium text-ink/60">
                projected school budget shortfall
              </span>
            </div>
          </Reveal>

          <Reveal delay={0.1}>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-ink/70">
              At a time when public schools face a projected $28
              million budget shortfall, schools are preparing for significant
              reductions. Your sponsorship helps them continue building strong,
              supportive environments for students — inside and outside the
              classroom.
            </p>
          </Reveal>

          <Reveal delay={0.15}>
            <div className="mt-8">
              <div className="eyebrow mb-4 text-ink/50">
                Schools are facing cuts to
              </div>
              <ul className="grid grid-cols-1 gap-px overflow-hidden rounded-2xl border border-ink/10 bg-ink/10 sm:grid-cols-2">
                {CUTS.map((cut) => (
                  <li
                    key={cut}
                    className="flex items-center gap-3 bg-paper px-5 py-4"
                  >
                    <span className="h-2 w-2 shrink-0 rounded-full bg-magenta" />
                    <span className="font-medium text-ink/80">{cut}</span>
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        </div>
      </div>
    </TrackedSection>
  );
}
