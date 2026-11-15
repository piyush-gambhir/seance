import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";









export async function GET() {
  const agentId = process.env.DID_AGENT_ID;
  const clientKey = process.env.DID_CLIENT_KEY;

  if (!agentId || !clientKey) {
    return NextResponse.json(
      {
        error:
          "D-ID agent not configured. Run `npm run setup:agent` and add DID_AGENT_ID + DID_CLIENT_KEY to .env.local.",
      },
      { status: 503 },
    );
  }

  return NextResponse.json(
    { agentId, clientKey },
    { headers: { "Cache-Control": "no-store" } },
  );
}
