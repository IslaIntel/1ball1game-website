"use client";

import { useEffect, useRef } from "react";
import { useInView } from "framer-motion";
import { EVENTS, track } from "@/lib/analytics";

type TrackedSectionProps = {
  id: string;
  /** Human-readable name reported to analytics. */
  name: string;
  className?: string;
  children: React.ReactNode;
};

/**
 * Semantic <section> that fires a single `section:view` marker the first time
 * it scrolls into view. The backbone of section-level engagement tracking.
 */
export function TrackedSection({
  id,
  name,
  className,
  children,
}: TrackedSectionProps) {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: "-30% 0px -30% 0px" });
  const fired = useRef(false);

  useEffect(() => {
    if (inView && !fired.current) {
      fired.current = true;
      track(EVENTS.SECTION_VIEW, { section_id: id, section_name: name });
    }
  }, [inView, id, name]);

  return (
    <section ref={ref} id={id} className={className}>
      {children}
    </section>
  );
}
