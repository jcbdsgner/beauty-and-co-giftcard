import type { Metadata } from "next";
import { Prata } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";
import { ScreenTransition } from "@/components/ui/screen-transition";
import { WatercolorBackgroundClient } from "@/components/canvas/watercolor-background-client";
import { DebugErrorOverlay } from "@/components/ui/debug-error-overlay";

const cabinetGrotesk = localFont({
  src: "./fonts/CabinetGrotesk-Variable.woff2",
  variable: "--font-cabinet-grotesk",
  weight: "100 900",
});

const prata = Prata({
  variable: "--font-prata",
  weight: "400",
  subsets: ["latin"],
});

const benedict = localFont({
  src: "./fonts/Benedict-Regular.otf",
  variable: "--font-benedict",
});

export const metadata: Metadata = {
  title: "Carte cadeau — B&Co",
  description: "Offrez un moment B&Co.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fr"
      className={`${cabinetGrotesk.variable} ${prata.variable} ${benedict.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        <DebugErrorOverlay />
        <WatercolorBackgroundClient />
        <ScreenTransition>{children}</ScreenTransition>
      </body>
    </html>
  );
}
