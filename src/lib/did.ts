/**
 * Thin wrapper around @d-id/client-sdk for the SÉANCE app.
 *
 * Architecture (verified against @d-id/client-sdk v1.2.3 + D-ID docs, 2026):
 *   - We connect to a D-ID agent created via the NATIVE ElevenLabs integration
 *     (POST /v2/agents/integrations/elevenlabs). In that agent, ElevenLabs runs
 *     STT + LLM + TTS and D-ID lip-syncs the ElevenLabs voice onto a V4 avatar.
 *   - The browser only uses @d-id/client-sdk. We capture the mic + camera and
 *     publish them; D-ID forwards mic audio to ElevenLabs and samples camera
 *     frames for its built-in vision (Esmé's "second sight").
 *
 * The SDK is browser-only (it pulls in LiveKit and touches `window`), so it is
 * loaded with a dynamic import inside connect() — never at module top level —
 * to keep it out of any server/SSR pass.
 */

import type { AgentManager } from "@d-id/client-sdk";
import type { MediumActivity, SeanceMessage } from "./types";

export interface MediumCallbacks {
  /** The avatar's WebRTC MediaStream (video + ElevenLabs audio). Attach to <video>. */
  onStream?: (stream: MediaStream) => void;
  /** Normalized D-ID agent activity (idle/loading/talking/tool). */
  onActivity?: (activity: MediumActivity) => void;
  /** Raw connection lifecycle string from the SDK. */
  onConnection?: (state: string) => void;
  /** A transcript line (assistant or user), streaming or final. */
  onMessage?: (message: SeanceMessage) => void;
  onError?: (error: unknown, data?: unknown) => void;
}

function normalizeActivity(state: unknown): MediumActivity {
  // SDK AgentActivityState enum values are the upper-cased strings below.
  switch (String(state).toUpperCase()) {
    case "TALKING":
      return "talking";
    case "LOADING":
      return "loading";
    case "TOOL_ACTIVE":
      return "tool";
    default:
      return "idle";
  }
}

export class MediumSession {
  private manager: AgentManager | null = null;
  private connected = false;

  get isConnected() {
    return this.connected;
  }

  /** Create the agent manager and open the stream. */
  async connect(
    agentId: string,
    clientKey: string,
    cb: MediumCallbacks,
  ): Promise<void> {
    // Dynamic import: browser-only SDK.
    const sdk = await import("@d-id/client-sdk");

    const callbacks = {
      onSrcObjectReady: (value: MediaStream) => {
        cb.onStream?.(value);
        return value;
      },
      onConnectionStateChange: (state: string) => {
        if (state === "connected" || state === "completed") this.connected = true;
        if (state === "disconnected" || state === "closed" || state === "fail")
          this.connected = false;
        cb.onConnection?.(state);
      },
      onAgentActivityStateChange: (state: unknown) => {
        cb.onActivity?.(normalizeActivity(state));
      },
      onNewMessage: (
        messages: Array<{ role?: string; content?: string }>,
        type: "answer" | "partial" | "user",
      ) => {
        const m = messages[messages.length - 1];
        if (!m || !m.content) return;
        const role =
          m.role === "assistant" || m.role === "user" || m.role === "system"
            ? (m.role as SeanceMessage["role"])
            : type === "user"
              ? "user"
              : "assistant";
        cb.onMessage?.({
          role,
          content: m.content,
          final: type === "answer",
          at: Date.now(),
        });
      },
      onError: (error: unknown, data?: unknown) => cb.onError?.(error, data),
    };

    this.manager = await sdk.createAgentManager(agentId, {
      auth: { type: "key", clientKey },
      callbacks: callbacks as never,
      // streamOptions are largely inert for V4 expressive but harmless; warmup
      // keeps an idle video on screen so the glass is never blank.
      streamOptions: { compatibilityMode: "auto", streamWarmup: true } as never,
    });

    await this.manager.connect();
  }

  /**
   * Publish the user's camera + mic into the session.
   * D-ID samples the camera for built-in vision and forwards the mic to ElevenLabs.
   * Streams are acquired by the caller (so the camera can also drive the self-view).
   */
  async publishLocalMedia(camera?: MediaStream, mic?: MediaStream): Promise<void> {
    if (!this.manager) throw new Error("Medium not connected");
    const mgr = this.manager as AgentManager & {
      publishMicrophoneStream?: (s: MediaStream) => Promise<void>;
      publishCameraStream?: (s: MediaStream) => Promise<void>;
    };
    if (mic && mgr.publishMicrophoneStream) {
      await mgr.publishMicrophoneStream(mic);
    }
    if (camera && mgr.publishCameraStream) {
      await mgr.publishCameraStream(camera);
    }
  }

  /** Send text to the ElevenLabs agent as a user turn (e.g. nudge a final prophecy). */
  async chat(text: string): Promise<void> {
    if (!this.manager) return;
    try {
      await this.manager.chat(text);
    } catch (e) {
      // chat() rejects on empty/too-long/maintenance — non-fatal for our UX.
      console.warn("[seance] chat() rejected", e);
    }
  }

  /** Manual "stop talking" barge-in. Voice barge-in is handled by ElevenLabs turn-taking. */
  interrupt(): void {
    const mgr = this.manager as (AgentManager & { interrupt?: (i: unknown) => void }) | null;
    try {
      mgr?.interrupt?.({ type: "click" });
    } catch {
      /* interrupt may be a no-op on the expressive path; ignore */
    }
  }

  async disconnect(): Promise<void> {
    this.connected = false;
    try {
      const mgr = this.manager as
        | (AgentManager & {
            unpublishCameraStream?: () => Promise<void>;
            unpublishMicrophoneStream?: () => Promise<void>;
          })
        | null;
      await mgr?.unpublishCameraStream?.();
      await mgr?.unpublishMicrophoneStream?.();
      await this.manager?.disconnect?.();
    } catch {
      /* ignore teardown errors */
    } finally {
      this.manager = null;
    }
  }
}
