import type { Metadata } from "next";
import { Playfair_Display, Inter } from "next/font/google";
import { Suspense } from "react";
import { NavigationProgress } from "@/components/common/NavigationProgress";
import "./globals.css";

const playfair = Playfair_Display({
  variable: "--font-serif",
  subsets: ["latin"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "PMK ARK — Arsip & Pengetahuan Pelayanan PMK ITERA",
    template: "%s | PMK ARK",
  },
  description:
    "Repositori dokumen pelayanan mingguan PMK ITERA: PPT Ibadah Jum'at, Warta Mingguan, dan PPT Khotbah.",
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/icon.png", type: "image/png" },
      { url: "/logo-pmk.png", type: "image/png" },
      { url: "/logo-pmk.avif", type: "image/avif" },
    ],
    shortcut: "/favicon.ico",
    apple: "/icon.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="id"
      className={`${playfair.variable} ${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Suspense fallback={null}>
          <NavigationProgress />
        </Suspense>
        {children}
      </body>
    </html>
  );
}
