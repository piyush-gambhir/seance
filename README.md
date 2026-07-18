# 🔮 SÉANCE — The Haunted Object Reader

> Hold up any object — a chipped mug, a single shoe, your roommate's hairbrush — and **Madame Esmé Voss**, a Victorian ghost medium dead since 1881, channels its "spirit story" live: naming the actual chip on the rim, then reacting to the exact moment your face cracks.

SÉANCE is a webcam-first parlor game where the entire mechanic is a character who genuinely **sees what you show her** and **reacts to how you take it**. It's built for one of those "wait, how did it know that?" moments you immediately want to share.

It's a showcase of **D-ID expressive avatars** + **ElevenLabs Agents** working as one:

| Trait | How SÉANCE delivers it |
|------|------------------------|
| **Expressive** | A theatrical 1880s medium is the perfect vehicle for D-ID's V4 expressive avatar — hush, gasp, cackle, mock-offense. Personality *is* the product. |
| **Aware** | Vision is **load-bearing, not bolted on** — remove the camera and there's no game. D-ID's built-in vision feeds what she sees into the ElevenLabs conversation in real time. |
| **Engaging** | ElevenLabs Agents drives natural turn-taking, barge-in, and a voice with real character, lip-synced onto the avatar. |

---

## How it works

```
            ┌──────────────────────── your browser ────────────────────────┐
  🎤 mic ──▶│  @d-id/client-sdk  ──(LiveKit/WebRTC)──▶  D-ID agent           │
  📷 cam ──▶│      ▲                                       │ (server-side)   │
            │      │ lip-synced avatar (video + voice)     ▼                 │
   <video> ◀┘      │                            ┌─────────────────────────┐ │
            │   séance UI: gilt frame,          │  ElevenLabs Agent       │ │
            │   ritual smoke, candle meter,     │  STT → LLM → TTS        │ │
            │   prophecy share-card             │  + turn-taking          │ │
            └───────────────────────────────────┴─────────────────────────┘ │
                                                  ▲  D-ID samples the camera
                                                  └─ frames → ElevenLabs vision context
```

- **ElevenLabs Agents** is the brain: speech-to-text, the LLM (Esmé's persona), text-to-speech, and turn-taking.
- **D-ID** binds to that agent via its **native ElevenLabs integration**, lip-syncs the ElevenLabs voice onto a V4 expressive avatar, and runs **built-in vision** that samples the camera and feeds visual context into the conversation.
- The browser only talks to **`@d-id/client-sdk`** — D-ID bridges the audio to ElevenLabs server-side, so there's no fragile client audio relay.
- A thin client layer adds the **séance theatre**: a motion detector that fires the "channeling" ritual the instant you hold something up, the candle meter, captions, and a downloadable **prophecy card**.
- **Optional**: a Gemini vision route adds a structured object read to label the prophecy card. The app runs fine without it.

---

## Quickstart

You need a **D-ID** account (paid plan — the ElevenLabs integration requires it), an **ElevenLabs** account with an Agent, and optionally a free **Gemini** key.

```bash
npm install
cp .env.example .env.local          # fill in DID_API_KEY, ELEVENLABS_API_KEY, ELEVENLABS_AGENT_ID
npm run setup:agent                  # creates the D-ID↔ElevenLabs agent, prints DID_AGENT_ID + DID_CLIENT_KEY
#   …paste those two values into .env.local…
npm run dev                          # http://localhost:3000
```

👉 **Full walkthrough (including how to create the Esmé agent in ElevenLabs):** [docs/SETUP.md](docs/SETUP.md)

## Docs

- [**SETUP.md**](docs/SETUP.md) — step-by-step setup, deploy, and troubleshooting
- [**ESME_ELEVENLABS_CONFIG.md**](docs/ESME_ELEVENLABS_CONFIG.md) — the exact persona, voice & agent settings to paste into ElevenLabs
- [**ARCHITECTURE.md**](docs/ARCHITECTURE.md) — the verified data flow, design decisions, and SDK references
- [**VIRAL_VIDEO_SCRIPT.md**](docs/VIRAL_VIDEO_SCRIPT.md) — the 60–85s demo script + shot list

## Tech

Next.js (App Router) · `@d-id/client-sdk` · ElevenLabs Agents Platform · `@google/genai` (optional) · Tailwind CSS · TypeScript.

Built for the D-ID × ElevenLabs hackathon.

## License

The source code is available under the [MIT License](LICENSE). D-ID,
ElevenLabs, Gemini, and their respective SDKs and services remain subject to
their own terms and licenses.
