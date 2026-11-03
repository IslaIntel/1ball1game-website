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

/**
 * Saves a registration that does not take payment.
 * Winter 2026 still completes through Stripe. Spring 2027 is stored here
 * and tagged with its season.
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
