// Shared types for the SÉANCE client + API routes.

/** The four states the séance can be in, used to drive UI + ambience. */
export type SeancePhase =
  | "dormant" // not yet connected
  | "summoning" // connecting to the medium
  | "present" // Esmé is here, waiting / listening
  | "channeling" // a new object was presented; Esmé is divining
  | "revealing" // Esmé is speaking a reading
  | "prophecy" // final fused prophecy moment
  | "lost"; // connection failed / spirit departed

/** D-ID agent activity, normalized from the SDK's AgentActivityState enum. */
export type MediumActivity = "idle" | "loading" | "talking" | "tool";

/** A line of conversation, captured from the D-ID `onNewMessage` callback. */
export interface SeanceMessage {
  role: "assistant" | "user" | "system";
  content: string;
  /** true once this message is final (type === 'answer'); false while streaming. */
  final: boolean;
  at: number;
}

/** Credentials served by /api/did-credentials to the browser. */
export interface DidCredentials {
  agentId: string;
  clientKey: string;
}

/** Structured object verdict from the OPTIONAL Gemini vision route. */
export interface ObjectVerdict {
  object_noun: string;
  /** 2-3 specific, hard-to-fake visible details actually present in the frame. */
  specific_visible_attributes: string[];
  /** model confidence 0..1 that the object was clearly identified. */
  confidence: number;
}

/** One round of the séance: an object was read. */
export interface SeanceRound {
  index: number;
  /** what the medium was shown, if we captured a structured read (optional). */
  object?: string;
  /** the reading she gave (assistant transcript for this round). */
  reading: string;
  at: number;
}

/** Data needed to render the final prophecy share-card. */
export interface ProphecyCard {
  prophecy: string;
  objects: string[];
  sigil: string; // a short evocative subtitle / "sign"
}
