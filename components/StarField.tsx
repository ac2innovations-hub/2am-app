"use client";

import { useMemo } from "react";

export default function StarField({ count = 40 }: { count?: number }) {
  const stars = useMemo(() => {
    // Deterministic layout per client render so it doesn't jiggle on rerender
    return Array.from({ length: count }, (_, i) => {
      const seed = i * 9301 + 49297;
      const r1 = ((seed % 233280) / 233280) * 100;
      const r2 = (((seed * 31) % 233280) / 233280) * 100;
      const r3 = (((seed * 7) % 233280) / 233280) * 4;
      const r4 = (((seed * 13) % 233280) / 233280) * 3;
      return {
        top: `${r1}%`,
        left: `${r2}%`,
        delay: `${r3}s`,
        duration: `${3 + r4}s`,
      };
    });
  }, [count]);

  return (
    <div aria-hidden className="stars">
      {stars.map((s, i) => (
        <span
          key={i}
          style={{
            top: s.top,
            left: s.left,
            animationDelay: s.delay,
            animationDuration: s.duration,
          }}
        />
      ))}
    </div>
  );
}
