import type { Metadata } from "next";
import { Comfortaa, JetBrains_Mono, Noto_Sans_TC } from "next/font/google";
import "./globals.css";

// Display / wordmark - Comfortaa (geometric, rounded, sacred-orrery feel)
const comfortaa = Comfortaa({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-comfortaa",
  display: "swap",
});

// Mono / HUD / section tags / dashboard numerics - JetBrains Mono
const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono",
  display: "swap",
});

// Body - Noto Sans TC (Traditional Chinese + latin coverage)
// NOTE: brief asked for IBM Plex Sans TC, but next/font/google only ships
// IBM_Plex_Sans_{JP,KR} (no TC). Noto Sans TC is the closest zh-Hant match.
const notoTC = Noto_Sans_TC({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "ekkoee // we don't sell ERP, we grow Mini-AGIs",
  description:
    "One AI nervous system per factory - grown in place, learning from your floor, yours forever.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="zh-Hant"
      className={[
        comfortaa.variable,
        jetbrains.variable,
        notoTC.variable,
      ].join(" ")}
    >
      <body>{children}</body>
    </html>
  );
}
