"use client";

import { useEffect, useRef } from "react";
import { useSeance } from "@/lib/useSeance";
import AvatarFrame from "./AvatarFrame";
import RitualOverlay from "./RitualOverlay";
import SeanceMeter from "./SeanceMeter";
import ProphecyCard from "./ProphecyCard";

export default function SeanceStage() {
  const s = useSeance();

  return (
    <main className="room-bg vignette grain relative flex min-h-[100dvh] flex-col items-center overflow-hidden">
      {s.phase === "dormant" && <Intro onBegin={s.begin} />}
      {s.phase === "lost" && (
        <Lost
          message={s.error}
          onRetry={() => {
            s.end();
            setTimeout(s.begin, 60);
          }}
        />
      )}

      {s.phase !== "dormant" && s.phase !== "lost" && (
        <>
          <Stage s={s} />
          <RitualOverlay active={s.phase === "channeling"} pulse={s.ritualPulse} />
          {s.prophecy && <ProphecyCard data={s.prophecy} onAgain={s.end} />}
        </>
      )}
    </main>
  );
}

/* ─────────────────────────────────────────────────────────────────────────── */

function Intro({ onBegin }: { onBegin: () => void }) {
  return (
    <div className="animate-rise relative z-10 flex min-h-[100dvh] flex-col items-center justify-center px-6 text-center">
      <p className="display text-xs tracking-[0.4em] text-gild/70">A HAUNTED PARLOR GAME</p>
      <h1 className="display text-glow mt-4 text-5xl font-black tracking-[0.18em] text-bone sm:text-7xl">
        SÉANCE
      </h1>
      <p className="mt-5 max-w-md text-xl leading-relaxed text-bone/80">
        Hold up any object — a chipped mug, a single shoe — and{" "}
        <span className="text-candle">Madame Esmé Voss</span>, dead since 1881, will
        channel its spirit story. She sees what you show her. She reacts to your face.
      </p>

      <button className="btn-arcane mt-10" onClick={onBegin}>
        Begin the séance
      </button>

      <p className="mt-6 max-w-sm text-sm text-bone/45">
        Allow your camera &amp; microphone when prompted — the glass must see and hear you.
      </p>

      <p className="display absolute bottom-6 text-[0.6rem] tracking-[0.3em] text-gild/40">
        AVATAR BY D-ID · VOICE &amp; MIND BY ELEVENLABS
      </p>
    </div>
  );
}

function Lost({ message, onRetry }: { message: string | null; onRetry: () => void }) {
  return (
    <div className="animate-rise relative z-10 flex min-h-[100dvh] flex-col items-center justify-center px-6 text-center">
      <h2 className="display text-3xl tracking-[0.2em] text-blood/90">THE VEIL CLOSED</h2>
      <p className="mt-4 max-w-md text-lg text-bone/75">
        {message ?? "The spirits have withdrawn."}
      </p>
      <button className="btn-arcane mt-8" onClick={onRetry}>
        Try the glass again
      </button>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────── */

function Stage({ s }: { s: ReturnType<typeof useSeance> }) {
  const showHint = s.phase === "present" && s.objectsPresented === 0 && !s.caption;

  return (
    <div className="relative z-10 flex min-h-[100dvh] w-full max-w-2xl flex-col items-center justify-between px-4 py-6">
      {/* top: meter */}
      <div className="flex w-full items-start justify-between">
        <div className="display text-[0.62rem] tracking-[0.3em] text-gild/60">SÉANCE</div>
        <SeanceMeter presented={s.objectsPresented} />
        <button
          className="display text-[0.62rem] tracking-[0.25em] text-gild/50 hover:text-bone"
          onClick={s.end}
        >
          LEAVE
        </button>
      </div>

      {/* center: the medium */}
      <div className="flex flex-col items-center">
        <AvatarFrame stream={s.avatarStream} activity={s.activity} phase={s.phase} />

        {showHint && (
          <p className="animate-rise mt-6 max-w-xs text-center text-lg text-bone/70">
            Hold something to the glass…
          </p>
        )}

        {/* caption / subtitle */}
        {s.caption && (s.activity === "talking" || s.phase === "prophecy") && (
          <div className="mt-5 max-w-lg px-2 text-center">
            <p className="text-xl italic leading-snug text-bone text-glow">
              “{s.caption}”
            </p>
          </div>
        )}
      </div>

      {/* bottom: controls + self-view */}
      <div className="flex w-full items-end justify-between">
        <div className="flex flex-col gap-3">
          {s.canReveal && (
            <button className="btn-arcane animate-rise" onClick={s.reveal}>
              Reveal my fate
            </button>
          )}
          {s.activity === "talking" && (
            <button className="btn-ghost" onClick={s.hush}>
              Hush
            </button>
          )}
        </div>

        <SelfView stream={s.cameraStream} />
      </div>
    </div>
  );
}

function SelfView({ stream }: { stream: MediaStream | null }) {
  const ref = useRef<HTMLVideoElement | null>(null);
  useEffect(() => {
    const v = ref.current;
    if (v && stream && v.srcObject !== stream) {
      v.srcObject = stream;
      v.play().catch(() => {});
    }
  }, [stream]);

  return (
    <div className="overflow-hidden rounded-lg border border-gild/30 shadow-lg">
      <video
        ref={ref}
        autoPlay
        playsInline
        muted
        className="h-24 w-32 -scale-x-100 object-cover opacity-80 sm:h-28 sm:w-40"
      />
    </div>
  );
}
