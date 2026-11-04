import { NextResponse } from "next/server";
import {
  MAX_PLAYERS,
  SPRING_WAIVERS,
  type RegistrationPayload,
} from "@/lib/registration";
import { validateRegistrationPayload } from "@/lib/submit-registration";
import { registrationClosedResponse } from "@/lib/registration-guard";
import { getClientIp } from "@/lib/client-ip";
import { SPRING_SEASON, WINTER_SEASON } from "@/lib/registration-status";
import { submitRegistration } from "@/lib/submit-registration";
import {
  getRegistrationChildren,
  placeChildren,
  winterCapActive,
} from "@/lib/winter-capacity";

/**
 * Saves a registration that does not take payment: Spring 2027 interest, and
 * (when the Winter cap is on) a Winter family whose children are all waitlisted.
 */
export async function POST(request: Request) {
  const closed = registrationClosedResponse();
  if (closed) return closed;

  let body: Partial<RegistrationPayload>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (body.season === WINTER_SEASON && winterCapActive()) {
    return saveWinterWaitlist(body as RegistrationPayload, request);
  }

  if (body.season === WINTER_SEASON) {
    return NextResponse.json(
      {
        error:
          "Winter 2026 registration requires payment. Please complete checkout on the registration form.",
      },
      { status: 405 },
    );
  }

  if (body.season !== SPRING_SEASON || !body.parent || !Array.isArray(body.players)) {
    return NextResponse.json(
      { error: "Choose Spring 2027 before submitting player information." },
      { status: 400 },
    );
  }

  const payload: RegistrationPayload = {
    parent: body.parent,
    players: body.players,
    volunteer: body.volunteer ?? { role: "", name: "", shirtSize: "" },
    waivers: body.waivers ?? {
      programAdministration: false,
      liabilityRelease: false,
      photoMedia: false,
      codeOfConduct: false,
      fundraisingAgreement: false,
    },
    parentSignature: body.parentSignature ?? "",
    season: SPRING_SEASON,
  };

  const validationErrors = validateRegistrationPayload(payload, {
    requireSignature: true,
    waiverDocs: SPRING_WAIVERS,
  });
  if (validationErrors) {
    return NextResponse.json(
      { error: "Please complete all required registration fields." },
      { status: 400 },
    );
  }

  if (payload.players.length > MAX_PLAYERS) {
    return NextResponse.json(
      { error: `You can register up to ${MAX_PLAYERS} players at a time.` },
      { status: 400 },
    );
  }

  try {
    await submitRegistration(payload, {
      paymentStatus: "not_required",
      season: SPRING_SEASON,
      amountPaidCents: 0,
      clientIp: getClientIp(request),
    });
  } catch (error) {
    console.error("Spring registration submit failed:", error);
    return NextResponse.json(
      { error: "Unable to save this registration. Please try again." },
      { status: 502 },
    );
  }

  return NextResponse.json({ ok: true, season: SPRING_SEASON });
}

/**
 * Winter family with every child on the waitlist: save them at $0. No card is
 * collected or authorized. Refused if any child actually holds a place.
 */
async function saveWinterWaitlist(payload: RegistrationPayload, request: Request) {
  const fullPayload: RegistrationPayload = { ...payload, season: WINTER_SEASON };
  if (validateRegistrationPayload(fullPayload, { requireSignature: true })) {
    return NextResponse.json(
      { error: "Please complete all required registration fields." },
      { status: 400 },
    );
  }

  try {
    const { registrationId, children } = await getRegistrationChildren(fullPayload);
    if (children.length !== fullPayload.players.length) {
      return NextResponse.json(
        { error: "Please go back one step and continue again so we can check places." },
        { status: 409 },
      );
    }
    if (placeChildren(children).length > 0) {
      return NextResponse.json(
        { error: "A place is being held for this registration. Please complete payment." },
        { status: 409 },
      );
    }

    await submitRegistration(fullPayload, {
      paymentStatus: "waitlisted",
      season: WINTER_SEASON,
      amountPaidCents: 0,
      clientIp: getClientIp(request),
      registrationId,
      enrollment: children,
    });
    return NextResponse.json({ ok: true, waitlisted: true, children });
  } catch (error) {
    console.error("Winter waitlist submit failed:", error);
    return NextResponse.json(
      { error: "Unable to save this registration. Please try again." },
      { status: 502 },
    );
  }
}
