# Configuring Madame Esmé Voss in ElevenLabs

SÉANCE's brain is an **ElevenLabs Agent**. Create it once in the ElevenLabs
dashboard, then bind it to a D-ID avatar with `npm run setup:agent`.

> The canonical persona text also lives in [`src/lib/prompts.ts`](../src/lib/prompts.ts)
> (`ESME_SYSTEM_PROMPT`, `ESME_FIRST_MESSAGE`) so it's versioned with the app.
> If you edit one, edit both.

---

## 1. Create the agent

ElevenLabs dashboard → **Agents** → **Create agent** (blank template).

Copy its **Agent ID** (`agent_…`) into `.env.local` as `ELEVENLABS_AGENT_ID`.

## 2. System prompt

Paste the full `ESME_SYSTEM_PROMPT` from `src/lib/prompts.ts` into the agent's
**System prompt** field. It defines her persona, the game loop, how she uses the
visual context D-ID feeds her, the final-prophecy beat, and the "playful, never
cruel" safety boundary.

## 3. First message

Set the agent's **First message** to `ESME_FIRST_MESSAGE`:

> "Mmm… the glass grows warm. A living soul sits before me. Come — hold something to the light, child, and let me read what the spirits have left upon it."

## 4. Voice (this is where the magic lives)

Pick a voice with **character and range**, then dial up expressiveness:

- Choose a deeper, theatrical, slightly aged feminine voice (browse the Voice
  Library for "narration"/"characterful"; or clone a theatrical read with consent).
- **Stability: low (~0.30–0.40)** — lower stability = more emotional variance,
  which is exactly what sells the gasps and cackles.
- **Similarity: ~0.75.**
- **Style/exaggeration: moderate–high** if your chosen voice exposes it.
- **Model: `eleven_turbo_v2_5`** (or the current low-latency conversational
  model) — latency matters for the live feel; D-ID recommends ElevenLabs for V4.

## 5. LLM

Any strong conversational model the agent offers is fine. Esmé's lines are short
and characterful; favor one that follows the persona instructions faithfully and
responds quickly. Keep the temperature moderate so she stays witty but on-task.

## 6. Turn-taking & interruption

- Enable **interruptions / barge-in** so the user can cut in ("No! That's wrong!")
  — D-ID forwards mic audio to ElevenLabs, and ElevenLabs' turn-taking handles it.
- Keep responses short (the system prompt already instructs 1–3 sentence turns);
  if your dashboard exposes a max-tokens / response-length control, keep it tight.

## 7. (If you use ElevenLabs overrides)

This app does **not** rely on client-side prompt/voice overrides — everything is
configured here in the dashboard. So you do **not** need to enable overrides in
the agent's security settings. (If you later inject dynamic variables, enable the
matching override fields there, or they'll be ignored.)

---

## Sanity check

Use the dashboard's **"Test agent"** chat/voice widget and confirm Esmé:

1. Opens in character with the first message.
2. Stays theatrical and short-winded.
3. Refuses to be cruel or to make real medical/financial/death predictions,
   deflecting with melodrama instead.

Once she behaves there, run `npm run setup:agent` to give her a face.
