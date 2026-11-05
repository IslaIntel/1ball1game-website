"use client";

import { useEffect, useState } from "react";
import { RegistrationForm } from "@/components/register/RegistrationForm";
import {
  SPRING_SEASON,
  WINTER_SEASON,
  type RegistrationSeason,
} from "@/lib/registration-status";
import {
  WINTER_CAP_ENABLED,
  type PublicSessionAvailability,
} from "@/lib/winter-capacity-config";
import { WINTER_SCHEDULE } from "@/lib/winter-streetball";

export function RegistrationFlow() {
  const [season, setSeason] = useState<RegistrationSeason | null>(null);

  if (season === WINTER_SEASON) {
    return <RegistrationForm onChangeSeason={() => setSeason(null)} />;
  }

  if (season === SPRING_SEASON) {
    return (
      <RegistrationForm
        season={SPRING_SEASON}
        requiresPayment={false}
        onChangeSeason={() => setSeason(null)}
      />
    );
  }

  return <SeasonPicker onSelect={setSeason} />;
}

function SeasonPicker({
  onSelect,
}: {
  onSelect: (season: RegistrationSeason) => void;
}) {
  const [availability, setAvailability] = useState<Record<string, PublicSessionAvailability>>({});

  useEffect(() => {
    if (!WINTER_CAP_ENABLED) return;
    let cancelled = false;
    void fetch("/api/sessions", { cache: "no-store" })
      .then((r) => r.json())
      .then((data: { sessions?: PublicSessionAvailability[] }) => {
        if (cancelled || !data.sessions) return;
        setAvailability(Object.fromEntries(data.sessions.map((s) => [s.id, s])));
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="mx-auto max-w-5xl">
      <p className="eyebrow text-ink/50">Registration</p>
      <h1 className="mt-4 font-display text-[clamp(2.4rem,5vw,3.8rem)] font-semibold leading-[0.98] text-ink">
        Choose a <span className="text-magenta">season</span>
      </h1>

      <div className="mt-10 grid items-start gap-4 lg:grid-cols-2">
        <button
          type="button"
          onClick={() => onSelect(WINTER_SEASON)}
          className="rounded-[1.75rem] border border-ink/10 bg-cloud px-6 py-7 text-left shadow-[0_24px_50px_-36px_rgba(10,17,56,0.45)] transition-colors hover:border-magenta"
        >
          <span className="block font-display text-3xl font-semibold leading-tight text-ink">
            Winter Indoor Streetball
          </span>
          <span className="mt-3 block text-sm font-semibold leading-snug text-ink">
            $175 for 6 weekly sessions
            <span className="mt-1 block">
              Weeks of Nov 30th – Jan 18th (Make up week of Jan 25th)
            </span>
            <span className="mt-2 block text-magenta">
              Very limited availability
            </span>
          </span>
          <span className="mt-3 block text-sm leading-relaxed text-ink/65">
            Winter Streetball at Lemon Road provides a fast-paced, indoor
            free-play environment designed to encourage creativity, quick
            decision-making, and confidence on the ball. Structured around
            small-sided games in the gym, the program allows players to compete
            and experiment naturally away from the pressure of regular league
            play. Professional coaches oversee every session, using the flow of
            the games to guide technical development and keep the environment
            fun and competitive.
          </span>
          <span className="mt-4 block text-sm leading-relaxed text-ink">
            <span className="block font-semibold">Program details</span>
            <span className="mt-2 block text-ink/70">
              <span className="font-semibold text-ink">Eligible players:</span>{" "}
              2nd, 3rd, and 4th graders
            </span>
            <span className="mt-1 block text-ink/70">
              <span className="font-semibold text-ink">Session format:</span>{" "}
              1-hour blocks, organized into age and gender-specific groups to
              ensure a fair and balanced playing environment.
            </span>
            <span className="mt-1 block text-ink/70">
              <span className="font-semibold text-ink">Location:</span> Lemon
              Road Elementary Gym
            </span>
            <span className="mt-1 block text-ink/70">
              <span className="font-semibold text-ink">Coaching:</span> Led by
              professional coaches focused on facilitating safe, fluid gameplay
              and providing in-the-moment instruction.
            </span>
          </span>
          <span className="mt-4 block text-sm text-ink">
            <span className="block font-semibold">Weekly schedule</span>
            <span className="mt-2 grid gap-2 text-ink/70">
              {WINTER_SCHEDULE.map((day) => (
                <span key={day.day}>
                  <span className="block font-semibold text-ink">{day.day}</span>
                  {day.sessions.map((session) => {
                    const status = availability[session.id];
                    return (
                      <span key={session.id} className="flex flex-wrap items-center gap-x-2">
                        <span>
                          {session.time} · {session.group}
                        </span>
                        {status ? (
                          <span
                            className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                              status.available
                                ? "bg-magenta text-cloud shadow-sm"
                                : "bg-magenta/10 text-magenta-deep"
                            }`}
                          >
                            {status.label}
                          </span>
                        ) : null}
                      </span>
                    );
                  })}
                </span>
              ))}
            </span>
          </span>
        </button>

        <button
          type="button"
          onClick={() => onSelect(SPRING_SEASON)}
          className="rounded-[1.75rem] border border-ink/10 bg-cloud px-6 py-7 text-left shadow-[0_24px_50px_-36px_rgba(10,17,56,0.45)] transition-colors hover:border-magenta"
        >
          <span className="block font-display text-3xl font-semibold leading-tight text-ink">
            Spring PTA Rec Soccer
          </span>
          <span className="mt-3 block text-sm font-semibold leading-snug text-ink">
            Grades K–6
            <span className="mt-1 block">
              Interest only registration - no payment required
            </span>
          </span>
          <span className="mt-3 block text-sm leading-relaxed text-ink/65">
            Returning in April, the PTA Soccer Rec Program brings the game back
            to the grass fields for a fun, parent-led spring season for
            Kindergarten through 6th grade. Please register today to express
            your interest so we can accurately request our county field
            allocations. NO PAYMENT REQUIRED TODAY - REGISTERING INTEREST ONLY.
            Practice dates and game days to be released in January.
          </span>
        </button>
      </div>
    </div>
  );
}
