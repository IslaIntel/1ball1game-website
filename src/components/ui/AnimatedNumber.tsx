"use client";

import { useEffect, useRef, useState } from "react";
import { animate, useInView } from "framer-motion";

type AnimatedNumberProps = {
  value: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  format?: (n: number) => string;
  onComplete?: () => void;
  className?: string;
};

export function AnimatedNumber({
  value,
  duration = 1.8,
  prefix = "",
  suffix = "",
  format,
  onComplete,
  className,
}: AnimatedNumberProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const controls = animate(0, value, {
      duration,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (latest) => setDisplay(latest),
      onComplete,
    });
    return () => controls.stop();
  }, [inView, value, duration, onComplete]);

  const rendered = format
    ? format(display)
    : Math.round(display).toLocaleString();

  return (
    <span ref={ref} className={className}>
      {prefix}
      {rendered}
      {suffix}
    </span>
  );
}
