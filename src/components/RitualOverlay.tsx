"use client";

import { RITUAL_INCANTATIONS } from "@/lib/prompts";

interface Props {
  active: boolean;
  pulse: number;
}






export default function RitualOverlay({ active, pulse }: Props) {
  const whisper = RITUAL_INCANTATIONS[pulse % RITUAL_INCANTATIONS.length];

  if (!active) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-30 flex items-end justify-center">

      {[0, 1, 2, 3, 4].map((i) => (
        <span
          key={`${pulse}-${i}`}
          className="wisp animate-smoke"
          style={{
            left: `${20 + i * 15}%`,
            animationDelay: `${i * 0.4}s`,
            bottom: "8%",
          }}
        />
      ))}

      <div
        key={pulse}
        className="absolute top-[14%] animate-rise text-center"
      >
        <p className="display spirit-glow text-lg tracking-[0.3em] text-spirit/90">
          {whisper}
        </p>
      </div>
    </div>
  );
}
