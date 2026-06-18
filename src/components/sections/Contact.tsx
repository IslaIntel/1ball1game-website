"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { TrackedSection } from "@/components/analytics/TrackedSection";
import { Reveal } from "@/components/ui/Reveal";
import { EVENTS, track } from "@/lib/analytics";

const CONTACT_EMAIL = "contact@1ball1game.org";

type FormState = {
  name: string;
  school: string;
  phone: string;
  email: string;
  message: string;
};

const EMPTY_FORM: FormState = {
  name: "",
  school: "",
  phone: "",
  email: "",
  message: "",
};

export function Contact() {
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [sent, setSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    track(EVENTS.CONTACT_FORM_SUBMIT, {
      has_school: form.school.length > 0,
      has_phone: form.phone.length > 0,
      has_message: form.message.length > 0,
    });

    const subject = encodeURIComponent("1 Ball 1 Game Foundation — Contact inquiry");
    const body = encodeURIComponent(
      `Name: ${form.name}\nSchool: ${form.school}\nPhone: ${form.phone}\nEmail: ${form.email}\n\nMessage:\n${form.message}`,
    );

    window.location.href = `mailto:${CONTACT_EMAIL}?subject=${subject}&body=${body}`;
    setSent(true);
  };

  const field =
    "w-full rounded-xl border border-cloud/15 bg-cloud/[0.04] px-4 py-3 text-cloud placeholder:text-cloud/40 outline-none transition-colors focus:border-magenta";

  return (
    <TrackedSection
      id="contact"
      name="Contact Us"
      className="relative scroll-mt-24 overflow-hidden bg-ink py-24 text-cloud lg:py-32"
    >
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-20 top-0 h-[30rem] w-[30rem] rounded-full bg-royal/50 blur-[140px]" />
        <div className="absolute -bottom-20 right-0 h-[26rem] w-[26rem] rounded-full bg-magenta/25 blur-[140px]" />
      </div>

      <div className="relative mx-auto grid max-w-7xl grid-cols-1 gap-14 px-5 sm:px-8 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <Reveal>
            <span className="eyebrow text-sky">Contact us</span>
          </Reveal>
          <Reveal delay={0.05}>
            <h2 className="mt-6 font-display text-[clamp(2.4rem,5.5vw,4.5rem)] font-semibold leading-[1.02]">
              Questions about the program? We&apos;d love to hear from you.
            </h2>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="mt-6 max-w-md text-lg leading-relaxed text-cloud/60">
              The 1 Ball 1 Game Foundation serves kindergarten through 2nd grade
              students. Reach out about schools, sponsorship, or getting involved.
            </p>
          </Reveal>
          <Reveal delay={0.15}>
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              onClick={() => track(EVENTS.CONTACT_EMAIL_CLICK, { location: "contact_section" })}
              className="link-underline mt-8 inline-block text-lg font-medium text-cloud"
            >
              {CONTACT_EMAIL}
            </a>
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
                  <label htmlFor="contact-name" className="eyebrow mb-2 block text-cloud/50">
                    Name
                  </label>
                  <input
                    id="contact-name"
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className={field}
                    placeholder="Your full name"
                    autoComplete="name"
                  />
                </div>
                <div>
                  <label htmlFor="contact-school" className="eyebrow mb-2 block text-cloud/50">
                    School
                  </label>
                  <input
                    id="contact-school"
                    required
                    value={form.school}
                    onChange={(e) => setForm({ ...form, school: e.target.value })}
                    className={field}
                    placeholder="School name"
                  />
                </div>
              </div>

              <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div>
                  <label htmlFor="contact-phone" className="eyebrow mb-2 block text-cloud/50">
                    Phone number
                  </label>
                  <input
                    id="contact-phone"
                    required
                    type="tel"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className={field}
                    placeholder="(555) 555-5555"
                    autoComplete="tel"
                  />
                </div>
                <div>
                  <label htmlFor="contact-email" className="eyebrow mb-2 block text-cloud/50">
                    Email
                  </label>
                  <input
                    id="contact-email"
                    required
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className={field}
                    placeholder="you@example.com"
                    autoComplete="email"
                  />
                </div>
              </div>

              <div className="mt-5">
                <label htmlFor="contact-message" className="eyebrow mb-2 block text-cloud/50">
                  Message
                </label>
                <textarea
                  id="contact-message"
                  required
                  rows={4}
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  className={`${field} resize-none`}
                  placeholder="How can we help?"
                />
              </div>

              <motion.button
                type="submit"
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.98 }}
                className="mt-7 inline-flex w-full items-center justify-center gap-3 rounded-full bg-magenta px-7 py-4 text-sm font-semibold text-cloud transition-colors hover:bg-magenta-deep sm:w-auto"
              >
                {sent ? "Opening your email…" : "Contact us"}
                <span className="h-1.5 w-1.5 rounded-full bg-cloud" />
              </motion.button>
            </form>
          </Reveal>
        </div>
      </div>
    </TrackedSection>
  );
}
