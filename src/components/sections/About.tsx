import Image from "next/image";
import { TrackedSection } from "@/components/analytics/TrackedSection";
import { Reveal } from "@/components/ui/Reveal";

export function About() {
  return (
    <TrackedSection
      id="about"
      name="About the Foundation"
      className="relative mx-auto max-w-7xl scroll-mt-28 px-5 py-24 sm:px-8 lg:py-32"
    >
      <Reveal>
        <span className="eyebrow text-magenta">About the Foundation</span>
      </Reveal>

      <div className="mt-8 grid grid-cols-1 gap-14 lg:grid-cols-12 lg:gap-12">
        <div className="lg:col-span-7">
          <Reveal delay={0.05}>
            <h2 className="font-display text-[clamp(2rem,4.2vw,3.6rem)] font-semibold leading-[1.05] text-ink">
              Keep every kid in the game — and dollars in the schools.
            </h2>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="mt-8 max-w-2xl text-lg leading-relaxed text-ink/70">
              The 1 Ball 1 Game Foundation is committed to creating access,
              opportunity, and community through youth soccer. Through
              partnerships with local schools and businesses, we help fund youth
              programming, increase participation, and ensure every child has the
              opportunity to play, grow, and thrive through sport.
            </p>
          </Reveal>
          <Reveal delay={0.15}>
            <p className="mt-5 max-w-2xl text-lg leading-relaxed text-ink/70">
              Because we partner directly with independent PTAs, funds stay at the
              local school level — creating immediate, grassroots impact for
              students, teachers, and families without getting lost in larger
              bureaucracy.
            </p>
          </Reveal>

          <Reveal delay={0.2}>
            <div className="mt-10 rounded-3xl border border-ink/10 bg-cloud/60 p-7">
              <p className="font-display text-xl italic leading-snug text-ink">
                “A key component of our model is direct school impact: 75% of every
                registration fee goes directly back to participating schools’ PTAs
                to help fund critical needs and student support.”
              </p>
            </div>
          </Reveal>
        </div>

        <div className="lg:col-span-5">
          <Reveal delay={0.1}>
            <div className="relative aspect-[4/5] overflow-hidden rounded-[2.5rem] rounded-bl-[7rem] border border-ink/10 shadow-[0_30px_60px_-30px_rgba(10,17,56,0.4)]">
              <Image
                src="/images/community-team-k2.png"
                alt="A K–2 youth soccer team huddled together with hands stacked in unity"
                fill
                sizes="(max-width: 1024px) 100vw, 40vw"
                className="object-cover"
              />
            </div>
          </Reveal>
        </div>
      </div>
    </TrackedSection>
  );
}
