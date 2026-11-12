import type { RegistrationPayload } from "@/lib/registration";
import { registrationFingerprint } from "@/lib/registration-idempotency";
import {
  WINTER_CAP_ENABLED,
  hasPlace,
  type EnrollmentChild,
  type SessionAvailability,
} from "@/lib/winter-capacity-config";

/**
 * Server-side client for the Winter Streetball capacity script
 * (apps-script/winter-capacity). The script is the only counter: it holds the
 * lock, counts children, and writes each child before it answers.
 */

const SCRIPT_URL = process.env.CAPACITY_SCRIPT_URL;
const SCRIPT_SECRET = process.env.CAPACITY_SCRIPT_SECRET;

export function winterCapActive() {
  return WINTER_CAP_ENABLED && Boolean(SCRIPT_URL && SCRIPT_SECRET);
}

export class CapacityError extends Error {}

async function callScript<T>(action: string, body: Record<string, unknown> = {}): Promise<T> {
  if (!SCRIPT_URL || !SCRIPT_SECRET) {
    throw new CapacityError("The capacity script is not configured.");
  }
  // Apps Script answers POSTs with a redirect to the result; fetch follows it.
  const response = await fetch(SCRIPT_URL, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify({ ...body, action, secret: SCRIPT_SECRET }),
    cache: "no-store",
    redirect: "follow",
    // The sheet lock can wait 20s. Stop here before a stuck Google request
    // leaves the payment form on "Connecting…" until the platform kills it.
    signal: AbortSignal.timeout(35_000),
  });
  const text = await response.text();
  let data: { ok?: boolean; error?: string } & T;
  try {
    data = JSON.parse(text);
  } catch {
    throw new CapacityError(`Capacity script returned an unexpected response (${response.status}).`);
  }
  if (!data.ok) {
    throw new CapacityError(data.error || "Capacity script request failed.");
  }
  return data;
}

/** Stable per-family ID: the same family submitting again gets the same ID. */
export function registrationIdFor(payload: RegistrationPayload) {
  return `reg_${registrationFingerprint(payload)}`;
}

export function playerIdFor(registrationId: string, index: number) {
  return `${registrationId}:${index + 1}`;
}

export async function getAvailability() {
  const data = await callScript<{ sessions: SessionAvailability[] }>("availability");
  return data.sessions;
}

export async function reservePlaces(payload: RegistrationPayload, unitPriceCents: number) {
  const registrationId = registrationIdFor(payload);
  const data = await callScript<{ children: EnrollmentChild[] }>("reserve", {
    registrationId,
    unitPriceCents,
    parentName: `${payload.parent.firstName} ${payload.parent.lastName}`.trim(),
    parentEmail: payload.parent.email.trim(),
    children: payload.players.map((player, i) => ({
      playerId: playerIdFor(registrationId, i),
      sessionId: player.sessionId,
      playerName: `${player.firstName} ${player.lastName}`.trim(),
    })),
  });
  return { registrationId, children: orderChildren(registrationId, payload, data.children) };
}

export async function getRegistrationChildren(payload: RegistrationPayload) {
  const registrationId = registrationIdFor(payload);
  const data = await callScript<{ children: EnrollmentChild[] }>("registration", {
    registrationId,
  });
  return { registrationId, children: orderChildren(registrationId, payload, data.children) };
}

/** Put the script's rows back in form order so index i is player i. */
function orderChildren(
  registrationId: string,
  payload: RegistrationPayload,
  children: EnrollmentChild[],
) {
  return payload.players
    .map((_, i) => children.find((c) => c.playerId === playerIdFor(registrationId, i)))
    .filter((c): c is EnrollmentChild => Boolean(c));
}

/** Children who are being charged now (they hold a place that is not yet paid). */
export function billableChildren(children: EnrollmentChild[]) {
  return children.filter((c) => c.enrollmentStatus === "checkout_hold");
}

export function placeChildren(children: EnrollmentChild[]) {
  return children.filter(hasPlace);
}

export async function attachPayment(target: {
  registrationId?: string;
  playerIds?: string[];
  paymentIntentId: string;
}) {
  await callScript("attach_payment", target);
}

export async function confirmPlaces(target: {
  registrationId?: string;
  playerIds?: string[];
  paymentIntentId?: string;
  paymentStatus: "paid" | "scholarship";
  amountPaidCentsPerChild: number;
  notify?: boolean;
}) {
  const data = await callScript<{ confirmed: EnrollmentChild[] }>("confirm", target);
  return data.confirmed;
}

export async function releasePlaces(playerIds: string[], reason: string) {
  const data = await callScript<{ released: string[] }>("release", { playerIds, reason });
  return data.released;
}

export async function listExpiredHolds() {
  const data = await callScript<{ expired: EnrollmentChild[] }>("expired");
  return data.expired;
}

export async function lookupOffer(token: string) {
  try {
    const data = await callScript<{ child: EnrollmentChild }>("offer_lookup", { token });
    return { ok: true as const, child: data.child };
  } catch (error) {
    return {
      ok: false as const,
      error: error instanceof Error ? error.message : "This offer is no longer available.",
    };
  }
}
