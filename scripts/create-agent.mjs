#!/usr/bin/env node
/**
 * One-shot setup: create the D-ID agent bound to your ElevenLabs Agent
 * (D-ID's native ElevenLabs integration, with built-in vision enabled).
 *
 *   1. POST /secrets                         → store your ElevenLabs key, get secret_id
 *   2. POST /v2/agents/integrations/elevenlabs → create the avatar agent
 *   3. GET  /agents/{id}                      → poll until ready
 *   4. print DID_AGENT_ID + DID_CLIENT_KEY    → paste into .env.local
 *
 * Run:  npm run setup:agent
 *
 * Requires in .env.local (or the environment):
 *   DID_API_KEY, ELEVENLABS_API_KEY, ELEVENLABS_AGENT_ID
 * Optional:
 *   DID_PRESENTER_ID (defaults to a public expressive presenter)
 *
 * NOTE: D-ID's docs and OpenAPI schema disagree slightly on the /secrets body
 * for ElevenLabs, so this script tries a couple of shapes and uses whichever the
 * live API accepts. The native ElevenLabs integration requires a paid D-ID plan.
 */

import { readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const DID = "https://api.d-id.com";

// ── load .env.local (no dependency) ──────────────────────────────────────────
loadEnv(resolve(ROOT, ".env.local"));
loadEnv(resolve(ROOT, ".env"));

const DID_API_KEY = need("DID_API_KEY");
const ELEVENLABS_API_KEY = need("ELEVENLABS_API_KEY");
const ELEVENLABS_AGENT_ID = need("ELEVENLABS_AGENT_ID");
const PRESENTER_ID = process.env.DID_PRESENTER_ID || "public_mia_elegant@avt_TJ0Tq5";

const authHeaders = {
  Authorization: `Basic ${DID_API_KEY}`,
  "Content-Type": "application/json",
};

main().catch((e) => {
  console.error("\n✘ Setup failed:", e.message || e);
  process.exit(1);
});

async function main() {
  console.log("🔮 Summoning the medium…\n");

  // 1) Store the ElevenLabs key in D-ID's secret vault.
  const secretId = await createSecret();
  console.log(`✓ ElevenLabs key stored as secret: ${secretId}`);

  // 2) Create the avatar agent bound to the ElevenLabs agent, vision on.
  const body = {
    preview_name: "Madame Esmé Voss",
    presenter: { type: "expressive", presenter_id: PRESENTER_ID },
    external_agent: {
      type: "elevenlabs",
      agent_id: ELEVENLABS_AGENT_ID,
      secret_id: secretId,
    },
    vision: { enabled: true },
  };
  const agent = await postJson(`${DID}/v2/agents/integrations/elevenlabs`, body);
  const agentId = agent.id;
  const clientKey = agent.client_key || agent.clientKey;
  if (!agentId || !clientKey) {
    throw new Error(
      `Agent created but response missing id/client_key. Raw: ${JSON.stringify(agent).slice(0, 400)}`,
    );
  }
  console.log(`✓ Agent created: ${agentId}`);

  // 3) Poll for readiness (the idle video must render). Tolerate absent status.
  await waitReady(agentId);
  console.log("✓ The medium has manifested.\n");

  // 4) Persist + print.
  const out = { DID_AGENT_ID: agentId, DID_CLIENT_KEY: clientKey };
  writeFileSync(resolve(ROOT, ".seance-agent.json"), JSON.stringify(out, null, 2));

  console.log("─".repeat(64));
  console.log("Add these to your .env.local:\n");
  console.log(`DID_AGENT_ID=${agentId}`);
  console.log(`DID_CLIENT_KEY=${clientKey}`);
  console.log("─".repeat(64));
  console.log("\n(Also saved to .seance-agent.json — gitignored.)");
  console.log("\nNext:  npm run dev   →   http://localhost:3000");
  console.log(
    "\nBefore deploying, add your production domain to the client key's allowed",
    "domains in D-ID Studio (Agents → Embed) so the SDK is authorized there.",
  );
}

// ── steps ────────────────────────────────────────────────────────────────────

async function createSecret() {
  // Try the OpenAPI-schema shape first, then the quickstart-prose shape.
  const variants = [
    {
      type: "api_key",
      provider: "elevenlabs-key",
      api_key: ELEVENLABS_API_KEY,
      header_name: "xi-api-key",
    },
    { type: "api_key", provider: "elevenlabs", api_key: ELEVENLABS_API_KEY },
  ];
  let lastErr;
  for (const v of variants) {
    try {
      const res = await postJson(`${DID}/secrets`, v);
      const id = res.id || res.secret_id;
      if (id) return id;
      lastErr = new Error(`No id in /secrets response: ${JSON.stringify(res).slice(0, 300)}`);
    } catch (e) {
      lastErr = e;
    }
  }
  throw new Error(
    `Could not store ElevenLabs secret. Last error: ${lastErr?.message || lastErr}. ` +
      `Check your DID_API_KEY and that your D-ID plan supports the ElevenLabs integration.`,
  );
}

async function waitReady(agentId, attempts = 40, delayMs = 3000) {
  for (let i = 0; i < attempts; i++) {
    const a = await getJson(`${DID}/agents/${agentId}`);
    const status = a.status;
    if (!status || status === "done") return a;
    if (status === "error" || status === "failed") {
      throw new Error(`Agent entered status "${status}".`);
    }
    process.stdout.write(`  …manifesting (${status})\r`);
    await sleep(delayMs);
  }
  console.warn("\n  (Timed out waiting for status:done — it may still be usable.)");
}

// ── http helpers ─────────────────────────────────────────────────────────────

async function postJson(url, body) {
  const res = await fetch(url, {
    method: "POST",
    headers: authHeaders,
    body: JSON.stringify(body),
  });
  return parse(res, url);
}

async function getJson(url) {
  const res = await fetch(url, { headers: authHeaders });
  return parse(res, url);
}

async function parse(res, url) {
  const text = await res.text();
  let json;
  try {
    json = text ? JSON.parse(text) : {};
  } catch {
    json = { raw: text };
  }
  if (!res.ok) {
    const detail = json?.description || json?.message || json?.raw || text;
    throw new Error(`${res.status} ${res.statusText} from ${url}: ${String(detail).slice(0, 300)}`);
  }
  return json;
}

// ── misc ─────────────────────────────────────────────────────────────────────

function need(name) {
  const v = process.env[name];
  if (!v) {
    console.error(`✘ Missing required env var: ${name}`);
    console.error("  Fill in .env.local (copy from .env.example) and try again.");
    process.exit(1);
  }
  return v;
}

function loadEnv(path) {
  let raw;
  try {
    raw = readFileSync(path, "utf8");
  } catch {
    return; // file optional
  }
  for (const line of raw.split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (!m) continue;
    const key = m[1];
    let val = m[2];
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (process.env[key] === undefined) process.env[key] = val;
  }
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
