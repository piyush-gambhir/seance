"use client";

import { useCallback, useRef } from "react";
import type { ProphecyCard as ProphecyData } from "@/lib/types";

interface Props {
  data: ProphecyData;
  onAgain: () => void;
}

/**
 * The shareable artifact: the medium's final prophecy on a parchment card,
 * downloadable as a PNG (a second surface beyond the video clip).
 */
export default function ProphecyCard({ data, onAgain }: Props) {
  const cardRef = useRef<HTMLDivElement | null>(null);

  const download = useCallback(() => {
    const W = 1080;
    const Hc = 1350;
    const canvas = document.createElement("canvas");
    canvas.width = W;
    canvas.height = Hc;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // parchment
    const g = ctx.createRadialGradient(W * 0.35, Hc * 0.1, 80, W * 0.5, Hc * 0.5, Hc);
    g.addColorStop(0, "#f5ead0");
    g.addColorStop(0.6, "#e7d3a6");
    g.addColorStop(1, "#cdae78");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, Hc);

    // border
    ctx.strokeStyle = "rgba(90,60,20,0.55)";
    ctx.lineWidth = 6;
    ctx.strokeRect(40, 40, W - 80, Hc - 80);
    ctx.lineWidth = 2;
    ctx.strokeRect(60, 60, W - 120, Hc - 120);

    ctx.fillStyle = "#3a2a14";
    ctx.textAlign = "center";

    ctx.font = "700 38px Cinzel, Georgia, serif";
    ctx.fillText("· A   P R O P H E C Y ·", W / 2, 180);

    ctx.font = "italic 28px Cormorant Garamond, Georgia, serif";
    ctx.fillStyle = "#6a4a1e";
    ctx.fillText("as channeled through the haunted glass", W / 2, 230);

    // prophecy body, wrapped
    ctx.fillStyle = "#2a1d0c";
    ctx.font = "500 46px Cormorant Garamond, Georgia, serif";
    wrapText(ctx, `“${data.prophecy}”`, W / 2, 420, W - 220, 60);

    // objects
    if (data.objects.length) {
      ctx.font = "italic 26px Cormorant Garamond, Georgia, serif";
      ctx.fillStyle = "#6a4a1e";
      wrapText(
        ctx,
        `Omens read: ${data.objects.join(" · ")}`,
        W / 2,
        Hc - 320,
        W - 220,
        38,
      );
    }

    // sigil
    ctx.font = "700 30px Cinzel, Georgia, serif";
    ctx.fillStyle = "#7a1f2b";
    ctx.fillText(data.sigil.toUpperCase(), W / 2, Hc - 200);

    // footer
    ctx.font = "600 22px Cinzel, Georgia, serif";
    ctx.fillStyle = "#3a2a14";
    ctx.fillText("S É A N C E", W / 2, Hc - 130);
    ctx.font = "20px Cormorant Garamond, Georgia, serif";
    ctx.fillStyle = "#6a4a1e";
    ctx.fillText("a medium of D-ID + ElevenLabs", W / 2, Hc - 100);

    const url = canvas.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = url;
    a.download = "my-prophecy.png";
    a.click();
  }, [data]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/80 p-4 backdrop-blur-sm">
      <div className="flex max-h-full w-full max-w-md flex-col items-center gap-5 overflow-auto">
        <div
          ref={cardRef}
          className="parchment animate-rise w-full rounded-md border-2 border-[#5a3c14]/50 p-8 text-center"
        >
          <p className="display text-sm tracking-[0.3em] text-[#7a1f2b]">· A PROPHECY ·</p>
          <p className="mt-1 text-xs italic text-[#6a4a1e]">
            as channeled through the haunted glass
          </p>
          <p className="my-6 text-2xl leading-snug text-[#2a1d0c]">
            “{data.prophecy}”
          </p>
          {data.objects.length > 0 && (
            <p className="text-sm italic text-[#6a4a1e]">
              Omens read: {data.objects.join(" · ")}
            </p>
          )}
          <p className="mt-5 display text-base tracking-[0.2em] text-[#7a1f2b]">
            {data.sigil}
          </p>
          <p className="mt-6 display text-xs tracking-[0.3em] text-[#3a2a14]">
            SÉANCE · D-ID + ELEVENLABS
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3">
          <button className="btn-arcane" onClick={download}>
            Download my prophecy
          </button>
          <button className="btn-ghost" onClick={onAgain}>
            Summon her again
          </button>
        </div>
      </div>
    </div>
  );
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
) {
  const words = text.split(" ");
  let line = "";
  let cy = y;
  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    if (ctx.measureText(test).width > maxWidth && line) {
      ctx.fillText(line, x, cy);
      line = w;
      cy += lineHeight;
    } else {
      line = test;
    }
  }
  if (line) ctx.fillText(line, x, cy);
}
