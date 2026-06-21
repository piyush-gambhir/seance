import { NextRequest, NextResponse } from "next/server";
import { VISION_PROMPT } from "@/lib/prompts";
import type { ObjectVerdict } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * OPTIONAL structured object inspector.
 *
 * Esmé's real "sight" comes from D-ID's built-in vision (it samples the camera
 * track we publish and feeds visual context into the ElevenLabs conversation).
 * This endpoint is a separate, best-effort enrichment that returns a STRUCTURED
 * read of the held-up object so we can label the prophecy share-card. The app
 * works without it: if GEMINI_API_KEY is unset, this returns 501 and the client
 * silently skips it.
 *
 * The provider lives in one function (`analyze`) so you can swap Gemini for
 * OpenAI/Anthropic by editing only that block.
 */
export async function POST(req: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Vision enrichment disabled (no GEMINI_API_KEY)." },
      { status: 501 },
    );
  }

  let image: string | undefined;
  try {
    ({ image } = (await req.json()) as { image?: string });
  } catch {
    return NextResponse.json({ error: "Bad JSON." }, { status: 400 });
  }
  if (!image) {
    return NextResponse.json({ error: "Missing 'image'." }, { status: 400 });
  }
  const base64 = image.includes(",") ? image.split(",")[1] : image;

  try {
    const verdict = await analyze(base64, apiKey);
    return NextResponse.json(verdict, { headers: { "Cache-Control": "no-store" } });
  } catch (err: unknown) {
    const e = err as { status?: number; message?: string };
    const status = e?.status === 429 ? 429 : 500;
    return NextResponse.json(
      { error: "Vision read failed", detail: String(e?.message ?? err) },
      { status },
    );
  }
}

// ── Provider: Google Gemini (free tier; schema-enforced JSON). ───────────────
async function analyze(base64Jpeg: string, apiKey: string): Promise<ObjectVerdict> {
  const { GoogleGenAI, Type } = await import("@google/genai");
  const ai = new GoogleGenAI({ apiKey });

  const response = await ai.models.generateContent({
    model: process.env.GEMINI_MODEL || "gemini-3.5-flash",
    contents: [
      { inlineData: { mimeType: "image/jpeg", data: base64Jpeg } },
      { text: VISION_PROMPT },
    ],
    config: {
      temperature: 0.2,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          object_noun: { type: Type.STRING },
          specific_visible_attributes: { type: Type.ARRAY, items: { type: Type.STRING } },
          confidence: { type: Type.NUMBER },
        },
        required: ["object_noun", "specific_visible_attributes", "confidence"],
      },
    },
  });

  const parsed = JSON.parse(response.text ?? "{}") as Partial<ObjectVerdict>;
  return {
    object_noun: parsed.object_noun ?? "",
    specific_visible_attributes: parsed.specific_visible_attributes ?? [],
    confidence: typeof parsed.confidence === "number" ? parsed.confidence : 0,
  };
}
