import type { RegistrationPayload } from "@/lib/registration";
import { hasPlace, type EnrollmentChild } from "@/lib/winter-capacity-config";
import {
  WINTER_SCHEDULE,
  WINTER_STREETBALL,
  winterSessionLabel,
} from "@/lib/winter-streetball";

const SITE_URL = "https://1ball1game.org";
const CONTACT_EMAIL = "registration@1ball1game.org";

const INK = "#0a1138";
const MUTED = "#4a5070";
const MAGENTA = "#e2269d";
const MAGENTA_DEEP = "#b81a7e";
const PAPER = "#f4eedf";

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export const WAITLIST_NOTE = "Waitlisted — no payment collected";

/**
 * Parent-facing email after a Winter Streetball registration. With the session
 * cap on, each child is either enrolled or waitlisted; waitlisted children are
 * never promised a place.
 */
export function buildWinterWelcomeEmail(
  payload: RegistrationPayload,
  enrollment?: EnrollmentChild[],
) {
  const parentFirst = payload.parent.firstName.trim() || "there";
  const players = payload.players.map((p, i) => {
    const child = enrollment?.[i];
    const waitlisted = child ? !hasPlace(child) : false;
    return {
      name: `${p.firstName.trim()} ${p.lastName.trim()}`.trim(),
      waitlisted,
      session: waitlisted
        ? `${WAITLIST_NOTE} · ${winterSessionLabel(p)}`
        : winterSessionLabel(p),
    };
  });
  const enrolledCount = players.filter((p) => !p.waitlisted).length;
  const allWaitlisted = enrolledCount === 0;
  const someWaitlisted = !allWaitlisted && enrolledCount < players.length;

  const subject = allWaitlisted
    ? `${WAITLIST_NOTE}: ${WINTER_STREETBALL.name}`
    : `Welcome to ${WINTER_STREETBALL.name}!`;
  const eyebrow = allWaitlisted ? "On the waitlist" : "Registration confirmed";
  const heading = allWaitlisted
    ? "You're on the Winter Streetball waitlist"
    : `Welcome to ${WINTER_STREETBALL.name}!`;
  const lead = allWaitlisted
    ? `The session${players.length > 1 ? "s you picked are" : " you picked is"} full, so we've added your family to the free waitlist. No payment was collected and no card is on file. Being on the waitlist does not guarantee a place. If one opens, we'll email you a link to accept it, and you only pay if you accept.`
    : someWaitlisted
      ? "Your registration is confirmed for the players with a place below, and we can't wait to see them in the gym. Players marked waitlisted were not charged and are not guaranteed a place. If one opens, we'll email you a link to accept it."
      : `Your registration is confirmed and we can't wait to see your player${players.length > 1 ? "s" : ""} in the gym.`;

  const text = [
    `Hi ${parentFirst},`,
    "",
    `${heading} ${lead}`,
    "",
    "YOUR PLAYERS",
    ...players.map((p) => `- ${p.name}: ${p.session}`),
    "",
    "PROGRAM DATES",
    WINTER_STREETBALL.dates,
    "",
    "ABOUT THE PROGRAM",
    WINTER_STREETBALL.intro,
    "",
    "PROGRAM DETAILS",
    ...WINTER_STREETBALL.details.map((d) => `${d.label}: ${d.value}`),
    "",
    "WEEKLY SCHEDULE",
    ...WINTER_SCHEDULE.flatMap((day) => [
      day.day,
      ...day.sessions.map((s) => `  ${s.time} · ${s.group}`),
    ]),
    "",
    `Questions? Reply to this email or contact us at ${CONTACT_EMAIL}.`,
    "",
    allWaitlisted ? "Best," : "See you on the court,",
    "The 1B1G Team",
    "1 Ball 1 Game Foundation",
  ].join("\n");

  const playerRows = players
    .map(
      (p) => `<tr>
  <td style="padding:10px 0;border-top:1px solid #f3d3e7;font-weight:600;color:${INK};">${escapeHtml(p.name)}</td>
  <td style="padding:10px 0;border-top:1px solid #f3d3e7;color:${MUTED};text-align:right;">${escapeHtml(p.session)}</td>
</tr>`,
    )
    .join("");

  const detailRows = WINTER_STREETBALL.details
    .map(
      (d) =>
        `<p style="margin:0 0 10px;color:${MUTED};"><strong style="color:${INK};">${d.label}:</strong> ${escapeHtml(d.value)}</p>`,
    )
    .join("");

  const scheduleRows = WINTER_SCHEDULE.map(
    (day) => `<td valign="top" style="padding:0 8px 0 0;width:33%;">
  <p style="margin:0 0 6px;font-weight:700;color:${INK};">${day.day}</p>
  ${day.sessions
    .map((s) => `<p style="margin:0 0 4px;color:${MUTED};font-size:14px;">${s.time} · ${s.group}</p>`)
    .join("")}
</td>`,
  ).join("");

  const html = `<!doctype html>
<html>
<body style="margin:0;padding:0;background:${PAPER};">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${PAPER};padding:24px 12px;">
<tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:20px;overflow:hidden;font-family:Helvetica,Arial,sans-serif;font-size:16px;line-height:1.6;">
  <tr><td style="background:#fff7fb;padding:32px 28px 24px;text-align:center;border-bottom:1px solid #eee;">
    <img src="${SITE_URL}/images/logo-email.png" alt="1 Ball 1 Game Foundation" height="56" style="height:56px;">
    <p style="margin:18px 0 0;font-size:12px;letter-spacing:2px;text-transform:uppercase;color:${MAGENTA};font-weight:700;">${eyebrow}</p>
    <h1 style="margin:8px 0 0;font-size:28px;line-height:1.2;color:${INK};">${escapeHtml(heading)}</h1>
    <p style="margin:10px 0 0;color:${INK};font-weight:600;">${escapeHtml(WINTER_STREETBALL.dates)}</p>
  </td></tr>
  <tr><td style="padding:28px;">
    <p style="margin:0 0 16px;color:${MUTED};">Hi ${escapeHtml(parentFirst)},</p>
    <p style="margin:0 0 20px;color:${MUTED};">${escapeHtml(lead)}</p>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#fdf2f9;border:1px solid #f3d3e7;border-radius:14px;padding:16px 18px;margin:0 0 24px;">
      <tr><td colspan="2" style="padding-bottom:6px;font-weight:700;color:${MAGENTA_DEEP};">${allWaitlisted ? "Waitlist" : "Your weekly session"}</td></tr>
      ${playerRows}
    </table>

    <p style="margin:0 0 20px;color:${MUTED};">${escapeHtml(WINTER_STREETBALL.intro)}</p>

    <h2 style="margin:0 0 12px;font-size:18px;color:${INK};">Program details</h2>
    ${detailRows}

    <h2 style="margin:24px 0 12px;font-size:18px;color:${INK};">Weekly schedule</h2>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>${scheduleRows}</tr></table>

    <p style="margin:28px 0 0;color:${MUTED};">${allWaitlisted ? "Best," : "See you on the court,"}<br><strong style="color:${INK};">The 1B1G Team</strong></p>
  </td></tr>
  <tr><td style="background:#faf7ef;padding:18px 28px;text-align:center;font-size:13px;color:#7a7f99;border-top:1px solid #eee;">
    Questions? Reply to this email or contact <a href="mailto:${CONTACT_EMAIL}" style="color:${MAGENTA};">${CONTACT_EMAIL}</a>
  </td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;

  return { subject, text, html };
}
