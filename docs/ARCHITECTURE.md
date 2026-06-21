# SÉANCE — Architecture

A precise account of how D-ID and ElevenLabs are bridged, why this design was
chosen over the alternatives, and the SDK facts it's built on (verified June 2026).

---

## The integration in one paragraph

We use **D-ID's native ElevenLabs Agent integration**. You create a D-ID agent
(`POST /v2/agents/integrations/elevenlabs`) that is *bound* to your ElevenLabs
Agent. At runtime, ElevenLabs does **STT → LLM → TTS → turn-taking**; D-ID
receives the synthesized ElevenLabs speech and **lip-syncs it onto a V4 expressive
avatar**; and D-ID's **built-in vision** samples the camera track and feeds visual
context into the ElevenLabs conversation. The browser only uses
`@d-id/client-sdk` — **D-ID bridges the audio to ElevenLabs server-side**, so
there is no client-side audio relay.

This satisfies the prize's three axes at their intersection: a genuine
**ElevenLabs Agent** as the brain (not just an ElevenLabs voice), a real
**D-ID expressive avatar** as the face, and **vision that's essential** to the game.

## Data flow

```
 user mic  ─┐
            ├─ getUserMedia ─▶ @d-id/client-sdk ─ publishMicrophoneStream ─┐
 user cam  ─┘                         │           publishCameraStream ─────┤
                                      │                                    ▼
                                      │                          D-ID (server)
                                      │                          ├─ forwards mic → ElevenLabs Agent
                                      │                          ├─ samples cam frames → vision model
                                      │                          │     → injected as context into the
                                      │                          │       ElevenLabs conversation
                                      │                          ├─ ElevenLabs: STT→LLM→TTS→turn-taking
                                      │                          └─ lip-syncs EL audio onto V4 avatar
                                      │                                    │
   <video> ◀── onSrcObjectReady ◀─────┴──── LiveKit/WebRTC media stream ◀──┘
   (avatar video + ElevenLabs voice)
```

Client-side theatre layered on top (all in `src/`):

- **`lib/useSeance.ts`** — orchestrator hook: permissions, connect, publish media,
  phase state machine, transcript capture, prophecy capture.
- **`lib/did.ts`** — `@d-id/client-sdk` wrapper (`createAgentManager`, publish
  mic/cam, normalize activity, `chat`, `interrupt`, teardown).
- **`lib/motion.ts`** — dependency-free frame-diff watcher that fires the instant
  a new object is held up and held still → triggers the "channeling" ritual.
- **components** — gilt-framed avatar, ritual smoke + whisper, candle meter,
  self-view, captions, downloadable prophecy card.
- **`app/api/did-credentials`** — serves the agent id + (domain-scoped) client key.
- **`app/api/vision`** — *optional* Gemini structured object read for the card.

## Phase state machine

`dormant → summoning → present → channeling → revealing → (loops) → prophecy`
(plus `lost` on failure). Phases are driven by D-ID's `onAgentActivityStateChange`
(`TALKING`/`LOADING`/`IDLE`) and the local motion detector. `channeling` is fired
locally the instant an object is presented, so the ritual covers the brief moment
before Esmé speaks — **latency, in costume**.

---

## Why this design (alternatives considered)

We evaluated three ways to put an ElevenLabs voice on a D-ID face:

| Approach | Verdict |
|---------|---------|
| **(A) Manual audio relay** — capture ElevenLabs `onAudio` PCM, encode, upload to a URL, `speak({type:'audio', audio_url})` | ❌ Rejected. D-ID's `speak()` only accepts a **static `audio_url` (≤15MB)** — there is no streaming-audio input. Relaying per-turn adds multiple seconds of latency and double-audio risk. |
| **(B) D-ID brain + ElevenLabs *voice*** — D-ID runs the LLM and uses ElevenLabs only as a TTS provider | ❌ Rejected. Robust, but it uses ElevenLabs as a *voice*, not the **ElevenLabs Agents** platform — a weaker story for this prize. |
| **(A′) D-ID native ElevenLabs Agent** — ElevenLabs Agent is the brain; D-ID bridges audio server-side; built-in vision | ✅ **Chosen.** Strongest "uses ElevenAgents," low latency, supported product, and vision is built in. |

Key fact that ruled out (A): the D-ID SDK and Talks/Agents-Streams APIs expose only
`{type:'text'}` and `{type:'audio', audio_url}` script shapes — **no streaming
audio track ingestion**. So you cannot pipe a live ElevenLabs WebRTC audio track
into D-ID. The native integration exists precisely to solve this server-side.

---

## SDK facts this is built on (verified)

**`@d-id/client-sdk` (v1.2.3):**
- `createAgentManager(agentId, { auth:{type:'key', clientKey}, callbacks, streamOptions })`.
- Mandatory `onSrcObjectReady(stream)` → attach to `<video>`.
- `onAgentActivityStateChange` enum `IDLE | LOADING | TALKING | TOOL_ACTIVE` — best
  signal for "she's mid-sentence."
- `onNewMessage(messages, 'answer'|'partial'|'user')` — transcripts.
- **The SDK does not auto-capture the webcam** — we call `getUserMedia` and
  `publishCameraStream` / `publishMicrophoneStream` ourselves (LiveKit/expressive).
- `chat(text)` sends a **user turn** to the ElevenLabs agent (there's no
  non-interrupting client context channel — built-in vision is the ambient
  awareness path).
- `interrupt({type})` is gated and may skip text-interrupts on the expressive path.

**D-ID native ElevenLabs integration:**
- `POST /secrets` → store ElevenLabs key → `secret_id`.
- `POST /v2/agents/integrations/elevenlabs` with `presenter:{type:'expressive',...}`,
  `external_agent:{type:'elevenlabs', agent_id, secret_id}`, `vision:{enabled:true}`
  → returns `id` + `client_key`.
- Built-in vision: "D-ID samples frames, runs them through a vision model, and feeds
  the visual context into the ElevenLabs conversation as system updates."
- Requires a **paid D-ID plan**.

**ElevenLabs Agents:** STT + LLM + TTS + turn-taking, configured in the dashboard
(persona, voice, interruptions). Bound into the D-ID agent; the browser never holds
an ElevenLabs key.

**Optional vision enrichment:** `@google/genai`, model `gemini-3.5-flash`
(note: `gemini-2.0-flash` was retired June 2026), schema-enforced JSON, free tier.
One swappable `analyze()` function in `app/api/vision/route.ts`.

## Security

- The **ElevenLabs API key** never reaches the browser — it lives in D-ID's secret
  vault (stored once during setup) and in server env for setup only.
- The **D-ID client key** is domain-scoped (safe in-browser) and served via
  `/api/did-credentials` so it stays out of the static bundle and is rotatable.
- The **Gemini key** is server-only in the `/api/vision` route.

## Known "verify against your live account" items

See [SETUP.md §6](SETUP.md#6-verify-against-your-live-d-id-account): the `/secrets`
body shape, camera auto-capture, `status:"done"` polling, and whether manual
`interrupt()` cancels an in-flight ElevenLabs turn on the expressive path.
