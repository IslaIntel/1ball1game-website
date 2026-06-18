"use client";

import Image from "next/image";
import { BallGlyph } from "@/components/ui/BallGlyph";
import { EVENTS, track } from "@/lib/analytics";

const LINKS = [
  { label: "The Mission", href: "#about" },
  { label: "The Impact", href: "#impact" },
  { label: "Program", href: "#program" },
  { label: "Sponsor", href: "#sponsorship" },
  { label: "Contact", href: "#contact" },
];

export function Footer() {
  return (
    <footer className="border-t border-ink/10 bg-paper py-16">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="flex flex-col items-start justify-between gap-12 lg:flex-row">
          <div className="max-w-sm">
            <Image
              src="/images/logo.svg"
              alt="1 Ball 1 Game"
              width={84}
              height={81}
              className="h-16 w-auto"
            />
            <p className="mt-5 leading-relaxed text-ink/60">
              Creating access, opportunity, and community through youth soccer —
              one ball, one game, one school at a time.
            </p>
          </div>

          <div className="flex flex-wrap gap-12">
            <nav className="flex flex-col gap-3">
              <span className="eyebrow mb-1 text-ink/40">Explore</span>
              {LINKS.map((l) => (
                <a
                  key={l.href}
                  href={l.href}
                  onClick={() =>
                    track(EVENTS.NAV_LINK_CLICK, { label: l.label, href: l.href, location: "footer" })
                  }
                  className="link-underline text-ink/70 hover:text-ink"
                >
                  {l.label}
                </a>
              ))}
            </nav>
          </div>
        </div>

        <div className="mt-14 flex flex-col items-center justify-between gap-4 border-t border-ink/10 pt-8 sm:flex-row">
          <p className="text-sm text-ink/50">
            © {new Date().getFullYear()} 1 Ball 1 Game Foundation. All rights reserved.
          </p>
          <div className="flex items-center gap-2 text-sm text-ink/50">
            <BallGlyph className="h-4 w-4 text-magenta" />
            <span>Youth soccer · Schools first</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
