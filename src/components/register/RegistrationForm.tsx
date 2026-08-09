"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import {
  ADULT_SHIRT_SIZES,
  emptyParent,
  emptyPlayer,
  emptyVolunteer,
  emptyWaivers,
  FEE_CENTS,
  MAX_PLAYERS,
  formatUsd,
  GENDERS,
  GRADES,
  isVolunteering,
  JERSEY_SIZES,
  RELATIONSHIPS,
  SCHOOLS,
  STEP_DESCRIPTIONS,
  STEP_LABELS,
  STEP_TITLES,
  type FieldErrors,
  type ParentInfo,
  type PlayerInfo,
  type RegistrationPayload,
  type VolunteerInfo,
  type WaiverKey,
  type Waivers,
  validateStep,
  VOLUNTEER_ROLES,
  VOLUNTEER_ROLE_LABELS,
  WAIVERS,
} from "@/lib/registration";
import { EVENTS, track } from "@/lib/analytics";
import { RegistrationSuccess } from "@/components/register/RegistrationSuccess";

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

export function RegistrationForm() {
  const [step, setStep] = useState(0);
  const [parent, setParent] = useState(emptyParent);
  const [players, setPlayers] = useState<PlayerInfo[]>([emptyPlayer()]);
  const [volunteer, setVolunteer] = useState(emptyVolunteer);
  const [waivers, setWaivers] = useState(emptyWaivers);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">(
    "idle",
  );
  const [errorMessage, setErrorMessage] = useState("");
  const [openWaiver, setOpenWaiver] = useState<WaiverKey | null>(
    "programAdministration",
  );

  const totalCents = players.length * FEE_CENTS;
  const payload: RegistrationPayload = { parent, players, volunteer, waivers };

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

  const updateVolunteer = <K extends keyof VolunteerInfo>(
    key: K,
    value: VolunteerInfo[K],
  ) => {
    setVolunteer((prev) => ({ ...prev, [key]: value }));
  };

  const goNext = () => {
    const nextErrors = validateStep(step, payload);
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
    const nextErrors = validateStep(4, payload);
    const paymentErrors = validateStep(5, payload);
    const all = { ...nextErrors, ...paymentErrors };
    // Re-validate all prior steps before submit
    for (let i = 0; i <= 5; i++) Object.assign(all, validateStep(i, payload));
    setErrors(all);
    if (Object.keys(all).length) {
      setErrorMessage("Please complete all required fields before submitting.");
      return;
    }

    setStatus("submitting");
    setErrorMessage("");
    track(EVENTS.REGISTER_FORM_SUBMIT, {
      player_count: players.length,
      total_cents: totalCents,
      school: players[0]?.school,
      volunteering: isVolunteering(volunteer.role),
    });

    try {
      const response = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...payload,
          totalCents,
          playerCount: players.length,
        }),
      });
      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as {
          error?: string;
        } | null;
        throw new Error(data?.error ?? "Unable to submit registration.");
      }
      setStatus("success");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (error) {
      setStatus("error");
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to submit registration. Please try again.",
      );
    }
  };

  if (status === "success") {
    return (
      <RegistrationSuccess
        playerNames={players.map((p) => `${p.firstName} ${p.lastName}`).join(", ")}
        email={parent.email}
      />
    );
  }

  return (
    <div className="grid gap-10 lg:grid-cols-12 lg:gap-12">
      <aside className="lg:col-span-5">
        <Link
          href="/"
          className="inline-flex items-center gap-3 text-sm font-medium text-ink/70 transition-colors hover:text-ink"
        >
          <span className="h-px w-8 bg-magenta" />
          1 Ball 1 Game Foundation
        </Link>
        <p className="eyebrow mt-8 text-ink/50">Fall 2026 · K–2</p>
        <h1 className="mt-4 font-display text-[clamp(2.4rem,5vw,3.8rem)] font-semibold leading-[0.98] text-ink">
          Soccer <span className="text-magenta">registration</span> made simple.
        </h1>
        <p className="mt-5 max-w-md text-base leading-relaxed text-ink/65">
          Register your Kindergarten through 2nd-grade player for a fun,
          community-driven season with their local school’s PTA Soccer Club.
        </p>
        <div className="mt-6 flex flex-wrap gap-3 text-sm font-semibold text-ink">
          <span className="rounded-full border border-ink/10 bg-paper-2 px-4 py-2">
            75% back to school PTAs
          </span>
          <span className="rounded-full border border-ink/10 bg-paper-2 px-4 py-2">
            $199 per player
          </span>
        </div>

        <div className="relative mt-10 hidden overflow-hidden rounded-[2rem] rounded-tr-[5rem] border border-ink/10 lg:block">
          <div className="relative aspect-[4/5]">
            <Image
              src="/images/hero-soccer-k2.png"
              alt="Kindergarten through second-grade children playing soccer"
              fill
              priority
              sizes="40vw"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-ink/40 via-transparent to-transparent" />
          </div>
          <div className="absolute bottom-5 left-5 right-5 rounded-2xl border border-ink/10 bg-paper/95 p-4 backdrop-blur">
            <div className="eyebrow text-magenta">Direct school impact</div>
            <div className="mt-1 font-display text-3xl font-semibold text-ink">
              75%
            </div>
            <p className="text-xs text-ink/60">of every fee goes back to school PTAs</p>
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
            {STEP_TITLES[step]}
          </h2>
          <p className="mt-2 text-ink/60">{STEP_DESCRIPTIONS[step]}</p>

          <div className="mt-8 space-y-8" aria-live="polite">
            {step === 0 && (
              <ParentStep parent={parent} errors={errors} onChange={updateParent} />
            )}
            {step === 1 && (
              <PlayersStep
                players={players}
                maxPlayers={MAX_PLAYERS}
                errors={errors}
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
              <VolunteerStep
                volunteer={volunteer}
                errors={errors}
                onChange={updateVolunteer}
              />
            )}
            {step === 4 && (
              <WaiversStep
                waivers={waivers}
                errors={errors}
                openWaiver={openWaiver}
                setOpenWaiver={setOpenWaiver}
                onToggle={(key, value) =>
                  setWaivers((prev) => ({ ...prev, [key]: value }))
                }
              />
            )}
            {step === 5 && (
              <ReviewStep
                parent={parent}
                players={players}
                volunteer={volunteer}
                totalCents={totalCents}
              />
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
                disabled={status === "submitting"}
                className="rounded-full bg-magenta px-7 py-3 text-sm font-semibold text-cloud transition-colors hover:bg-magenta-deep disabled:opacity-60"
              >
                {status === "submitting"
                  ? "Submitting…"
                  : `Submit registration · ${formatUsd(totalCents)}`}
              </button>
            )}
          </div>
        </div>

        <p className="mt-5 text-center text-xs text-ink/45">
          Registration data is stored securely for the school PTA season. Questions?{" "}
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
  errors,
  onChange,
  onAdd,
  onRemove,
}: {
  players: PlayerInfo[];
  maxPlayers: number;
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
                label="Current grade (Fall 2026)"
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
                  {GRADES.map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
              </Field>
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
                label="Friend or coach request"
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
        Register up to {maxPlayers} siblings on one form. Players are grouped
        primarily by school and grade to strengthen friendships and community.
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

function VolunteerStep({
  volunteer,
  errors,
  onChange,
}: {
  volunteer: VolunteerInfo;
  errors: FieldErrors;
  onChange: <K extends keyof VolunteerInfo>(
    key: K,
    value: VolunteerInfo[K],
  ) => void;
}) {
  return (
    <section className="space-y-6">
      <div className="rounded-2xl border border-magenta/20 bg-magenta/5 p-5">
        <strong className="text-ink">Community makes the season possible.</strong>
        <p className="mt-1 text-sm text-ink/65">
          No soccer experience is required for coaching roles, and guidance is
          provided. Head coaches receive a 50% registration refund and assistant
          coaches receive a 20% refund if selected for the role by your school’s
          PTA — refunds are processed after selections are made.
        </p>
      </div>
      <Field
        label="Would you like to volunteer to be a coach or assistant coach?"
        id="volunteer-role"
        required
        error={errors["volunteer.role"]}
      >
        <select
          id="volunteer-role"
          className={fieldClass}
          value={volunteer.role}
          onChange={(e) => onChange("role", e.target.value)}
        >
          <option value="">Select an option</option>
          {VOLUNTEER_ROLES.map((r) => (
            <option key={r} value={r}>
              {VOLUNTEER_ROLE_LABELS[r]}
            </option>
          ))}
        </select>
      </Field>
      {isVolunteering(volunteer.role) ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Volunteer name"
            id="volunteer-name"
            required
            error={errors["volunteer.name"]}
          >
            <input
              id="volunteer-name"
              className={fieldClass}
              value={volunteer.name}
              onChange={(e) => onChange("name", e.target.value)}
            />
          </Field>
          <Field
            label="Volunteer shirt size"
            id="volunteer-shirt"
            required
            error={errors["volunteer.shirtSize"]}
          >
            <select
              id="volunteer-shirt"
              className={fieldClass}
              value={volunteer.shirtSize}
              onChange={(e) => onChange("shirtSize", e.target.value)}
            >
              <option value="">Select an option</option>
              {ADULT_SHIRT_SIZES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </Field>
        </div>
      ) : null}
    </section>
  );
}

function WaiversStep({
  waivers,
  errors,
  openWaiver,
  setOpenWaiver,
  onToggle,
}: {
  waivers: Waivers;
  errors: FieldErrors;
  openWaiver: WaiverKey | null;
  setOpenWaiver: (key: WaiverKey | null) => void;
  onToggle: (key: WaiverKey, value: boolean) => void;
}) {
  return (
    <section className="space-y-4">
      {errors.waivers ? <p className={errorClass}>{errors.waivers}</p> : null}
      {WAIVERS.map((waiver) => {
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
                {waiver.sections.map((section) => (
                  <p key={section.heading}>
                    <strong className="text-ink">{section.heading}</strong>{" "}
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
  volunteer,
  totalCents,
}: {
  parent: ParentInfo;
  players: PlayerInfo[];
  volunteer: VolunteerInfo;
  totalCents: number;
}) {
  return (
    <section className="space-y-6">
      <div className="rounded-2xl border border-ink/10 bg-paper/60 p-5">
        <h3 className="font-display text-xl font-semibold text-ink">
          Parent / guardian
        </h3>
        <p className="mt-2 text-ink/70">
          {parent.firstName} {parent.lastName} · {parent.relationship}
          <br />
          {parent.email} · {parent.phone}
          <br />
          {parent.street}, {parent.city}, {parent.state} {parent.zip}
        </p>
      </div>
      <div className="rounded-2xl border border-ink/10 bg-paper/60 p-5">
        <h3 className="font-display text-xl font-semibold text-ink">Players</h3>
        <ul className="mt-3 space-y-3">
          {players.map((player, i) => (
            <li key={i} className="text-ink/70">
              <strong className="text-ink">
                {player.firstName} {player.lastName}
              </strong>{" "}
              · {player.grade} · {player.school} · {player.jerseySize}
            </li>
          ))}
        </ul>
      </div>
      <div className="rounded-2xl border border-ink/10 bg-paper/60 p-5">
        <h3 className="font-display text-xl font-semibold text-ink">Volunteer</h3>
        <p className="mt-2 text-ink/70">
          {volunteer.role || "—"}
          {isVolunteering(volunteer.role)
            ? ` · ${volunteer.name} · ${volunteer.shirtSize}`
            : null}
        </p>
      </div>
      <div className="rounded-2xl border border-magenta/25 bg-magenta/5 p-5">
        <div className="eyebrow text-magenta">Amount due</div>
        <div className="mt-2 flex items-baseline justify-between gap-4">
          <p className="text-ink/70">
            {players.length} player{players.length === 1 ? "" : "s"} × $199
          </p>
          <p className="font-display text-3xl font-semibold text-ink">
            {formatUsd(totalCents)}
          </p>
        </div>
        <p className="mt-3 text-sm text-ink/60">
          Submitting this form saves your registration. A confirmation email will be
          sent to {parent.email || "your address"} shortly.
        </p>
      </div>
    </section>
  );
}
