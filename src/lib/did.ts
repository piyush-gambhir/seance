















import type { AgentManager } from "@d-id/client-sdk";
import type { MediumActivity, SeanceMessage } from "./types";

export interface MediumCallbacks {

  onStream?: (stream: MediaStream) => void;

  onActivity?: (activity: MediumActivity) => void;

  onConnection?: (state: string) => void;

  onMessage?: (message: SeanceMessage) => void;
  onError?: (error: unknown, data?: unknown) => void;
}

function normalizeActivity(state: unknown): MediumActivity {

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


  async connect(
    agentId: string,
    clientKey: string,
    cb: MediumCallbacks,
  ): Promise<void> {

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


      streamOptions: { compatibilityMode: "auto", streamWarmup: true } as never,
    });

    await this.manager.connect();
  }






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


  async chat(text: string): Promise<void> {
    if (!this.manager) return;
    try {
      await this.manager.chat(text);
    } catch (e) {

      console.warn("[seance] chat() rejected", e);
    }
  }


  interrupt(): void {
    const mgr = this.manager as (AgentManager & { interrupt?: (i: unknown) => void }) | null;
    try {
      mgr?.interrupt?.({ type: "click" });
    } catch {

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

    } finally {
      this.manager = null;
    }
  }
}
