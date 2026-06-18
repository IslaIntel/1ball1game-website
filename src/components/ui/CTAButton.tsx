"use client";

import { motion } from "framer-motion";
import { EVENTS, track } from "@/lib/analytics";

type CTAButtonProps = {
  href: string;
  children: React.ReactNode;
  /** Marker label sent to analytics, e.g. "hero_primary". */
  marker: string;
  location: string;
  variant?: "solid" | "outline" | "ghost";
  className?: string;
};

const base =
  "group relative inline-flex items-center justify-center gap-3 rounded-full px-7 py-3.5 text-sm font-semibold tracking-wide transition-colors duration-300 overflow-hidden";

const variants: Record<string, string> = {
  solid: "bg-magenta text-cloud hover:bg-magenta-deep",
  outline:
    "border border-ink/25 text-ink hover:border-ink hover:bg-ink hover:text-paper",
  ghost: "text-cloud/90 border border-cloud/25 hover:bg-cloud hover:text-ink",
};

export function CTAButton({
  href,
  children,
  marker,
  location,
  variant = "solid",
  className = "",
}: CTAButtonProps) {
  return (
    <motion.a
      href={href}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.97 }}
      transition={{ type: "spring", stiffness: 400, damping: 22 }}
      className={`${base} ${variants[variant]} ${className}`}
      onClick={() =>
        track(EVENTS.CTA_CLICK, { marker, location, href })
      }
    >
      <span className="relative z-10 flex items-center gap-3">{children}</span>
      <span className="absolute right-5 top-1/2 h-1.5 w-1.5 -translate-y-1/2 translate-x-6 rounded-full bg-current opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100" />
    </motion.a>
  );
}
