import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "WinMahjong — Pencatat Skor Mahjong Hong Kong untuk Venue", template: "%s · WinMahjong" },
  description:
    "Hitung faan otomatis, leaderboard di TV, liga mingguan & bulanan, data member rapi, dan story Instagram berlogo venue. Tanpa install, cukup scan & main.",
};

export const viewport: Viewport = {
  themeColor: "#0b3f28",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="id">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Fraunces:opsz,wght@9..144,500;9..144,600;9..144,700&family=Inter:wght@400;500;600;700;800&family=Lora:wght@500;600;700&family=Noto+Serif+TC:wght@600;700;900&family=Playfair+Display:wght@500;600;700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Poppins:wght@400;500;600;700;800&family=Source+Sans+3:wght@400;600;700&display=swap"
        />
      </head>
      <body className="min-h-dvh antialiased">{children}</body>
    </html>
  );
}
