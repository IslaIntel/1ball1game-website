"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { TrackedSection } from "@/components/analytics/TrackedSection";
import { Reveal } from "@/components/ui/Reveal";
import { BallGlyph } from "@/components/ui/BallGlyph";
import { EVENTS, track } from "@/lib/analytics";

const LEVELS = ["Presenting · $25,000", "Gold · $15,000", "Silver · $10,000", "Bronze · $5,000", "Not sure yet"];

export function Contact() {
  const [form, setForm] = useState({ name: "", org: "", level: LEVELS[0], message: "" });
  const [sent, setSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    track(EVENTS.CONTACT_FORM_SUBMIT, { level: form.level, has_message: form.message.length > 0 });
    const subject = encodeURIComponent(`Sponsorship inquiry — ${form.level}`);
    const body = encodeURIComponent(
      `Name: ${form.name}\nOrganization: ${form.org}\nInterested level: ${form.level}\n\n${form.message}`,
    );
    window.location.href = `mailto:kate@1ball1game.org?subject=${subject}&body=${body}`;
    setSent(true);
  };

  const field =
    "w-full rounded-xl border border-cloud/15 bg-cloud/[0.04] px-4 py-3 text-cloud placeholder:text-cloud/40 outline-none transition-colors focus:border-magenta";

  return (
    <TrackedSection
      id="contact"
      name="Get In Touch"
      className="relative scroll-mt-24 overflow-hidden bg-ink py-24 text-cloud lg:py-32"
    >
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-20 top-0 h-[30rem] w-[30rem] rounded-full bg-royal/50 blur-[140px]" />
        <div className="absolute -bottom-20 right-0 h-[26rem] w-[26rem] rounded-full bg-magenta/25 blur-[140px]" />
      </div>

      <div className="relative mx-auto grid max-w-7xl grid-cols-1 gap-14 px-5 sm:px-8 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <Reveal>
            <span className="eyebrow text-sky">Get in touch</span>
          </Reveal>
          <Reveal delay={0.05}>
            <h2 className="mt-6 font-display text-[clamp(2.4rem,5.5vw,4.5rem)] font-semibold leading-[1.02]">
              Let&apos;s put kids on the field — and dollars back in schools.
            </h2>
          </Reveal>
          <Reveal delay={0.1}>
            <div className="mt-10 rounded-3xl border border-cloud/10 bg-cloud/[0.04] p-7">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-royal">
                  <BallGlyph className="animate-spin-slow h-8 w-8 text-cloud" />
                </div>
                <div>
                  <div className="font-display text-xl font-semibold">Kate Leib</div>
                  <div className="text-sm text-cloud/60">Executive Director</div>
                </div>
              </div>
              <a
                href="mailto:kate@1ball1game.org"
                onClick={() => track(EVENTS.CONTACT_EMAIL_CLICK, { location: "contact_card" })}
                className="link-underline mt-6 inline-block text-lg font-medium text-cloud"
              >
                kate@1ball1game.org
              </a>
            </div>
          </Reveal>
        </div>

        <div className="lg:col-span-7">
          <Reveal delay={0.1}>
            <form
              onSubmit={handleSubmit}
              className="rounded-3xl border border-cloud/10 bg-cloud/[0.03] p-7 backdrop-blur-sm sm:p-9"
            >
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div>
                  <label className="eyebrow mb-2 block text-cloud/50">Your name</label>
                  <input
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className={field}
                    placeholder="Jordan Rivera"
                  />
                </div>
                <div>
                  <label className="eyebrow mb-2 block text-cloud/50">Organization</label>
                  <input
                    value={form.org}
                    onChange={(e) => setForm({ ...form, org: e.target.value })}
                    className={field}
                    placeholder="Company or PTA"
                  />
                </div>
              </div>

              <div className="mt-5">
                <label className="eyebrow mb-2 block text-cloud/50">Interested level</label>
                <select
                  value={form.level}
                  onChange={(e) => setForm({ ...form, level: e.target.value })}
                  className={`${field} appearance-none`}
                >
                  {LEVELS.map((l) => (
                    <option key={l} value={l} className="bg-ink text-cloud">
                      {l}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mt-5">
                <label className="eyebrow mb-2 block text-cloud/50">Message</label>
                <textarea
                  rows={4}
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  className={`${field} resize-none`}
                  placeholder="Tell us how you'd like to support local schools…"
                />
              </div>

              <motion.button
                type="submit"
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.98 }}
                className="mt-7 inline-flex w-full items-center justify-center gap-3 rounded-full bg-magenta px-7 py-4 text-sm font-semibold text-cloud transition-colors hover:bg-magenta-deep sm:w-auto"
              >
                {sent ? "Opening your email…" : "Send sponsorship inquiry"}
                <span className="h-1.5 w-1.5 rounded-full bg-cloud" />
              </motion.button>
            </form>
          </Reveal>
        </div>
      </div>
    </TrackedSection>
  );
}
