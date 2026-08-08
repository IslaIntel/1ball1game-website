"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { CTAButton } from "@/components/ui/CTAButton";
import { EVENTS, track } from "@/lib/analytics";

const LINKS = [
  { label: "The Mission", href: "#about" },
  { label: "The Impact", href: "#impact" },
  { label: "Program", href: "#program" },
  { label: "Partner", href: "#partner" },
  { label: "Contact", href: "#contact" },
];

export function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <motion.header
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      className="fixed inset-x-0 top-0 z-50"
    >
      <div
        className={`mx-auto flex max-w-7xl items-center justify-between px-5 py-3 transition-all duration-500 sm:px-8 ${
          scrolled
            ? "mt-3 rounded-full border border-ink/10 bg-paper/80 backdrop-blur-xl shadow-[0_10px_40px_-20px_rgba(10,17,56,0.4)]"
            : "mt-0 border border-transparent"
        }`}
      >
        <div className="flex min-w-0 items-center gap-3 sm:gap-4">
          <a
            href="#top"
            onClick={() => track(EVENTS.NAV_LOGO_CLICK)}
            className="relative flex shrink-0 items-center"
            aria-label="1 Ball 1 Game Foundation — home"
          >
            <Image
              src="/images/logo.svg"
              alt="1 Ball 1 Game"
              width={64}
              height={62}
              priority
              className="h-11 w-auto"
            />
          </a>
          <div
            className="hidden h-9 w-px shrink-0 bg-ink/15 sm:block"
            aria-hidden
          />
          <div className="hidden min-w-0 items-center gap-2.5 sm:flex">
            <span className="max-w-[5.5rem] text-[0.62rem] font-semibold uppercase leading-tight tracking-[0.14em] text-ink/45">
              In partnership with
            </span>
            <Image
              src="/images/surf-nation-logo.png"
              alt="Surf Nation"
              width={40}
              height={40}
              className="h-9 w-9 shrink-0 object-contain"
            />
          </div>
          <div className="flex shrink-0 items-center sm:hidden">
            <Image
              src="/images/surf-nation-logo.png"
              alt="Surf Nation"
              width={32}
              height={32}
              className="h-8 w-8 object-contain"
            />
          </div>
        </div>

        <nav className="hidden items-center gap-8 md:flex">
          {LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() =>
                track(EVENTS.NAV_LINK_CLICK, { label: link.label, href: link.href })
              }
              className="link-underline text-sm font-medium text-ink/70 transition-colors hover:text-ink"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          <div className="hidden items-center gap-2 sm:flex">
            <CTAButton
              href="/register"
              marker="nav_register"
              location="nav"
              variant="solid"
              className="!px-6 !py-3 !text-[0.9rem] shadow-[0_8px_24px_-12px_rgba(226,38,157,0.55)]"
            >
              Register Now
            </CTAButton>
            <CTAButton
              href="#contact"
              marker="nav_contact"
              location="nav"
              variant="outline"
              className="!px-5 !py-2.5 !text-[0.8rem]"
            >
              Contact Us
            </CTAButton>
            <CTAButton
              href="#partner"
              marker="nav_partner"
              location="nav"
              variant="outline"
              className="!px-5 !py-2.5 !text-[0.8rem]"
            >
              Partner With Us
            </CTAButton>
          </div>
          <div className="sm:hidden">
            <CTAButton
              href="/register"
              marker="nav_register_mobile_header"
              location="nav_mobile_header"
              variant="solid"
              className="!px-5 !py-2.5 !text-sm"
            >
              Register Now
            </CTAButton>
          </div>
          <button
            onClick={() => setOpen((v) => !v)}
            aria-label="Toggle menu"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-ink/15 md:hidden"
          >
            <div className="flex flex-col gap-1.5">
              <span
                className={`h-0.5 w-5 bg-ink transition-transform ${
                  open ? "translate-y-2 rotate-45" : ""
                }`}
              />
              <span
                className={`h-0.5 w-5 bg-ink transition-opacity ${
                  open ? "opacity-0" : ""
                }`}
              />
              <span
                className={`h-0.5 w-5 bg-ink transition-transform ${
                  open ? "-translate-y-2 -rotate-45" : ""
                }`}
              />
            </div>
          </button>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.nav
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="mx-4 mt-2 overflow-hidden rounded-3xl border border-ink/10 bg-paper/95 p-5 backdrop-blur-xl md:hidden"
          >
            {LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => {
                  setOpen(false);
                  track(EVENTS.NAV_LINK_CLICK, { label: link.label, href: link.href });
                }}
                className="block border-b border-ink/5 py-3 font-display text-2xl text-ink last:border-0"
              >
                {link.label}
              </a>
            ))}
            <div className="grid grid-cols-1 gap-3 pt-4 sm:grid-cols-2">
              <CTAButton
                href="/register"
                marker="nav_register_mobile"
                location="nav_mobile"
                variant="solid"
                className="w-full !py-3.5 !text-base sm:col-span-2"
              >
                Register Now
              </CTAButton>
              <CTAButton
                href="#contact"
                marker="nav_contact_mobile"
                location="nav_mobile"
                variant="outline"
                className="w-full"
              >
                Contact Us
              </CTAButton>
              <CTAButton
                href="#partner"
                marker="nav_partner_mobile"
                location="nav_mobile"
                variant="outline"
                className="w-full"
              >
                Partner With Us
              </CTAButton>
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
