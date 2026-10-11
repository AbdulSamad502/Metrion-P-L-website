import type { Metadata, Viewport } from "next";
import { Inter, Michroma } from "next/font/google";
import { SITE } from "@/lib/site";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const michroma = Michroma({ subsets: ["latin"], weight: "400", variable: "--font-michroma", display: "swap" });

export const metadata: Metadata = { metadataBase: new URL(SITE.origin) };

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#ffffff",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-IN" className={`${inter.variable} ${michroma.variable}`}>
      <body className="min-h-screen bg-white text-ink antialiased">{children}</body>
    </html>
  );
}
