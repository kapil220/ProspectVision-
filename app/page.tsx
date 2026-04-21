"use client";

import { useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { CheckCircle, ChevronDown, MapPin, Palette, Send, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { NICHES, LAUNCH_NICHES } from "@/lib/niches";

const ReactCompareImage = dynamic(() => import("react-compare-image"), {
  ssr: false,
  loading: () => <div className="aspect-video w-full animate-pulse bg-slate-100" />,
});

const PACKS = [
  { id: "starter", name: "Starter", credits: 100, priceUsd: 399, perPostcard: "3.99", popular: false },
  { id: "growth", name: "Growth", credits: 500, priceUsd: 1749, perPostcard: "3.50", popular: true },
  { id: "scale", name: "Scale", credits: 1000, priceUsd: 2999, perPostcard: "3.00", popular: false },
];

const FEATURES = [
  "AI satellite property scanning",
  "Photorealistic AI renders",
  "Personalized homeowner landing page",
  "Built-in CRM tracking",
  "Credits never expire",
];

const STEPS = [
  {
    icon: MapPin,
    title: "Pick your niche + ZIP codes",
    desc: "Choose from 9 home service niches. Target specific ZIP codes where you want to work.",
  },
  {
    icon: Sparkles,
    title: "AI scans + scores every property",
    desc: "GPT-4 Vision analyzes satellite and street-view imagery to find homes that actually need your service.",
  },
  {
    icon: Palette,
    title: "DALL-E renders the upgrade",
    desc: "Photorealistic AI-generated images show homeowners exactly what their property could look like.",
  },
  {
    icon: Send,
    title: "Postcards arrive in 3–5 days",
    desc: "We print and mail through Lob. Every postcard links to a personalized landing page with a quote button.",
  },
];

const FAQS = [
  {
    q: "How is this different from other direct-mail services?",
    a: "Most platforms just print what you upload. ProspectVision uses AI to find the right properties AND show each homeowner exactly what their home could look like — dramatically higher response rates.",
  },
  {
    q: "What if a ZIP has thousands of homes?",
    a: "You pick the ZIPs. Our AI scores every single-family home, and you only pay for postcards mailed — typically 50-150 per ZIP after scoring.",
  },
  {
    q: "How accurate are the AI renders?",
    a: "Renders are illustrative, not architectural. Landing pages clearly disclose that they are AI-generated for illustration only.",
  },
  {
    q: "Is my return address printed on the postcard?",
    a: "Yes — Lob is USPS-compliant. You provide a valid business return address during onboarding.",
  },
  {
    q: "Do unused credits expire?",
    a: "Never. Credits are good for life, and unused credits are refundable within 30 days.",
  },
  {
    q: "Can homeowners opt out?",
    a: "Every postcard includes an opt-out QR code that permanently suppresses the address across all contractors using the platform.",
  },
  {
    q: "Which niches work best?",
    a: "Landscaping, roofing, and solar have the highest response rates at launch. All 9 niches use tailored AI prompts and copy.",
  },
  {
    q: "How do you track response rates?",
    a: "Every postcard links to a unique QR code and landing page. Built-in CRM advances leads from mailed → delivered → viewed → responded → won.",
  },
];

const LAUNCH_NICHE_CONFIGS = NICHES.filter((n) => LAUNCH_NICHES.includes(n.id));
const OTHER_NICHE_CONFIGS = NICHES.filter((n) => !LAUNCH_NICHES.includes(n.id));

export default function MarketingHome() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  return (
    <div className="min-h-screen bg-white font-body text-slate-900">
      <nav className="sticky top-0 z-40 border-b border-slate-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand text-sm font-bold text-white">
              PV
            </div>
            <span className="font-display text-base font-semibold">ProspectVision</span>
          </Link>
          <div className="hidden items-center gap-8 text-sm font-medium text-slate-600 md:flex">
            <a href="#how" className="hover:text-slate-900">How it works</a>
            <a href="#pricing" className="hover:text-slate-900">Pricing</a>
            <a href="#niches" className="hover:text-slate-900">Niches</a>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="hidden rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 sm:inline-block"
            >
              Sign in
            </Link>
            <Link
              href="/signup"
              className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark"
            >
              Start free
            </Link>
          </div>
        </div>
      </nav>

      <section className="mx-auto max-w-4xl px-6 py-24 text-center">
        <span className="inline-flex items-center gap-2 rounded-full bg-brand-light px-4 py-1.5 text-sm font-medium text-brand">
          <Sparkles className="h-3.5 w-3.5" /> AI + Direct Mail → Local Leads
        </span>
        <h1 className="mt-6 font-display text-5xl font-bold leading-tight text-slate-900 md:text-6xl">
          Turn any property into a customer
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-xl text-slate-500">
          AI scans satellite imagery to find homeowners who need your service, generates a
          personalized AI render of their home, and mails it automatically.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/signup"
            className="inline-flex h-12 items-center justify-center rounded-xl bg-brand px-6 text-sm font-semibold text-white shadow-card hover:bg-brand-dark"
          >
            Start free — 10 postcards included
          </Link>
          <a
            href="#how"
            className="inline-flex h-12 items-center justify-center rounded-xl border border-slate-300 px-6 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            See how it works
          </a>
        </div>

        <div className="mx-auto mt-16 max-w-3xl overflow-hidden rounded-3xl shadow-2xl">
          <div className="aspect-video">
            <ReactCompareImage
              leftImage="https://picsum.photos/seed/pv-before/1200/675"
              leftImageLabel="Before"
              rightImage="https://picsum.photos/seed/pv-after/1200/675"
              rightImageLabel="After ✨ AI Render"
              sliderLineColor="#4F46E5"
              sliderPositionPercentage={0.5}
            />
          </div>
        </div>
        <p className="mt-4 text-sm text-slate-400">
          Real AI renders generated from satellite imagery
        </p>
      </section>

      <section id="how" className="bg-slate-50 py-24">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="text-center font-display text-4xl font-bold">How it works</h2>
          <p className="mx-auto mt-3 max-w-xl text-center text-slate-500">
            From ZIP code to signed customer — fully automated.
          </p>
          <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((s, i) => (
              <div key={s.title} className="rounded-2xl border border-slate-200 bg-white p-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-light text-brand">
                    <s.icon className="h-5 w-5" />
                  </div>
                  <span className="font-mono text-xs font-semibold text-slate-400">
                    STEP {i + 1}
                  </span>
                </div>
                <h3 className="mt-4 font-display text-lg font-semibold text-slate-900">
                  {s.title}
                </h3>
                <p className="mt-2 text-sm text-slate-500">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="niches" className="py-20">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="text-center font-display text-4xl font-bold">
            Works for 9 home service niches
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-center text-slate-500">
            Each niche has tailored AI prompts, copy, and render styles.
          </p>
          <div className="mt-12 grid grid-cols-2 gap-4 md:grid-cols-3">
            {[...LAUNCH_NICHE_CONFIGS, ...OTHER_NICHE_CONFIGS].map((n) => (
              <div
                key={n.id}
                className="flex flex-col rounded-2xl border border-slate-200 bg-white p-5 transition-shadow hover:shadow-card"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-xl text-2xl"
                    style={{ background: `${n.color}15` }}
                  >
                    {n.icon}
                  </div>
                  <div>
                    <p className="font-display text-base font-semibold">{n.label}</p>
                    {LAUNCH_NICHES.includes(n.id) ? (
                      <span className="text-[10px] font-medium uppercase tracking-wide text-emerald-600">
                        Available now
                      </span>
                    ) : (
                      <span className="text-[10px] font-medium uppercase tracking-wide text-slate-400">
                        Coming soon
                      </span>
                    )}
                  </div>
                </div>
                <p className="mt-3 text-xs text-slate-500">
                  Avg job: ${n.avg_job_low.toLocaleString()}–${n.avg_job_high.toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="pricing" className="bg-slate-50 py-24">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="text-center font-display text-4xl font-bold">Simple, credit-based pricing</h2>
          <p className="mx-auto mt-3 max-w-xl text-center text-slate-500">
            One credit = one AI-rendered postcard mailed. No subscriptions. Credits never expire.
          </p>
          <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3">
            {PACKS.map((p) => (
              <div
                key={p.id}
                className={cn(
                  "relative rounded-2xl border bg-white p-8",
                  p.popular ? "border-2 border-brand shadow-hover" : "border-slate-200",
                )}
              >
                {p.popular ? (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-brand px-4 py-1 text-xs font-semibold text-white">
                    Most Popular
                  </span>
                ) : null}
                <h3 className="font-display text-xl font-semibold text-slate-900">{p.name}</h3>
                <div className="mt-4 font-display text-4xl font-bold text-slate-900">
                  ${p.priceUsd.toLocaleString()}
                  <span className="ml-1 text-sm font-normal text-slate-400">/one-time</span>
                </div>
                <p className="mt-1 text-lg font-semibold text-slate-900">{p.credits} postcards</p>
                <p className="text-sm text-slate-400">${p.perPostcard}/postcard</p>
                <ul className="mt-6 space-y-2.5">
                  {FEATURES.map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
                      <span className="text-sm text-slate-600">{f}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  href="/signup"
                  className={cn(
                    "mt-8 flex h-11 w-full items-center justify-center rounded-lg text-sm font-semibold transition-colors",
                    p.popular
                      ? "bg-brand text-white hover:bg-brand-dark"
                      : "border border-brand text-brand hover:bg-brand-light",
                  )}
                >
                  Get {p.credits} Credits
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="mx-auto max-w-3xl px-6">
          <h2 className="text-center font-display text-4xl font-bold">Questions, answered</h2>
          <div className="mt-10 space-y-3">
            {FAQS.map((f, i) => {
              const open = openFaq === i;
              return (
                <button
                  key={f.q}
                  onClick={() => setOpenFaq(open ? null : i)}
                  className={cn(
                    "w-full rounded-2xl border border-slate-200 bg-white p-5 text-left transition-shadow",
                    open && "shadow-card",
                  )}
                >
                  <div className="flex items-center justify-between gap-4">
                    <span className="font-display text-base font-semibold text-slate-900">
                      {f.q}
                    </span>
                    <ChevronDown
                      className={cn(
                        "h-4 w-4 shrink-0 text-slate-400 transition-transform",
                        open && "rotate-180",
                      )}
                    />
                  </div>
                  {open ? <p className="mt-3 text-sm text-slate-500">{f.a}</p> : null}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      <section className="bg-brand py-24 text-center text-white">
        <div className="mx-auto max-w-3xl px-6">
          <h2 className="font-display text-4xl font-bold md:text-5xl">
            Start finding leads today
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-lg text-white/90">
            10 free postcards included. No credit card required.
          </p>
          <Link
            href="/signup"
            className="mt-8 inline-flex h-12 items-center justify-center rounded-xl bg-white px-8 text-sm font-semibold text-brand shadow-hover hover:bg-slate-100"
          >
            Start free
          </Link>
        </div>
      </section>

      <footer className="border-t border-slate-200 bg-white py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-6 text-sm text-slate-400 md:flex-row">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-brand text-[10px] font-bold text-white">
              PV
            </div>
            <span>ProspectVision © 2026</span>
          </div>
          <div className="flex gap-4">
            <Link href="/terms" className="hover:text-slate-600">Terms</Link>
            <Link href="/privacy" className="hover:text-slate-600">Privacy</Link>
            <Link href="/login" className="hover:text-slate-600">Sign in</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
