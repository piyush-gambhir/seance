import type { Metadata, Viewport } from "next";
import { Cinzel, Cormorant_Garamond } from "next/font/google";
import "./globals.css";

const display = Cinzel({
  subsets: ["latin"],
  weight: ["400", "600", "700", "900"],
  variable: "--font-display",
  display: "swap",
});

const body = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-body",
  display: "swap",
});

export const metadata: Metadata = {
  title: "SÉANCE — The Haunted Object Reader",
  description:
    "Hold up any object. A 145-year-old ghost medium channels its spirit story — and reacts to your face, live. Powered by D-ID avatars + ElevenLabs Agents.",
  openGraph: {
    title: "SÉANCE — The Haunted Object Reader",
    description:
      "Hold up any object. A Victorian ghost medium reads its spirit story — and reacts to your face, live.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#0a0710",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable}`}>
      <body>{children}</body>
    </html>
  );
}
