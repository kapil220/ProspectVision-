import type { Metadata, Viewport } from "next";
import { Fraunces, Inter_Tight, JetBrains_Mono } from "next/font/google";
import { Toaster } from "sonner";
import { cn } from "@/lib/utils";
import "./globals.css";

// Fraunces — editorial display serif (variable, supports italics).
const fontDisplay = Fraunces({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-display",
  display: "swap",
});

// Inter Tight — UI sans, slightly condensed for density.
const fontBody = Inter_Tight({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-body",
  display: "swap",
});

// JetBrains Mono — numbers and structured data.
const fontMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "ProspectVision — See the home before you knock",
  description:
    "AI-powered property prospecting for home service contractors. Scan satellite imagery, render proposals, mail postcards, close deals.",
};

export const viewport: Viewport = {
  themeColor: "#0F5132",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={cn(
        fontDisplay.variable,
        fontBody.variable,
        fontMono.variable,
      )}
    >
      <body className="font-body antialiased bg-ivory text-ink selection:bg-emerald/20 selection:text-emerald-deep">
        {children}
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
