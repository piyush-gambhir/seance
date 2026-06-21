import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Victorian séance palette
        ink: "#0a0710",
        velvet: "#160d20",
        plum: "#2a1538",
        candle: "#f5c97b",
        ember: "#e8954a",
        gild: "#c9a86a",
        bone: "#efe6d4",
        blood: "#7a1f2b",
        spirit: "#9fd8d2",
      },
      fontFamily: {
        display: ["var(--font-display)", "Cinzel", "Georgia", "serif"],
        body: ["var(--font-body)", "Georgia", "serif"],
      },
      boxShadow: {
        candle: "0 0 60px 10px rgba(245, 201, 123, 0.25)",
        frame: "0 0 0 2px rgba(201,168,106,0.6), 0 0 40px rgba(0,0,0,0.8) inset",
      },
      keyframes: {
        flicker: {
          "0%, 100%": { opacity: "1" },
          "45%": { opacity: "0.78" },
          "55%": { opacity: "0.92" },
          "70%": { opacity: "0.7" },
        },
        breathe: {
          "0%, 100%": { transform: "scale(1)", opacity: "0.5" },
          "50%": { transform: "scale(1.06)", opacity: "0.85" },
        },
        rise: {
          "0%": { transform: "translateY(8px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        smoke: {
          "0%": { transform: "translateY(0) scale(1)", opacity: "0" },
          "30%": { opacity: "0.5" },
          "100%": { transform: "translateY(-120px) scale(1.6)", opacity: "0" },
        },
      },
      animation: {
        flicker: "flicker 2.6s ease-in-out infinite",
        breathe: "breathe 4s ease-in-out infinite",
        rise: "rise 0.6s ease-out both",
        smoke: "smoke 3.5s ease-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
