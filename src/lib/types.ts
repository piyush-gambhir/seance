


export type SeancePhase =
  | "dormant"
  | "summoning"
  | "present"
  | "channeling"
  | "revealing"
  | "prophecy"
  | "lost";


export type MediumActivity = "idle" | "loading" | "talking" | "tool";


export interface SeanceMessage {
  role: "assistant" | "user" | "system";
  content: string;

  final: boolean;
  at: number;
}


export interface DidCredentials {
  agentId: string;
  clientKey: string;
}


export interface ObjectVerdict {
  object_noun: string;

  specific_visible_attributes: string[];

  confidence: number;
}


export interface SeanceRound {
  index: number;

  object?: string;

  reading: string;
  at: number;
}


export interface ProphecyCard {
  prophecy: string;
  objects: string[];
  sigil: string;
}
