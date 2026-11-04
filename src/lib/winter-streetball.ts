import type { PlayerInfo } from "@/lib/registration";

/** Program facts shown on the Winter confirmation screen and in the welcome email. */
export const WINTER_STREETBALL = {
  name: "Winter Streetball at Lemon Road",
  dates: "Weeks of Nov 30th – Jan 18th (Make up week of Jan 25th)",
  intro:
    "Winter Streetball at Lemon Road provides a fast-paced, indoor free-play environment designed to encourage creativity, quick decision-making, and confidence on the ball. Structured around small-sided games in the gym, the program allows players to compete and experiment naturally away from the pressure of regular league play. Professional coaches oversee every session, using the flow of the games to guide technical development and keep the environment fun and competitive.",
  details: [
    { label: "Eligible players", value: "2nd, 3rd, and 4th graders" },
    {
      label: "Session format",
      value:
        "1-hour blocks, organized into age and gender-specific groups to ensure a fair and balanced playing environment.",
    },
    { label: "Location", value: "Lemon Road Elementary Gym" },
    {
      label: "Coaching",
      value:
        "Led by professional coaches focused on facilitating safe, fluid gameplay and providing in-the-moment instruction.",
    },
  ],
} as const;

export type WinterSession = {
  id: string;
  day: string;
  time: string;
  group: string;
  grade: string;
  gender: string;
};

export const WINTER_SCHEDULE: { day: string; sessions: WinterSession[] }[] = [
  {
    day: "Monday",
    sessions: [
      { id: "winter-2026-mon-1700-2g", day: "Monday", time: "5–6 pm", group: "2nd grade girls", grade: "2nd Grade", gender: "Female" },
      { id: "winter-2026-mon-1800-2b", day: "Monday", time: "6–7 pm", group: "2nd grade boys", grade: "2nd Grade", gender: "Male" },
    ],
  },
  {
    day: "Wednesday",
    sessions: [
      { id: "winter-2026-wed-1700-4g", day: "Wednesday", time: "5–6 pm", group: "4th grade girls", grade: "4th Grade", gender: "Female" },
      { id: "winter-2026-wed-1800-4b", day: "Wednesday", time: "6–7 pm", group: "4th grade boys", grade: "4th Grade", gender: "Male" },
    ],
  },
  {
    day: "Thursday",
    sessions: [
      { id: "winter-2026-thu-1700-3g", day: "Thursday", time: "5–6 pm", group: "3rd grade girls", grade: "3rd Grade", gender: "Female" },
      { id: "winter-2026-thu-1800-3b", day: "Thursday", time: "6–7 pm", group: "3rd grade boys", grade: "3rd Grade", gender: "Male" },
    ],
  },
];

/** All six sessions, in schedule order. Session IDs match the capacity sheet. */
export const WINTER_SESSIONS: WinterSession[] = WINTER_SCHEDULE.flatMap((day) => day.sessions);

export function winterSessionById(id: string | undefined) {
  return WINTER_SESSIONS.find((s) => s.id === id) ?? null;
}

/** Sessions a player in this grade can join (both groups for that grade). */
export function winterSessionsForGrade(grade: string) {
  return WINTER_SESSIONS.filter((s) => s.grade === grade);
}

/**
 * The weekly session a player attends: the one the parent picked, or, when no
 * session was picked, the one that matches grade and gender.
 */
export function winterSessionFor(
  player: Pick<PlayerInfo, "grade" | "gender"> & { sessionId?: string },
) {
  const picked = winterSessionById(player.sessionId);
  if (picked) return picked;
  return (
    WINTER_SESSIONS.find((s) => s.grade === player.grade && s.gender === player.gender) ?? null
  );
}

export function winterSessionText(session: WinterSession) {
  return `${session.day}s, ${session.time} (${session.group})`;
}

export function winterSessionLabel(
  player: Pick<PlayerInfo, "grade" | "gender"> & { sessionId?: string },
) {
  const session = winterSessionFor(player);
  return session
    ? winterSessionText(session)
    : `${player.grade}: we'll email you to confirm the group`;
}
