import type { Metadata } from "next";
import { Playfair_Display, Inter } from "next/font/google";
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
    icon: "/logo-pmk.avif",
    shortcut: "/logo-pmk.avif",
    apple: "/logo-pmk.avif",
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
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
