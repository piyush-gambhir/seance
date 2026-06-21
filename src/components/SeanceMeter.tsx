"use client";

import { OBJECTS_TO_PROPHECY } from "@/lib/useSeance";

interface Props {
  presented: number;
}

/** A row of candles that light as objects are read; full = prophecy unlocked. */
export default function SeanceMeter({ presented }: Props) {
  const lit = Math.min(presented, OBJECTS_TO_PROPHECY);
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="flex items-end gap-4">
        {Array.from({ length: OBJECTS_TO_PROPHECY }).map((_, i) => {
          const isLit = i < lit;
          return (
            <div key={i} className="flex flex-col items-center">
              <div
                className={`flame mb-1 transition-opacity duration-500 ${
                  isLit ? "animate-flicker opacity-100" : "opacity-0"
                }`}
              />
              <div
                className={`h-10 w-2 rounded-sm transition-colors duration-500 ${
                  isLit
                    ? "bg-gradient-to-b from-bone to-gild"
                    : "bg-gradient-to-b from-plum to-velvet"
                }`}
              />
            </div>
          );
        })}
      </div>
      <p className="display text-[0.62rem] tracking-[0.3em] text-gild/70">
        {lit >= OBJECTS_TO_PROPHECY
          ? "THE OMENS ARE GATHERED"
          : `${lit} / ${OBJECTS_TO_PROPHECY} OMENS READ`}
      </p>
    </div>
  );
}
