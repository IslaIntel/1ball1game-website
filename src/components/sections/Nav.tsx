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
        <a
          href="#top"
          onClick={() => track(EVENTS.NAV_LOGO_CLICK)}
          className="relative flex items-center"
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
              variant="solid"
              className="!px-5 !py-2.5 !text-[0.8rem]"
            >
              Partner With Us
            </CTAButton>
          </div>
          <div className="sm:hidden">
            <CTAButton
              href="#contact"
              marker="nav_contact_mobile_header"
              location="nav_mobile_header"
              variant="solid"
              className="!px-4 !py-2 !text-xs"
            >
              Contact Us
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
