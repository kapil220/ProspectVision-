import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    container: {
      center: true,
      padding: { DEFAULT: "1.5rem", lg: "2.5rem" },
      screens: { "2xl": "1440px" },
    },
    extend: {
      colors: {
        // shadcn aliases (HSL via CSS vars)
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: { DEFAULT: "hsl(var(--primary))", foreground: "hsl(var(--primary-foreground))" },
        secondary: { DEFAULT: "hsl(var(--secondary))", foreground: "hsl(var(--secondary-foreground))" },
        destructive: { DEFAULT: "hsl(var(--destructive))", foreground: "hsl(var(--destructive-foreground))" },
        muted: { DEFAULT: "hsl(var(--muted))", foreground: "hsl(var(--muted-foreground))" },
        accent: { DEFAULT: "hsl(var(--accent))", foreground: "hsl(var(--accent-foreground))" },
        popover: { DEFAULT: "hsl(var(--popover))", foreground: "hsl(var(--popover-foreground))" },
        card: { DEFAULT: "hsl(var(--card))", foreground: "hsl(var(--card-foreground))" },

        // Brand tokens — direct, semantic
        ivory: { DEFAULT: "hsl(var(--ivory))", 50: "hsl(var(--ivory-50))" },
        paper: "hsl(var(--paper))",
        ink: { DEFAULT: "hsl(var(--ink))", 2: "hsl(var(--ink-2))", soft: "hsl(var(--ink-soft))", muted: "hsl(var(--ink-muted))" },
        line: "hsl(var(--line))",
        emerald: { DEFAULT: "hsl(var(--emerald))", deep: "hsl(var(--emerald))", soft: "hsl(var(--emerald-soft))" },
        ochre: { DEFAULT: "hsl(var(--ochre))", soft: "hsl(var(--ochre-soft))" },
        crimson: "hsl(var(--crimson))",

        // Legacy aliases — keep until everything migrates
        brand: { DEFAULT: "hsl(var(--emerald))", dark: "hsl(var(--emerald))", light: "hsl(var(--ochre-soft))" },
        sidebar: "hsl(var(--ink))",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      fontFamily: {
        display: ["var(--font-display)", "Georgia", "serif"],
        body: ["var(--font-body)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      fontSize: {
        "display-xl": ["clamp(3.25rem, 7vw, 6.5rem)", { lineHeight: "1.02", letterSpacing: "-0.025em" }],
        "display-lg": ["clamp(2.5rem, 5vw, 4.5rem)", { lineHeight: "1.05", letterSpacing: "-0.022em" }],
        "display-md": ["clamp(2rem, 3.5vw, 3rem)", { lineHeight: "1.1", letterSpacing: "-0.018em" }],
      },
      boxShadow: {
        card: "0 1px 0 hsl(var(--ink) / 0.04), 0 1px 2px hsl(var(--ink) / 0.04), 0 8px 24px -8px hsl(var(--ink) / 0.08)",
        hover: "0 12px 32px -10px hsl(var(--ink) / 0.18)",
        glow: "0 0 0 4px hsl(var(--emerald) / 0.12)",
        editorial: "0 30px 60px -20px hsl(var(--ink) / 0.25)",
      },
      keyframes: {
        "accordion-down": { from: { height: "0" }, to: { height: "var(--radix-accordion-content-height)" } },
        "accordion-up": { from: { height: "var(--radix-accordion-content-height)" }, to: { height: "0" } },
        fadeIn: { from: { opacity: "0" }, to: { opacity: "1" } },
        slideUp: { from: { opacity: "0", transform: "translateY(12px)" }, to: { opacity: "1", transform: "translateY(0)" } },
        marquee: { from: { transform: "translateX(0)" }, to: { transform: "translateX(-50%)" } },
        shimmer: { from: { backgroundPosition: "-200% 0" }, to: { backgroundPosition: "200% 0" } },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fadeIn 0.4s ease forwards",
        "slide-up": "slideUp 0.6s cubic-bezier(0.21, 0.61, 0.35, 1) forwards",
        marquee: "marquee 40s linear infinite",
        shimmer: "shimmer 2.4s linear infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
