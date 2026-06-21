"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { MediumSession } from "./did";
import { MotionWatcher, grabFrame } from "./motion";
import type {
  DidCredentials,
  MediumActivity,
  ProphecyCard,
  SeanceMessage,
  SeancePhase,
} from "./types";

/** Objects needed to fill the séance meter before the grand prophecy unlocks. */
export const OBJECTS_TO_PROPHECY = 3;

interface SeanceState {
  phase: SeancePhase;
  connection: string;
  activity: MediumActivity;
  messages: SeanceMessage[];
  caption: string;
  objectsPresented: number;
  objects: string[];
  ritualPulse: number;
  prophecy: ProphecyCard | null;
  error: string | null;
  cameraStream: MediaStream | null;
  avatarStream: MediaStream | null;
}

const INITIAL: SeanceState = {
  phase: "dormant",
  connection: "new",
  activity: "idle",
  messages: [],
  caption: "",
  objectsPresented: 0,
  objects: [],
  ritualPulse: 0,
  prophecy: null,
  error: null,
  cameraStream: null,
  avatarStream: null,
};

export function useSeance() {
  const [state, setState] = useState<SeanceState>(INITIAL);
  const patch = useCallback(
    (p: Partial<SeanceState>) => setState((s) => ({ ...s, ...p })),
    [],
  );

  const sessionRef = useRef<MediumSession | null>(null);
  const motionRef = useRef<MotionWatcher | null>(null);
  const camVideoRef = useRef<HTMLVideoElement | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const camStreamRef = useRef<MediaStream | null>(null);
  const revealingRef = useRef(false); // true once user asked for the final prophecy
  const phaseRef = useRef<SeancePhase>("dormant");
  phaseRef.current = state.phase;

  // ── OPTIONAL: enrich the prophecy card with a structured object read. ──────
  const inspectObject = useCallback(async () => {
    const video = camVideoRef.current;
    if (!video) return;
    const image = grabFrame(video);
    if (!image) return;
    try {
      const res = await fetch("/api/vision", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image }),
      });
      if (!res.ok) return; // vision is optional; silently skip
      const verdict = (await res.json()) as { object_noun?: string; confidence?: number };
      if (verdict.object_noun && (verdict.confidence ?? 0) >= 0.45) {
        setState((s) =>
          s.objects.includes(verdict.object_noun!)
            ? s
            : { ...s, objects: [...s.objects, verdict.object_noun!] },
        );
      }
    } catch {
      /* vision disabled or offline — fine */
    }
  }, []);

  // ── A new object was held up and held still. ──────────────────────────────
  const onObjectPresented = useCallback(() => {
    if (phaseRef.current === "dormant" || phaseRef.current === "lost") return;
    setState((s) => ({
      ...s,
      phase: s.phase === "prophecy" ? "prophecy" : "channeling",
      objectsPresented: s.objectsPresented + 1,
      ritualPulse: s.ritualPulse + 1,
    }));
    void inspectObject();
  }, [inspectObject]);

  // ── Connect to the medium. ────────────────────────────────────────────────
  const begin = useCallback(async () => {
    if (sessionRef.current) return;
    patch({ phase: "summoning", error: null });

    // 1) Permissions + local media.
    let cam: MediaStream;
    let mic: MediaStream;
    try {
      cam = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: "user" },
      });
      mic = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      });
    } catch {
      patch({
        phase: "lost",
        error: "The glass needs your camera and microphone to see and hear you.",
      });
      return;
    }
    camStreamRef.current = cam;
    micStreamRef.current = mic;

    // Internal video element purely for motion sampling.
    const v = document.createElement("video");
    v.muted = true;
    v.playsInline = true;
    v.autoplay = true;
    v.srcObject = cam;
    camVideoRef.current = v;
    try {
      await v.play();
    } catch {
      /* autoplay of a muted local stream rarely fails */
    }

    // 2) Fetch agent credentials (kept out of the static bundle).
    let creds: DidCredentials;
    try {
      const res = await fetch("/api/did-credentials");
      if (!res.ok) throw new Error(String(res.status));
      creds = (await res.json()) as DidCredentials;
      if (!creds.agentId || !creds.clientKey) throw new Error("missing creds");
    } catch {
      patch({
        phase: "lost",
        error:
          "The medium cannot be summoned — D-ID credentials are not configured. See docs/SETUP.md.",
      });
      return;
    }

    // 3) Connect the medium.
    const session = new MediumSession();
    sessionRef.current = session;
    try {
      await session.connect(creds.agentId, creds.clientKey, {
        onStream: (stream) => patch({ avatarStream: stream }),
        onConnection: (c) => {
          patch({ connection: c });
          if (c === "fail" || c === "closed")
            patch({ phase: "lost", error: "The connection to the beyond was severed." });
        },
        onActivity: (activity: MediumActivity) => {
          setState((s) => {
            let phase = s.phase;
            if (activity === "talking") {
              phase = revealingRef.current ? "prophecy" : "revealing";
            } else if (
              (activity === "idle" || activity === "loading") &&
              s.phase !== "summoning" &&
              s.phase !== "prophecy"
            ) {
              phase = "present";
            }
            return { ...s, activity, phase };
          });
        },
        onMessage: (message) => {
          setState((s) => {
            const messages = [...s.messages, message].slice(-40);
            let caption = s.caption;
            let objectsPresented = s.objectsPresented;
            let prophecy = s.prophecy;
            if (message.role === "assistant") {
              caption = message.content;
              // Capture the grand prophecy text once the user has asked for it.
              if (revealingRef.current && message.final && !prophecy) {
                prophecy = {
                  prophecy: message.content,
                  objects: s.objects,
                  sigil: "The glass has spoken",
                };
              }
            }
            return { ...s, messages, caption, objectsPresented, prophecy };
          });
        },
        onError: (err) => console.warn("[seance] medium error", err),
      });
    } catch (e) {
      console.error(e);
      patch({ phase: "lost", error: "The séance could not begin. The spirits are restless." });
      return;
    }

    // 4) Publish mic + camera (mic → ElevenLabs; camera → D-ID built-in vision).
    try {
      await session.publishLocalMedia(cam, mic);
    } catch (e) {
      console.warn("[seance] publishLocalMedia", e);
    }

    // 5) Expose self-view + start motion detection.
    patch({ phase: "present", cameraStream: cam });
    const motion = new MotionWatcher();
    motionRef.current = motion;
    motion.start(v, onObjectPresented);
  }, [patch, onObjectPresented]);

  // ── Ask Esmé for the grand finale. ────────────────────────────────────────
  const reveal = useCallback(() => {
    revealingRef.current = true;
    patch({ phase: "prophecy" });
    void sessionRef.current?.chat(
      "I am ready. Give me my final reading — fuse every object you have seen tonight into one grand prophecy about my life.",
    );
  }, [patch]);

  /** Manual "stop talking". */
  const hush = useCallback(() => sessionRef.current?.interrupt(), []);

  // ── Teardown. ─────────────────────────────────────────────────────────────
  const end = useCallback(() => {
    motionRef.current?.stop();
    motionRef.current = null;
    void sessionRef.current?.disconnect();
    sessionRef.current = null;
    camStreamRef.current?.getTracks().forEach((t) => t.stop());
    micStreamRef.current?.getTracks().forEach((t) => t.stop());
    camStreamRef.current = null;
    micStreamRef.current = null;
    camVideoRef.current = null;
    revealingRef.current = false;
    setState(INITIAL);
  }, []);

  useEffect(() => () => end(), [end]);

  return {
    ...state,
    canReveal: state.objectsPresented >= OBJECTS_TO_PROPHECY && !state.prophecy,
    begin,
    reveal,
    hush,
    end,
  };
}
