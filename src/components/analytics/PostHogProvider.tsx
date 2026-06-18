"use client";

import { useEffect } from "react";
import posthog from "posthog-js";
import { EVENTS, track } from "@/lib/analytics";

/**
 * Initialises PostHog on the client and wires up automatic page-level markers:
 *  - pageview / pageleave (built in)
 *  - autocapture of clicks, inputs, etc.
 *  - scroll-depth milestones (25 / 50 / 75 / 100%)
 *
 * Set NEXT_PUBLIC_POSTHOG_KEY in .env.local to start streaming events.
 */
export function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
    const host =
      process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com";

    if (key && !posthog.__loaded) {
      posthog.init(key, {
        api_host: host,
        capture_pageview: true,
        capture_pageleave: true,
        autocapture: true,
        persistence: "localStorage+cookie",
      });
    }
  }, []);

  // Scroll-depth markers
  useEffect(() => {
    const milestones = [25, 50, 75, 100];
    const fired = new Set<number>();

    const onScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight =
        document.documentElement.scrollHeight - window.innerHeight;
      if (docHeight <= 0) return;
      const pct = Math.round((scrollTop / docHeight) * 100);

      for (const m of milestones) {
        if (pct >= m && !fired.has(m)) {
          fired.add(m);
          track(EVENTS.SCROLL_DEPTH, { depth: m });
        }
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return <>{children}</>;
}
