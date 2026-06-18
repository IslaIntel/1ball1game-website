type BallGlyphProps = {
  className?: string;
  stroke?: string;
  fill?: string;
};

/** Minimal line-art soccer ball used as a recurring brand motif. */
export function BallGlyph({
  className,
  stroke = "currentColor",
  fill = "none",
}: BallGlyphProps) {
  return (
    <svg
      viewBox="0 0 100 100"
      className={className}
      fill={fill}
      stroke={stroke}
      strokeWidth="3"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="50" cy="50" r="46" />
      <polygon points="50,30 62,39 57,53 43,53 38,39" fill={stroke} stroke="none" />
      <path d="M50 30 L50 8" />
      <path d="M62 39 L82 28" />
      <path d="M57 53 L70 71" />
      <path d="M43 53 L30 71" />
      <path d="M38 39 L18 28" />
      <path d="M30 71 Q50 80 70 71" />
      <path d="M18 28 Q12 48 30 71" />
      <path d="M82 28 Q88 48 70 71" />
      <path d="M18 28 Q34 16 50 8" />
      <path d="M82 28 Q66 16 50 8" />
    </svg>
  );
}
