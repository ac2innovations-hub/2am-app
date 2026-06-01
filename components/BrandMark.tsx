// The 2am brand logo mark — the peach-on-midnight "2am" badge that also
// ships as the app icon (/public/icon.svg). Use this anywhere "2am" needs to
// read unmistakably as a brand name / trademark rather than a time of day.
// Render it as a standalone mark in headers, footers, and near any body copy
// that mentions the brand, so the trademark use stays distinct from
// descriptive "2 am" (time-of-day) copy.

type BrandMarkProps = {
  /** Rendered width/height in px (the mark is square). */
  size?: number;
  /** Adds a soft peach glow — use for the hero / large placements. */
  glow?: boolean;
  /** Accessible text alternative. Defaults to "2am logo". */
  alt?: string;
  className?: string;
};

export default function BrandMark({
  size = 40,
  glow = false,
  alt = "2am logo",
  className,
}: BrandMarkProps) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/icon.svg"
      alt={alt}
      width={size}
      height={size}
      className={className}
      style={{
        display: "block",
        flexShrink: 0,
        borderRadius: Math.round(size * 0.22),
        boxShadow: glow ? "0 0 60px rgba(248, 200, 168, 0.35)" : undefined,
      }}
    />
  );
}
