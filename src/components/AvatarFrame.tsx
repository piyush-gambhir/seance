"use client";

import { useEffect, useRef } from "react";
import type { MediumActivity, SeancePhase } from "@/lib/types";

interface Props {
  stream: MediaStream | null;
  activity: MediumActivity;
  phase: SeancePhase;
}

/** The gilt-framed looking-glass the medium appears within. */
export default function AvatarFrame({ stream, activity, phase }: Props) {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const v = videoRef.current;
    if (v && stream && v.srcObject !== stream) {
      v.srcObject = stream;
      v.play().catch(() => {
        /* a user gesture already started the séance; autoplay should be allowed */
      });
    }
  }, [stream]);

  const talking = activity === "talking";
  const channeling = phase === "channeling";

  return (
    <div className="relative">
      {/* candle glow that intensifies while she speaks */}
      <div
        className="pointer-events-none absolute -inset-10 rounded-full blur-3xl transition-opacity duration-700"
        style={{
          background:
            "radial-gradient(circle, rgba(245,201,123,0.35), transparent 65%)",
          opacity: talking ? 0.9 : 0.4,
        }}
      />
      <div className={`gilt-frame ${talking ? "shadow-candle" : ""}`}>
        <div className="gilt-frame__inner aspect-[3/4] w-[min(78vw,420px)]">
          {stream ? (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="h-full w-full object-cover"
              style={{
                filter: channeling
                  ? "saturate(0.7) brightness(0.85) contrast(1.1)"
                  : "saturate(0.95) contrast(1.05)",
                transition: "filter 0.6s ease",
              }}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <div className="h-24 w-24 animate-breathe rounded-full bg-[radial-gradient(circle,rgba(159,216,210,0.5),transparent_70%)]" />
            </div>
          )}

          {/* a faint scrying shimmer over the glass */}
          <div
            className="pointer-events-none absolute inset-0 mix-blend-screen"
            style={{
              background:
                "linear-gradient(120deg, transparent 40%, rgba(159,216,210,0.06) 50%, transparent 60%)",
            }}
          />

          {/* channeling veil */}
          {channeling && (
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_60%,rgba(42,21,56,0.1),rgba(10,7,16,0.55))] transition-opacity" />
          )}
        </div>
      </div>

      {/* speaking indicator */}
      <div className="mt-4 flex items-center justify-center gap-2 text-[0.7rem] tracking-[0.25em] text-gild/80 display">
        <span
          className={`inline-block h-1.5 w-1.5 rounded-full ${
            talking ? "bg-candle animate-flicker" : "bg-gild/40"
          }`}
        />
        {phase === "channeling"
          ? "CHANNELING"
          : talking
            ? "THE MEDIUM SPEAKS"
            : phase === "summoning"
              ? "SUMMONING"
              : "THE MEDIUM LISTENS"}
      </div>
    </div>
  );
}
