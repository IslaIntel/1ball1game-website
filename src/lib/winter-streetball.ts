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

type Session = { day: string; time: string; group: string; grade: string; gender: string };

export const WINTER_SCHEDULE: { day: string; sessions: Session[] }[] = [
  {
    day: "Monday",
    sessions: [
      { day: "Monday", time: "5–6 pm", group: "2nd grade girls", grade: "2nd Grade", gender: "Female" },
      { day: "Monday", time: "6–7 pm", group: "2nd grade boys", grade: "2nd Grade", gender: "Male" },
    ],
  },
  {
    day: "Wednesday",
    sessions: [
      { day: "Wednesday", time: "5–6 pm", group: "4th grade girls", grade: "4th Grade", gender: "Female" },
      { day: "Wednesday", time: "6–7 pm", group: "4th grade boys", grade: "4th Grade", gender: "Male" },
    ],
  },
  {
    day: "Thursday",
    sessions: [
      { day: "Thursday", time: "5–6 pm", group: "3rd grade girls", grade: "3rd Grade", gender: "Female" },
      { day: "Thursday", time: "6–7 pm", group: "3rd grade boys", grade: "3rd Grade", gender: "Male" },
    ],
  },
];

/** The weekly session a player attends, or null when it can't be told from grade and gender. */
export function winterSessionFor(player: Pick<PlayerInfo, "grade" | "gender">) {
  for (const day of WINTER_SCHEDULE) {
    const match = day.sessions.find(
      (s) => s.grade === player.grade && s.gender === player.gender,
    );
    if (match) return match;
  }
  return null;
}

export function winterSessionLabel(player: Pick<PlayerInfo, "grade" | "gender">) {
  const session = winterSessionFor(player);
  return session
    ? `${session.day}s, ${session.time} (${session.group})`
    : `${player.grade}: we'll email you to confirm the group`;
}
