import type { Metadata, Viewport } from "next";
import { Instrument_Serif } from "next/font/google";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { Toaster } from "sonner";
import { cn } from "@/lib/utils";
import "./globals.css";

const fontDisplay = Instrument_Serif({
  subsets: ["latin"],
  weight: ["400"],
  style: ["normal", "italic"],
  variable: "--font-display",
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
        GeistSans.variable,
        GeistMono.variable,
      )}
    >
      <body className="font-body antialiased bg-ivory text-ink selection:bg-emerald/20 selection:text-emerald-deep">
        {children}
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
