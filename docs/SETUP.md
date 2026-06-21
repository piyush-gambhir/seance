# SÉANCE — Setup & Deploy

End-to-end setup, from zero to a running séance, plus deployment and the handful
of things to verify against your live D-ID account.

---

## 0. Prerequisites

| You need | Why | Notes |
|----------|-----|-------|
| **D-ID account, paid plan** | The avatar + the native ElevenLabs integration | Bring-your-own-ElevenLabs-key requires a paid plan. Get your API key at studio.d-id.com → API. |
| **ElevenLabs account + an Agent** | The brain (STT + LLM + TTS + turn-taking) | Create the Esmé agent per [ESME_ELEVENLABS_CONFIG.md](ESME_ELEVENLABS_CONFIG.md). |
| **Node 18+** | `npm run setup:agent` uses built-in `fetch` | |
| **Gemini API key** *(optional)* | Structured object read for the prophecy card | Free at aistudio.google.com/apikey. App works without it. |
| A laptop with a **webcam + mic**, on **Chrome** | The experience | Desktop Chrome is the most reliable for WebRTC + camera publishing. |

---

## 1. Create the ElevenLabs agent (Esmé)

Follow [ESME_ELEVENLABS_CONFIG.md](ESME_ELEVENLABS_CONFIG.md): create the agent,
paste the system prompt + first message, choose a characterful low-stability
voice, enable interruptions. Copy the **Agent ID** (`agent_…`).

## 2. Configure environment

```bash
cp .env.example .env.local
```

Fill in:

```ini
DID_API_KEY=...              # D-ID Studio → API
ELEVENLABS_API_KEY=...       # ElevenLabs → profile → API key
ELEVENLABS_AGENT_ID=agent_...# from step 1
# optional:
GEMINI_API_KEY=...
DID_PRESENTER_ID=public_mia_elegant@avt_TJ0Tq5   # or your own V4 expressive presenter
```

> **Pick a presenter that fits.** The default is a generic public presenter. For
> a stronger character, create a custom **V4 "expressive" presenter** in D-ID
> Studio (a Victorian-medium portrait works beautifully) and put its id here.

## 3. Create the avatar agent

```bash
npm install
npm run setup:agent
```

This stores your ElevenLabs key in D-ID's vault, creates a D-ID agent bound to
your ElevenLabs agent with **vision enabled**, waits for it to render, and prints:

```
DID_AGENT_ID=...
DID_CLIENT_KEY=...
```

Paste both into `.env.local`. (They're also written to `.seance-agent.json`,
which is gitignored.)

## 4. Run

```bash
npm run dev
# open http://localhost:3000, click "Begin the séance", allow camera + mic
```

Hold an object up to the camera. Esmé should react.

---

## 5. Deploy (Vercel)

1. Push to a Git repo and import into Vercel.
2. Add the same env vars (`DID_API_KEY`, `ELEVENLABS_API_KEY`,
   `ELEVENLABS_AGENT_ID`, `DID_AGENT_ID`, `DID_CLIENT_KEY`, optional `GEMINI_API_KEY`,
   and `NEXT_PUBLIC_SITE_URL=https://your-domain`) in the Vercel project settings.
3. **Authorize your production domain on the D-ID client key.** The client key is
   domain-scoped — in D-ID Studio (Agents → your agent → Embed) add your Vercel
   domain to the allowed domains, or it will refuse to connect in production.
   Do this on day one, not demo day.

Camera/mic require **HTTPS** — Vercel gives you that automatically; `localhost`
is also treated as secure.

---

## 6. Verify against your live D-ID account

D-ID's docs and SDK source disagree on a few details. None block the build, but
confirm these the first time you run it (they're the usual "works on my account"
gotchas):

- **`/secrets` body shape.** The setup script tries two provider shapes
  (`elevenlabs-key` then `elevenlabs`) and uses whichever the API accepts. If both
  fail, your plan may not include the integration — check your D-ID tier.
- **Camera auto-capture.** We explicitly `getUserMedia({video})` and call
  `publishCameraStream` because the npm SDK (unlike the hosted embed widget) does
  not auto-capture. If you see the avatar but vision seems blind, confirm the
  camera track is publishing (browser devtools → the LiveKit room).
- **`status:"done"` polling.** The setup script tolerates the field being absent.
- **Manual `interrupt()`.** Voice barge-in is handled by ElevenLabs turn-taking
  (just talk over her). The "Hush" button calls `interrupt({type:'click'})`; on
  the expressive path text-interrupts may be ignored — verify it actually stops her.

---

## Troubleshooting

| Symptom | Fix |
|--------|-----|
| "D-ID credentials are not configured" | `DID_AGENT_ID` / `DID_CLIENT_KEY` missing in `.env.local` — run `npm run setup:agent`. |
| Avatar loads but won't connect in prod | Add your domain to the client key's allowed domains in D-ID Studio. |
| `npm run setup:agent` 401/403 | Bad `DID_API_KEY`, or your plan lacks the ElevenLabs integration. |
| She never reacts to objects | Confirm camera permission granted and the self-view (bottom-right) shows video; check `vision:{enabled:true}` on the agent. |
| She talks but it's the wrong voice/persona | You edited the persona in `prompts.ts` but not in the ElevenLabs dashboard — the dashboard is the source of truth at runtime. |
| Robotic / high latency | Use a low-latency ElevenLabs model (`eleven_turbo_v2_5`); test on a solid network; the "channeling" ritual is designed to mask brief delays. |
| Prophecy card has no object names | That's the optional Gemini enrichment — add `GEMINI_API_KEY`, or ignore (the prophecy text still renders). |
| Echo / feedback | Use headphones, or rely on the mic's echo cancellation (already enabled). |
