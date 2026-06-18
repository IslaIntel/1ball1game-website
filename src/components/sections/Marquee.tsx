import { BallGlyph } from "@/components/ui/BallGlyph";

const WORDS = [
  "Access",
  "Opportunity",
  "Community",
  "Teamwork",
  "Confidence",
  "Belonging",
];

export function Marquee() {
  const items = [...WORDS, ...WORDS];
  return (
    <div className="overflow-hidden border-y border-ink/10 bg-royal py-5">
      <div className="animate-marquee flex w-max items-center gap-8 whitespace-nowrap">
        {items.map((word, i) => (
          <div key={i} className="flex items-center gap-8">
            <span className="font-display text-2xl font-medium text-cloud sm:text-3xl">
              {word}
            </span>
            <BallGlyph className="h-5 w-5 text-magenta" />
          </div>
        ))}
      </div>
    </div>
  );
}
