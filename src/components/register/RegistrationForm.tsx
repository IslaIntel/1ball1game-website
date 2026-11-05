"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  emptyParent,
  emptyPlayer,
  emptyVolunteer,
  emptyWaivers,
  FEE_CENTS,
  MAX_PLAYERS,
  formatUsd,
  GENDERS,
  SPRING_GRADES,
  SPRING_WAIVERS,
  WINTER_GRADES,
  JERSEY_SIZES,
  RELATIONSHIPS,
  SCHOOLS,
  STEP_DESCRIPTIONS,
  STEP_LABELS,
  STEP_TITLES,
  SPRING_STEP_TITLES,
  type FieldErrors,
  type ParentInfo,
  type PlayerInfo,
  type RegistrationPayload,
  type WaiverDoc,
  type WaiverKey,
  type Waivers,
  validateStep,
  WAIVERS,
} from "@/lib/registration";
import { RegistrationSuccess } from "@/components/register/RegistrationSuccess";
import {
  RegistrationPayment,
  type RegistrationPaymentHandle,
} from "@/components/register/RegistrationPayment";
import { EVENTS, track } from "@/lib/analytics";
import { SPRING_SEASON, WINTER_SEASON } from "@/lib/registration-status";
import {
  WINTER_CAP_ENABLED,
  hasPlace,
  type EnrollmentChild,
  type PublicSessionAvailability,
} from "@/lib/winter-capacity-config";
import {
  WINTER_SCHEDULE,
  winterSessionById,
  winterSessionText,
} from "@/lib/winter-streetball";

type Reservation = {
  registrationId: string;
  children: EnrollmentChild[];
  billableCount: number;
  unitPriceCents: number;
};

const fieldClass =
  "w-full rounded-xl border border-ink/15 bg-cloud px-4 py-3 text-ink outline-none transition-colors placeholder:text-ink/35 focus:border-magenta";
const labelClass = "mb-1.5 block text-sm font-medium text-ink/80";
const errorClass = "mt-1.5 text-sm text-magenta-deep";

function Field({
  label,
  id,
  error,
  required,
  children,
  hint,
}: {
  label: string;
  id: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <div>
      <label htmlFor={id} className={labelClass}>
        {label}
        {required ? <span className="text-magenta"> *</span> : null}
      </label>
      {children}
      {hint ? <p className="mt-1.5 text-xs text-ink/50">{hint}</p> : null}
      {error ? <p className={errorClass}>{error}</p> : null}
    </div>
  );
}

export function RegistrationForm({
  onChangeSeason,
  season = WINTER_SEASON,
  requiresPayment = true,
}: {
  onChangeSeason?: () => void;
  season?: typeof WINTER_SEASON | typeof SPRING_SEASON;
  requiresPayment?: boolean;
}) {
  const grades = requiresPayment ? WINTER_GRADES : SPRING_GRADES;
  const waiverDocs = requiresPayment ? WAIVERS : SPRING_WAIVERS;
  const [step, setStep] = useState(0);
  const [parent, setParent] = useState(emptyParent);
  const [players, setPlayers] = useState<PlayerInfo[]>([emptyPlayer()]);
  const volunteer = emptyVolunteer();
  const [waivers, setWaivers] = useState(emptyWaivers);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">(
    "idle",
  );
  const [errorMessage, setErrorMessage] = useState("");
  const [parentSignature, setParentSignature] = useState("");
  const [openWaiver, setOpenWaiver] = useState<WaiverKey | null>(
    "liabilityRelease",
  );
  const [paymentReady, setPaymentReady] = useState(false);
  const [amountDueCents, setAmountDueCents] = useState(FEE_CENTS);
  const paymentRef = useRef<RegistrationPaymentHandle>(null);
  // Winter session cap: places left per session, and this family's places.
  const capOn = WINTER_CAP_ENABLED && requiresPayment;
  const [availability, setAvailability] = useState<Record<string, PublicSessionAvailability>>({});
  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [reserveState, setReserveState] = useState<"idle" | "loading" | "error">("idle");
  const [outcome, setOutcome] = useState<EnrollmentChild[] | null>(null);

  useEffect(() => {
    const warm = () => {
      void fetch("/api/warmup", { cache: "no-store" }).catch(() => undefined);
    };
    warm();
    const interval = window.setInterval(warm, 4 * 60 * 1000);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    if (step >= 3) {
      void fetch("/api/warmup", { cache: "no-store" }).catch(() => undefined);
    }
  }, [step]);

  useEffect(() => {
    if (!capOn || step !== 1) return;
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
  }, [capOn, step]);

  // Same family + same children + same sessions = same reservation request.
  const reservationKey = JSON.stringify([
    parent.email.trim().toLowerCase(),
    players.map((p) => [p.firstName.trim(), p.lastName.trim(), p.dateOfBirth, p.sessionId]),
  ]);

  useEffect(() => {
    if (!capOn || step !== 4) return;
    let cancelled = false;
    setReserveState("loading");
    setReservation(null);
    void (async () => {
      try {
        const response = await fetch("/api/register/reserve", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ parent, players, volunteer, waivers, parentSignature, season }),
        });
        const data = (await response.json().catch(() => null)) as
          | (Reservation & { error?: string })
          | null;
        if (cancelled) return;
        if (!response.ok || !data?.children) {
          setReserveState("error");
          setErrorMessage(data?.error ?? "We could not check places. Please try again.");
          return;
        }
        setReservation(data);
        setReserveState("idle");
        setErrorMessage("");
      } catch {
        if (cancelled) return;
        setReserveState("error");
        setErrorMessage("We could not check places. Please try again.");
      }
    })();
    return () => {
      cancelled = true;
    };
    // Re-check only when the children or sessions change, not on every keystroke.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [capOn, step, reservationKey]);

  const billableCount = reservation?.billableCount ?? 0;
  const waitlistOnly = capOn && reservation !== null && billableCount === 0;
  const needsPayment = requiresPayment && !waitlistOnly;
  const totalCents = (capOn ? billableCount : players.length) * FEE_CENTS;

  useEffect(() => {
    setAmountDueCents(totalCents);
  }, [totalCents]);

  const payload: RegistrationPayload = {
    parent,
    players,
    volunteer,
    waivers,
    parentSignature,
    season,
  };

  const updateParent = <K extends keyof ParentInfo>(key: K, value: ParentInfo[K]) => {
    setParent((prev) => ({ ...prev, [key]: value }));
  };

  const updatePlayer = <K extends keyof PlayerInfo>(
    index: number,
    key: K,
    value: PlayerInfo[K],
  ) => {
    setPlayers((prev) =>
      prev.map((player, i) => (i === index ? { ...player, [key]: value } : player)),
    );
  };

  const goNext = () => {
    const nextErrors = validateStep(step, payload, waiverDocs);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
    setStep((s) => Math.min(s + 1, STEP_LABELS.length - 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const goBack = () => {
    setErrors({});
    setStep((s) => Math.max(s - 1, 0));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = async () => {
    const all: FieldErrors = {};
    for (let i = 0; i <= 4; i++) Object.assign(all, validateStep(i, payload, waiverDocs));
    setErrors(all);
    if (Object.keys(all).length) {
      setErrorMessage("Please complete all required fields before submitting.");
      return;
    }

    if (capOn && !reservation) {
      setErrorMessage("Still checking places. Please wait a moment.");
      return;
    }

    if (needsPayment && !paymentRef.current?.isReady()) {
      setErrorMessage("Payment form is still loading. Please wait a moment.");
      return;
    }

    setStatus("submitting");
    setErrorMessage("");
    track(EVENTS.REGISTER_FORM_SUBMIT, {
      season,
      player_count: players.length,
      total_cents: totalCents,
      amount_due_cents: amountDueCents,
      scholarship: amountDueCents === 0,
      school: players[0]?.school,
      volunteering: false,
    });

    try {
      if (needsPayment) {
        const result = await paymentRef.current!.confirmPayment(payload);
        if (!result.ok) {
          throw new Error(result.error);
        }
      } else {
        const response = await fetch("/api/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = (await response.json().catch(() => null)) as { error?: string } | null;
        if (!response.ok) {
          throw new Error(data?.error || "Unable to save this registration.");
        }
      }
      if (capOn && reservation) setOutcome(reservation.children);
      setStatus("success");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (error) {
      setStatus("error");
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to complete registration. Please try again.",
      );
    }
  };

  if (status === "success") {
    return (
      <RegistrationSuccess
        players={players}
        email={parent.email}
        season={season}
        paid={requiresPayment}
        outcome={outcome ?? undefined}
      />
    );
  }

  return (
    <div className="grid gap-10 lg:grid-cols-12 lg:gap-12">
      <aside className="lg:col-span-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-3 text-sm font-medium text-ink/70 transition-colors hover:text-ink"
          >
            <span className="h-px w-8 bg-magenta" />
            1 Ball 1 Game Foundation
          </Link>
          {onChangeSeason ? (
            <button
              type="button"
              onClick={onChangeSeason}
              className="text-sm font-semibold text-magenta underline-offset-2 hover:underline"
            >
              Choose a different season
            </button>
          ) : null}
        </div>
        <p className="eyebrow mt-8 text-ink/50">
          {season} · {requiresPayment ? "2–4" : "K–6"}
        </p>
        <h1 className="mt-4 font-display text-[clamp(2.4rem,5vw,3.8rem)] font-semibold leading-[0.98] text-ink">
          Soccer <span className="text-magenta">registration</span> made simple.
        </h1>
        <p className="mt-5 max-w-md text-base leading-relaxed text-ink/65">
          {requiresPayment
            ? "Register your 2nd through 4th graders for Winter Streetball: indoor soccer at Lemon Road Elementary Gym, with small-sided games led by professional coaches."
            : "Returning in April, the PTA Soccer Rec Program brings the game back to the grass fields for a fun, parent-led spring season for Kindergarten through 6th grade. Please register today to express your interest so we can accurately request our county field allocations. NO PAYMENT REQUIRED TODAY - REGISTERING INTEREST ONLY. Practice dates and game days to be released in January."}
        </p>
        {requiresPayment ? (
          <div className="mt-6 flex flex-wrap gap-3 text-sm font-semibold text-ink">
            <span className="rounded-full border border-ink/10 bg-paper-2 px-4 py-2">
              {formatUsd(FEE_CENTS).replace(".00", "")} per player
            </span>
          </div>
        ) : null}

        <div className="relative mt-10 hidden overflow-hidden rounded-[2rem] rounded-tr-[5rem] border border-ink/10 lg:block">
          <div className="relative aspect-[4/5]">
            <Image
              src="/images/hero-soccer-k2.png"
              alt={
                requiresPayment
                  ? "2nd through 4th grade children playing soccer"
                  : "Kindergarten through 6th grade children playing soccer"
              }
              fill
              priority
              sizes="40vw"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-ink/40 via-transparent to-transparent" />
          </div>
        </div>
      </aside>

      <div className="lg:col-span-7">
        <nav aria-label="Registration progress" className="mb-8">
          <ol className="flex flex-wrap gap-2">
            {STEP_LABELS.map((label, i) => {
              const active = i === step;
              const done = i < step;
              return (
                <li
                  key={label}
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold tracking-wide ${
                    active
                      ? "bg-magenta text-cloud"
                      : done
                        ? "bg-ink text-cloud"
                        : "bg-ink/5 text-ink/50"
                  }`}
                >
                  <span className="mr-1.5 opacity-70">{i + 1}</span>
                  {label}
                </li>
              );
            })}
          </ol>
        </nav>

        <div className="rounded-[2rem] border border-ink/10 bg-cloud p-6 shadow-[0_30px_60px_-40px_rgba(10,17,56,0.35)] sm:p-8">
          <p className="eyebrow text-ink/45">
            Step {step + 1} of {STEP_LABELS.length}
          </p>
          <h2 className="mt-3 font-display text-2xl font-semibold text-ink sm:text-3xl">
            {(requiresPayment ? STEP_TITLES : SPRING_STEP_TITLES)[step]}
          </h2>
          <p className="mt-2 text-ink/60">
            {!requiresPayment && step === 4
              ? "Review your details, then submit. No payment is collected."
              : STEP_DESCRIPTIONS[step]}
          </p>

          <div className="mt-8 space-y-8" aria-live="polite">
            {step === 0 && (
              <ParentStep parent={parent} errors={errors} onChange={updateParent} />
            )}
            {step === 1 && (
              <PlayersStep
                players={players}
                maxPlayers={MAX_PLAYERS}
                errors={errors}
                grades={grades}
                season={season}
                capOn={capOn}
                availability={availability}
                onChange={updatePlayer}
                onAdd={() =>
                  setPlayers((p) =>
                    p.length >= MAX_PLAYERS ? p : [...p, emptyPlayer()],
                  )
                }
                onRemove={(i) =>
                  setPlayers((p) => (p.length === 1 ? p : p.filter((_, idx) => idx !== i)))
                }
              />
            )}
            {step === 2 && (
              <MedicalStep
                players={players}
                errors={errors}
                onChange={updatePlayer}
              />
            )}
            {step === 3 && (
              <WaiversStep
                waiverDocs={waiverDocs}
                waivers={waivers}
                errors={errors}
                openWaiver={openWaiver}
                setOpenWaiver={setOpenWaiver}
                onToggle={(key, value) =>
                  setWaivers((prev) => ({ ...prev, [key]: value }))
                }
              />
            )}
            {step === 4 && (
              <>
                <ReviewStep
                  parent={parent}
                  players={players}
                  waiverDocs={waiverDocs}
                  waivers={waivers}
                  parentSignature={parentSignature}
                  signatureError={errors.parentSignature}
                  onSignatureChange={setParentSignature}
                />
                {capOn ? (
                  <ReservationSummary
                    players={players}
                    reservation={reservation}
                    state={reserveState}
                  />
                ) : null}
                {needsPayment && (!capOn || reservation) ? (
                  <RegistrationPayment
                    key={capOn ? reservationKey : undefined}
                    ref={paymentRef}
                    payload={payload}
                    totalCents={totalCents}
                    playerCount={capOn ? billableCount : players.length}
                    onReadyChange={setPaymentReady}
                    onAmountDueChange={setAmountDueCents}
                    onError={setErrorMessage}
                  />
                ) : null}
              </>
            )}
          </div>

          {(errorMessage || status === "error") && (
            <p className="mt-6 rounded-xl border border-magenta/30 bg-magenta/5 px-4 py-3 text-sm text-magenta-deep">
              {errorMessage || "Something went wrong. Please try again."}
            </p>
          )}

          <div className="mt-8 flex flex-wrap items-center gap-3 border-t border-ink/10 pt-6">
            {step > 0 ? (
              <button
                type="button"
                onClick={goBack}
                className="rounded-full border border-ink/20 px-6 py-3 text-sm font-semibold text-ink transition-colors hover:border-ink hover:bg-ink hover:text-paper"
              >
                Back
              </button>
            ) : (
              <Link
                href="/"
                className="rounded-full border border-ink/20 px-6 py-3 text-sm font-semibold text-ink transition-colors hover:border-ink hover:bg-ink hover:text-paper"
              >
                Return home
              </Link>
            )}
            {step < STEP_LABELS.length - 1 ? (
              <button
                type="button"
                onClick={goNext}
                className="rounded-full bg-magenta px-7 py-3 text-sm font-semibold text-cloud transition-colors hover:bg-magenta-deep"
              >
                Continue →
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={
                  status === "submitting" ||
                  (capOn && !reservation) ||
                  (needsPayment && !paymentReady)
                }
                className="rounded-full bg-magenta px-7 py-3 text-sm font-semibold text-cloud transition-colors hover:bg-magenta-deep disabled:opacity-60"
              >
                {waitlistOnly
                  ? status === "submitting"
                    ? "Joining the waitlist…"
                    : "Join the free waitlist"
                  : status === "submitting"
                  ? requiresPayment
                    ? amountDueCents === 0
                      ? "Completing registration…"
                      : "Processing payment…"
                    : "Submitting registration…"
                  : requiresPayment
                    ? `Submit registration · ${formatUsd(amountDueCents)}`
                    : "Submit registration"}
              </button>
            )}
          </div>
        </div>

        <p className="mt-5 text-center text-xs text-ink/45">
          {requiresPayment
            ? "Registration data is stored securely and used only to run Winter Streetball at Lemon Road."
            : "Registration data is stored securely for the school PTA season."}{" "}
          Questions?{" "}
          <a
            href="mailto:info@1ball1game.org"
            className="font-medium text-ink underline-offset-2 hover:underline"
          >
            info@1ball1game.org
          </a>
        </p>
      </div>
    </div>
  );
}

function ParentStep({
  parent,
  errors,
  onChange,
}: {
  parent: ParentInfo;
  errors: FieldErrors;
  onChange: <K extends keyof ParentInfo>(key: K, value: ParentInfo[K]) => void;
}) {
  return (
    <section className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="First name" id="parent-first" required error={errors["parent.firstName"]}>
          <input
            id="parent-first"
            className={fieldClass}
            value={parent.firstName}
            onChange={(e) => onChange("firstName", e.target.value)}
          />
        </Field>
        <Field label="Last name" id="parent-last" required error={errors["parent.lastName"]}>
          <input
            id="parent-last"
            className={fieldClass}
            value={parent.lastName}
            onChange={(e) => onChange("lastName", e.target.value)}
          />
        </Field>
        <Field
          label="Relationship to player"
          id="parent-relationship"
          required
          error={errors["parent.relationship"]}
        >
          <select
            id="parent-relationship"
            className={fieldClass}
            value={parent.relationship}
            onChange={(e) => onChange("relationship", e.target.value)}
          >
            <option value="">Select an option</option>
            {RELATIONSHIPS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </Field>
        <Field
          label="Email address"
          id="parent-email"
          required
          hint="Must include an @ symbol."
          error={errors["parent.email"]}
        >
          <input
            id="parent-email"
            type="email"
            className={fieldClass}
            value={parent.email}
            onChange={(e) => onChange("email", e.target.value)}
          />
        </Field>
        <Field
          label="Primary phone number"
          id="parent-phone"
          required
          hint="At least 10 digits."
          error={errors["parent.phone"]}
        >
          <input
            id="parent-phone"
            type="tel"
            placeholder="(703) 555-0123"
            className={fieldClass}
            value={parent.phone}
            onChange={(e) => onChange("phone", e.target.value)}
          />
        </Field>
      </div>

      <div>
        <h3 className="font-display text-xl font-semibold text-ink">Home address</h3>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Field
              label="Street address"
              id="parent-street"
              required
              error={errors["parent.street"]}
            >
              <input
                id="parent-street"
                className={fieldClass}
                value={parent.street}
                onChange={(e) => onChange("street", e.target.value)}
              />
            </Field>
          </div>
          <Field label="City" id="parent-city" required error={errors["parent.city"]}>
            <input
              id="parent-city"
              className={fieldClass}
              value={parent.city}
              onChange={(e) => onChange("city", e.target.value)}
            />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="State" id="parent-state" required error={errors["parent.state"]}>
              <input
                id="parent-state"
                className={fieldClass}
                value={parent.state}
                onChange={(e) => onChange("state", e.target.value)}
              />
            </Field>
            <Field label="ZIP code" id="parent-zip" required error={errors["parent.zip"]}>
              <input
                id="parent-zip"
                className={fieldClass}
                value={parent.zip}
                onChange={(e) => onChange("zip", e.target.value)}
              />
            </Field>
          </div>
        </div>
      </div>

      <div>
        <div className="flex items-baseline gap-3">
          <h3 className="font-display text-xl font-semibold text-ink">
            Secondary contact
          </h3>
          <span className="eyebrow text-ink/40">Optional</span>
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <Field label="Contact name" id="secondary-name">
            <input
              id="secondary-name"
              className={fieldClass}
              value={parent.secondaryName}
              onChange={(e) => onChange("secondaryName", e.target.value)}
            />
          </Field>
          <Field
            label="Phone"
            id="secondary-phone"
            hint="At least 10 digits if provided."
            error={errors["parent.secondaryPhone"]}
          >
            <input
              id="secondary-phone"
              type="tel"
              className={fieldClass}
              value={parent.secondaryPhone}
              onChange={(e) => onChange("secondaryPhone", e.target.value)}
            />
          </Field>
          <Field
            label="Email"
            id="secondary-email"
            hint="Must include an @ symbol if provided."
            error={errors["parent.secondaryEmail"]}
          >
            <input
              id="secondary-email"
              type="email"
              className={fieldClass}
              value={parent.secondaryEmail}
              onChange={(e) => onChange("secondaryEmail", e.target.value)}
            />
          </Field>
        </div>
      </div>
    </section>
  );
}

function PlayersStep({
  players,
  maxPlayers,
  grades,
  season,
  capOn,
  availability,
  errors,
  onChange,
  onAdd,
  onRemove,
}: {
  players: PlayerInfo[];
  maxPlayers: number;
  grades: readonly string[];
  season: string;
  capOn: boolean;
  availability: Record<string, PublicSessionAvailability>;
  errors: FieldErrors;
  onChange: <K extends keyof PlayerInfo>(
    index: number,
    key: K,
    value: PlayerInfo[K],
  ) => void;
  onAdd: () => void;
  onRemove: (index: number) => void;
}) {
  return (
    <section className="space-y-8">
      {players.map((player, i) => {
        const title =
          `${player.firstName} ${player.lastName}`.trim() || `Player ${i + 1}`;
        return (
          <div
            key={i}
            className="rounded-2xl border border-ink/10 bg-paper/60 p-5 sm:p-6"
          >
            <div className="mb-4 flex items-center justify-between gap-3">
              <h3 className="font-display text-xl font-semibold text-ink">{title}</h3>
              {players.length > 1 ? (
                <button
                  type="button"
                  onClick={() => onRemove(i)}
                  className="text-sm font-semibold text-ink/50 hover:text-magenta"
                >
                  Remove
                </button>
              ) : null}
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {capOn ? (
                <SessionField
                  index={i}
                  player={player}
                  availability={availability}
                  error={errors[`players.${i}.sessionId`]}
                  onChange={(sessionId) => {
                    // The session sets both grade and gender.
                    const session = winterSessionById(sessionId);
                    onChange(i, "sessionId", sessionId);
                    onChange(i, "grade", session?.grade ?? "");
                    onChange(i, "gender", session?.gender ?? "");
                  }}
                />
              ) : null}
              <Field
                label="First name"
                id={`player-${i}-first`}
                required
                error={errors[`players.${i}.firstName`]}
              >
                <input
                  id={`player-${i}-first`}
                  className={fieldClass}
                  value={player.firstName}
                  onChange={(e) => onChange(i, "firstName", e.target.value)}
                />
              </Field>
              <Field
                label="Last name"
                id={`player-${i}-last`}
                required
                error={errors[`players.${i}.lastName`]}
              >
                <input
                  id={`player-${i}-last`}
                  className={fieldClass}
                  value={player.lastName}
                  onChange={(e) => onChange(i, "lastName", e.target.value)}
                />
              </Field>
              <Field
                label="Date of birth"
                id={`player-${i}-dob`}
                required
                error={errors[`players.${i}.dateOfBirth`]}
              >
                <input
                  id={`player-${i}-dob`}
                  type="date"
                  className={fieldClass}
                  value={player.dateOfBirth}
                  onChange={(e) => onChange(i, "dateOfBirth", e.target.value)}
                />
              </Field>
              {capOn ? null : (
                <>
              <Field
                label="Gender identity"
                id={`player-${i}-gender`}
                required
                error={errors[`players.${i}.gender`]}
              >
                <select
                  id={`player-${i}-gender`}
                  className={fieldClass}
                  value={player.gender}
                  onChange={(e) => onChange(i, "gender", e.target.value)}
                >
                  <option value="">Select an option</option>
                  {GENDERS.map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
              </Field>
              <Field
                label={`Current grade (${season})`}
                id={`player-${i}-grade`}
                required
                error={errors[`players.${i}.grade`]}
              >
                <select
                  id={`player-${i}-grade`}
                  className={fieldClass}
                  value={player.grade}
                  onChange={(e) => onChange(i, "grade", e.target.value)}
                >
                  <option value="">Select an option</option>
                  {grades.map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
              </Field>
                </>
              )}
              <Field
                label="School attending"
                id={`player-${i}-school`}
                required
                error={errors[`players.${i}.school`]}
              >
                <select
                  id={`player-${i}-school`}
                  className={fieldClass}
                  value={player.school}
                  onChange={(e) => onChange(i, "school", e.target.value)}
                >
                  <option value="">Select an option</option>
                  {SCHOOLS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </Field>
              <Field
                label="Jersey size"
                id={`player-${i}-jersey`}
                required
                error={errors[`players.${i}.jerseySize`]}
              >
                <select
                  id={`player-${i}-jersey`}
                  className={fieldClass}
                  value={player.jerseySize}
                  onChange={(e) => onChange(i, "jerseySize", e.target.value)}
                >
                  <option value="">Select an option</option>
                  {JERSEY_SIZES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </Field>
              <Field
                label="Buddy request"
                id={`player-${i}-buddy`}
                hint="Optional. Buddy requests are not guaranteed."
              >
                <input
                  id={`player-${i}-buddy`}
                  className={fieldClass}
                  value={player.buddyRequest}
                  onChange={(e) => onChange(i, "buddyRequest", e.target.value)}
                />
              </Field>
            </div>
          </div>
        );
      })}
      {players.length < maxPlayers ? (
        <button
          type="button"
          onClick={onAdd}
          className="inline-flex items-center gap-2 rounded-full border border-ink/20 px-5 py-2.5 text-sm font-semibold text-ink transition-colors hover:border-magenta hover:text-magenta"
        >
          <span aria-hidden>＋</span> Add another player
        </button>
      ) : (
        <p className="text-sm font-medium text-ink/60">
          Maximum of {maxPlayers} players per registration.
        </p>
      )}
      <p className="text-sm text-ink/50">
        Register up to {maxPlayers} siblings on one form.{" "}
        {season === WINTER_SEASON
          ? "Players are grouped by grade and gender, with one 1-hour session each week."
          : "Players are grouped primarily by school and grade to strengthen friendships and community."}
      </p>
    </section>
  );
}

function MedicalStep({
  players,
  errors,
  onChange,
}: {
  players: PlayerInfo[];
  errors: FieldErrors;
  onChange: <K extends keyof PlayerInfo>(
    index: number,
    key: K,
    value: PlayerInfo[K],
  ) => void;
}) {
  return (
    <section className="space-y-8">
      {players.map((player, i) => {
        const title =
          `${player.firstName} ${player.lastName}`.trim() || `Player ${i + 1}`;
        return (
          <div
            key={i}
            className="rounded-2xl border border-ink/10 bg-paper/60 p-5 sm:p-6"
          >
            <h3 className="font-display text-xl font-semibold text-ink">{title}</h3>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Field
                label="Emergency contact name"
                id={`player-${i}-ec-name`}
                required
                hint="Must be different from the primary parent/guardian."
                error={errors[`players.${i}.emergencyContactName`]}
              >
                <input
                  id={`player-${i}-ec-name`}
                  className={fieldClass}
                  value={player.emergencyContactName}
                  onChange={(e) =>
                    onChange(i, "emergencyContactName", e.target.value)
                  }
                />
              </Field>
              <Field
                label="Emergency phone number"
                id={`player-${i}-ec-phone`}
                required
                hint="At least 10 digits."
                error={errors[`players.${i}.emergencyPhone`]}
              >
                <input
                  id={`player-${i}-ec-phone`}
                  type="tel"
                  className={fieldClass}
                  value={player.emergencyPhone}
                  onChange={(e) => onChange(i, "emergencyPhone", e.target.value)}
                />
              </Field>
            </div>
            <fieldset className="mt-5">
              <legend className={labelClass}>
                Does this player have any allergies or medical conditions?
                <span className="text-magenta"> *</span>
              </legend>
              <div className="mt-2 flex gap-6">
                {(["yes", "no"] as const).map((value) => (
                  <label key={value} className="flex items-center gap-2 text-sm text-ink">
                    <input
                      type="radio"
                      name={`player-${i}-medical`}
                      value={value}
                      checked={player.hasMedicalConditions === value}
                      onChange={() => onChange(i, "hasMedicalConditions", value)}
                    />
                    {value === "yes" ? "Yes" : "No"}
                  </label>
                ))}
              </div>
              {errors[`players.${i}.hasMedicalConditions`] ? (
                <p className={errorClass}>
                  {errors[`players.${i}.hasMedicalConditions`]}
                </p>
              ) : null}
            </fieldset>
            {player.hasMedicalConditions === "yes" ? (
              <div className="mt-4">
                <Field
                  label="Please describe"
                  id={`player-${i}-medical-details`}
                  required
                  error={errors[`players.${i}.medicalDetails`]}
                >
                  <textarea
                    id={`player-${i}-medical-details`}
                    rows={3}
                    className={fieldClass}
                    value={player.medicalDetails}
                    onChange={(e) => onChange(i, "medicalDetails", e.target.value)}
                  />
                </Field>
              </div>
            ) : null}
          </div>
        );
      })}
    </section>
  );
}

function WaiversStep({
  waiverDocs,
  waivers,
  errors,
  openWaiver,
  setOpenWaiver,
  onToggle,
}: {
  waiverDocs: readonly WaiverDoc[];
  waivers: Waivers;
  errors: FieldErrors;
  openWaiver: WaiverKey | null;
  setOpenWaiver: (key: WaiverKey | null) => void;
  onToggle: (key: WaiverKey, value: boolean) => void;
}) {
  return (
    <section className="space-y-4">
      {errors.waivers ? <p className={errorClass}>{errors.waivers}</p> : null}
      {waiverDocs.map((waiver) => {
        const open = openWaiver === waiver.key;
        return (
          <div
            key={waiver.key}
            className={`overflow-hidden rounded-2xl border ${
              errors[`waivers.${waiver.key}`]
                ? "border-magenta/40"
                : "border-ink/10"
            }`}
          >
            <button
              type="button"
              onClick={() => setOpenWaiver(open ? null : waiver.key)}
              className="flex w-full items-center justify-between gap-4 bg-paper/70 px-5 py-4 text-left"
            >
              <span className="font-semibold text-ink">{waiver.title}</span>
              <span className="text-ink/40">{open ? "−" : "+"}</span>
            </button>
            {open ? (
              <div className="space-y-4 border-t border-ink/10 px-5 py-5 text-sm leading-relaxed text-ink/70">
                {waiver.sections.map((section, index) => (
                  <p key={`${waiver.key}-${index}`}>
                    {section.heading ? (
                      <>
                        <strong className="text-ink">{section.heading}</strong>{" "}
                      </>
                    ) : null}
                    {section.body}
                  </p>
                ))}
                {waiver.note ? <p>{waiver.note}</p> : null}
                <label className="flex items-start gap-3 rounded-xl border border-ink/10 bg-cloud p-4 text-ink">
                  <input
                    type="checkbox"
                    className="mt-1"
                    checked={waivers[waiver.key]}
                    onChange={(e) => onToggle(waiver.key, e.target.checked)}
                  />
                  <span>{waiver.affirmation}</span>
                </label>
                {errors[`waivers.${waiver.key}`] ? (
                  <p className={errorClass}>{errors[`waivers.${waiver.key}`]}</p>
                ) : null}
              </div>
            ) : null}
          </div>
        );
      })}
    </section>
  );
}

function ReviewStep({
  parent,
  players,
  waiverDocs,
  waivers,
  parentSignature,
  signatureError,
  onSignatureChange,
}: {
  parent: ParentInfo;
  players: PlayerInfo[];
  waiverDocs: readonly WaiverDoc[];
  waivers: Waivers;
  parentSignature: string;
  signatureError?: string;
  onSignatureChange: (value: string) => void;
}) {
  return (
    <section className="space-y-6">
      <div className="rounded-2xl border border-ink/10 bg-paper/60 p-5">
        <h3 className="font-display text-xl font-semibold text-ink">
          Parent / guardian
        </h3>
        <dl className="mt-3 space-y-1 text-sm text-ink/70">
          <div>
            <dt className="sr-only">Name</dt>
            <dd>
              {parent.firstName} {parent.lastName} · {parent.relationship}
            </dd>
          </div>
          <div>
            <dt className="sr-only">Contact</dt>
            <dd>
              {parent.email} · {parent.phone}
            </dd>
          </div>
          <div>
            <dt className="sr-only">Address</dt>
            <dd>
              {parent.street}, {parent.city}, {parent.state} {parent.zip}
            </dd>
          </div>
          {(parent.secondaryName.trim() ||
            parent.secondaryPhone.trim() ||
            parent.secondaryEmail.trim()) && (
            <div>
              <dt className="font-medium text-ink/80">Secondary contact</dt>
              <dd>
                {parent.secondaryName || "—"} · {parent.secondaryPhone || "—"} ·{" "}
                {parent.secondaryEmail || "—"}
              </dd>
            </div>
          )}
        </dl>
      </div>

      <div className="rounded-2xl border border-ink/10 bg-paper/60 p-5">
        <h3 className="font-display text-xl font-semibold text-ink">Players</h3>
        <ul className="mt-3 space-y-4">
          {players.map((player, i) => (
            <li key={i} className="text-sm text-ink/70">
              <p className="font-semibold text-ink">
                {player.firstName} {player.lastName}
              </p>
              <p className="mt-1">
                {player.dateOfBirth} · {player.gender} · {player.grade} ·{" "}
                {player.school} · {player.jerseySize}
              </p>
              {player.buddyRequest.trim() ? (
                <p className="mt-1">Buddy request: {player.buddyRequest}</p>
              ) : null}
              <p className="mt-1">
                Emergency: {player.emergencyContactName} · {player.emergencyPhone}
              </p>
              <p className="mt-1">
                Medical:{" "}
                {player.hasMedicalConditions === "yes"
                  ? player.medicalDetails.trim() || "Yes (no details provided)"
                  : "None reported"}
              </p>
            </li>
          ))}
        </ul>
      </div>

      <div className="rounded-2xl border border-ink/10 bg-paper/60 p-5">
        <h3 className="font-display text-xl font-semibold text-ink">
          Waivers acknowledged
        </h3>
        <ul className="mt-3 space-y-2 text-sm text-ink/70">
          {waiverDocs.map((waiver) => (
            <li key={waiver.key} className="flex items-start gap-2">
              <span
                className={
                  waivers[waiver.key] ? "font-semibold text-magenta" : "text-ink/40"
                }
                aria-hidden
              >
                {waivers[waiver.key] ? "✓" : "○"}
              </span>
              <span>{waiver.title}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="rounded-2xl border border-ink/10 bg-paper/60 p-5">
        <Field
          label="Parent / guardian typed signature"
          id="parent-signature"
          required
          error={signatureError}
          hint="Type your full legal name exactly as entered above. Required to submit."
        >
          <input
            id="parent-signature"
            className={fieldClass}
            value={parentSignature}
            onChange={(e) => onSignatureChange(e.target.value)}
            autoComplete="name"
            placeholder={`${parent.firstName} ${parent.lastName}`.trim()}
          />
        </Field>
      </div>
    </section>
  );
}

function SessionField({
  index,
  player,
  availability,
  error,
  onChange,
}: {
  index: number;
  player: PlayerInfo;
  availability: Record<string, PublicSessionAvailability>;
  error?: string;
  onChange: (sessionId: string) => void;
}) {
  const id = `player-${index}-session`;
  const selected = availability[player.sessionId ?? ""];
  return (
    <div className="sm:col-span-2">
      <Field
        label="Weekly session"
        id={id}
        required
        error={error}
        hint="The session sets your player’s grade and group. If a session shows Waitlist available, your player joins the free waitlist and is not charged."
      >
        <select
          id={id}
          className={fieldClass}
          value={winterSessionById(player.sessionId) ? player.sessionId : ""}
          onChange={(e) => onChange(e.target.value)}
        >
          <option value="">Select a session</option>
          {WINTER_SCHEDULE.map((day) => (
            <optgroup key={day.day} label={day.day}>
              {day.sessions.map((session) => {
                const status = availability[session.id];
                return (
                  <option key={session.id} value={session.id}>
                    {`${session.day} ${session.time} · ${session.group}${status ? ` — ${status.label}` : ""}`}
                  </option>
                );
              })}
            </optgroup>
          ))}
        </select>
      </Field>
      {selected ? (
        <p
          className={`mt-1.5 text-sm font-medium ${
            selected.available ? "font-semibold text-magenta" : "text-magenta-deep"
          }`}
        >
          {selected.available
            ? "Spots available."
            : "Waitlist available. You won’t be charged for this player."}
        </p>
      ) : null}
    </div>
  );
}

function ReservationSummary({
  players,
  reservation,
  state,
}: {
  players: PlayerInfo[];
  reservation: Reservation | null;
  state: "idle" | "loading" | "error";
}) {
  if (state === "loading" || (!reservation && state !== "error")) {
    return (
      <div className="rounded-2xl border border-ink/10 bg-paper/60 p-5 text-sm text-ink/60">
        Checking places in each session…
      </div>
    );
  }
  if (!reservation) return null;

  return (
    <div className="rounded-2xl border border-ink/10 bg-paper/60 p-5">
      <h3 className="font-semibold text-ink">Places</h3>
      <ul className="mt-3 divide-y divide-ink/10">
        {players.map((player, i) => {
          const child = reservation.children[i];
          const session = winterSessionById(child?.sessionId ?? player.sessionId);
          const placed = child ? hasPlace(child) : false;
          return (
            <li key={i} className="flex flex-col gap-1 py-2.5 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4">
              <span>
                <span className="font-semibold text-ink">
                  {player.firstName} {player.lastName}
                </span>
                {session ? (
                  <span className="block text-sm text-ink/60">{winterSessionText(session)}</span>
                ) : null}
              </span>
              <span
                className={`text-sm font-semibold ${placed ? "text-ink" : "text-magenta-deep"}`}
              >
                {placed
                  ? `Place held · ${formatUsd(child?.amountDueCents ?? FEE_CENTS)}`
                  : "Waitlisted — no payment collected"}
              </span>
            </li>
          );
        })}
      </ul>
      <p className="mt-3 text-xs text-ink/55">
        {reservation.billableCount > 0
          ? "Places are held for 30 minutes while you pay. You are only charged for players with a place."
          : "Every session you picked is full. Joining the waitlist is free and no card is needed. If a place opens, we’ll email you a link to accept it."}
      </p>
    </div>
  );
}
