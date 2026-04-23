"use client";

import { useState } from "react";

// Myla's avatar is the Night Sky artwork at /public/myla-avatar.png.
// The peach-gradient "M" circle underneath is kept as a graceful
// fallback for when the image is missing or fails to load, so the
// chat never renders a broken-image glyph.
export default function MylaAvatar({ size = 36 }: { size?: number }) {
  const [failed, setFailed] = useState(false);
  const fontSize = Math.round(size * 0.5);
  return (
    <div
      className="relative flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-peach-gradient font-display font-bold text-midnight shadow-glow"
      style={{ width: size, height: size, fontSize }}
      aria-label="myla"
    >
      <span aria-hidden>M</span>
      {!failed && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src="/myla-avatar.png"
          alt="Myla"
          width={size}
          height={size}
          onError={() => setFailed(true)}
          className="absolute inset-0 h-full w-full rounded-full object-cover"
        />
      )}
    </div>
  );
}
