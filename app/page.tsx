"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowUpRight, Sparkles, Eye, Mail, Target, Zap, Star, Check } from "lucide-react";
import { Reveal } from "@/components/motion/Reveal";
import { SplitText } from "@/components/motion/SplitText";
import { Magnetic } from "@/components/motion/Magnetic";
import { BeforeAfter } from "@/components/motion/BeforeAfter";
import { Marquee } from "@/components/motion/Marquee";
import { CountUp } from "@/components/motion/CountUp";

const HERO_BEFORE =
  "https://images.unsplash.com/photo-1568605114967-8130f3a36994?auto=format&fit=crop&w=1600&q=80";
const HERO_AFTER =
  "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1600&q=80";

const NICHES = [
  { id: "landscaping", label: "Landscaping", img: "https://images.unsplash.com/photo-1558904541-efa843a96f01?auto=format&fit=crop&w=900&q=70" },
  { id: "roofing", label: "Roofing", img: "https://images.unsplash.com/photo-1632154905587-7b8b3a7d6e7d?auto=format&fit=crop&w=900&q=70" },
  { id: "solar", label: "Solar", img: "https://images.unsplash.com/photo-1508514177221-188b1cf16e9d?auto=format&fit=crop&w=900&q=70" },
  { id: "painting", label: "Exterior Paint", img: "https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=900&q=70" },
  { id: "fencing", label: "Fencing", img: "https://images.unsplash.com/photo-1506057213435-9f0b4d2cb3a5?auto=format&fit=crop&w=900&q=70" },
  { id: "pool", label: "Pools", img: "https://images.unsplash.com/photo-1571902943202-507ec2618e8f?auto=format&fit=crop&w=900&q=70" },
  { id: "driveway", label: "Driveways", img: "https://images.unsplash.com/photo-1605276374104-dee2a0ed3cd6?auto=format&fit=crop&w=900&q=70" },
  { id: "wash", label: "Pressure Wash", img: "https://images.unsplash.com/photo-1575503802870-45de6a6217c8?auto=format&fit=crop&w=900&q=70" },
];

const STEPS = [
  { n: "01", title: "Scan", body: "Drop a ZIP. We pull every parcel from county + ATTOM data.", icon: Target },
  { n: "02", title: "Score", body: "GPT-4o reads satellite + street imagery to rank by visible need.", icon: Eye },
  { n: "03", title: "Render", body: "AI generates a photoreal 'after' for the top scoring homes.", icon: Sparkles },
  { n: "04", title: "Mail", body: "Personalized 6×9 postcards via Lob, with QR to a private landing page.", icon: Mail },
];

const TESTIMONIALS = [
  { quote: "Our reply rate jumped from 0.7% to 4.2%. The before/after is the whole pitch.", who: "Cole R.", role: "Owner, Greenline Lawn" },
  { quote: "Closed three roofs from a 250-piece batch. The math just works.", who: "Marcus D.", role: "Sterling Roofing Co." },
  { quote: "I used to drive neighborhoods looking for jobs. Now my postcards do that for me.", who: "Priya N.", role: "Pacific Painting" },
];

const PRICING = [
  { name: "Starter", price: "0.65", unit: "per postcard", subline: "100-piece minimum", features: ["AI scoring + render", "Lob USPS first class", "Personal landing pages", "QR + suppression list"] },
  { name: "Growth", price: "0.55", unit: "per postcard", subline: "500-piece minimum", features: ["Everything in Starter", "Niche-tuned scoring v2", "Bulk batches", "Priority render queue"], popular: true },
  { name: "Scale", price: "0.45", unit: "per postcard", subline: "2,000-piece minimum", features: ["Everything in Growth", "Custom postcard design", "Dedicated success manager", "API access"] },
];

const STATS: { v: number; prefix?: string; suffix?: string; label: string }[] = [
  { v: 4.2, suffix: "%", label: "Avg. response rate" },
  { v: 612, prefix: "$", suffix: "k+", label: "Customer revenue closed" },
  { v: 38, suffix: "s", label: "Avg. postcard generation" },
  { v: 9, label: "Service niches supported" },
];

export default function MarketingHome() {
  return (
    <div className="relative min-h-screen bg-ivory text-ink">
      <NavBar />
      <Hero />
      <LogoStrip />
      <HowItWorks />
      <NicheGallery />
      <PostcardShowcase />
      <Stats />
      <Testimonials />
      <Pricing />
      <CTA />
      <Footer />
    </div>
  );
}

function NavBar() {
  return (
    <motion.header
      initial={{ y: -16, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.7, ease: [0.21, 0.61, 0.35, 1] }}
      className="sticky top-0 z-40 border-b border-line/60 bg-ivory/80 backdrop-blur-xl"
    >
      <div className="container flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-display text-lg font-semibold tracking-tight">
          <span className="grid h-8 w-8 place-items-center rounded-full bg-ink text-ivory">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /><path d="M12 3v18M3 12h18" /></svg>
          </span>
          ProspectVision
        </Link>
        <nav className="hidden items-center gap-8 text-sm text-ink-soft md:flex">
          <a href="#how" className="link-underline hover:text-ink">How it works</a>
          <a href="#niches" className="link-underline hover:text-ink">Niches</a>
          <a href="#pricing" className="link-underline hover:text-ink">Pricing</a>
        </nav>
        <div className="flex items-center gap-2">
          <Link href="/login" className="btn-ghost hidden sm:inline-flex">Sign in</Link>
          <Magnetic>
            <Link href="/signup" className="btn-primary group">
              Start free <ArrowUpRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </Link>
          </Magnetic>
        </div>
      </div>
    </motion.header>
  );
}

function Hero() {
  return (
    <section className="container relative pt-16 pb-24 md:pt-24 md:pb-32">
      <div className="grid gap-14 lg:grid-cols-12 lg:gap-12">
        <div className="lg:col-span-7">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-6 inline-flex items-center gap-2 rounded-full border border-line bg-ivory-50 px-3 py-1.5 text-xs font-medium tracking-wide text-ink-soft"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-emerald" />
            New · Scoring engine v2 — hybrid visual + ATTOM signals
          </motion.div>

          <h1 className="display text-display-xl">
            <SplitText text="See the home" />{" "}
            <span className="display-italic text-emerald">
              <SplitText text="before you knock." delay={0.4} />
            </span>
          </h1>

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.0, duration: 0.7 }}
            className="mt-7 max-w-xl text-lg leading-relaxed text-ink-soft"
          >
            ProspectVision scans satellite imagery, ranks every house by visible need, and ships
            personalized AI-rendered postcards. Stop knocking doors. Start picking jobs.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.15, duration: 0.7 }}
            className="mt-9 flex flex-wrap items-center gap-3"
          >
            <Magnetic>
              <Link href="/signup" className="btn-primary text-base">
                Start a free scan <ArrowUpRight className="ml-1 h-4 w-4" />
              </Link>
            </Magnetic>
            <Link href="#how" className="btn-ghost text-base">See how it works</Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.4, duration: 0.8 }}
            className="mt-10 flex items-center gap-6 text-xs uppercase tracking-[0.18em] text-ink-muted"
          >
            <span className="num">No credit card</span>
            <span className="h-px w-6 bg-line" />
            <span className="num">100 free credits</span>
            <span className="h-px w-6 bg-line" />
            <span className="num">USPS · Lob verified</span>
          </motion.div>
        </div>

        <div className="lg:col-span-5">
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.9, ease: [0.21, 0.61, 0.35, 1] }}
            className="relative"
          >
            <div className="absolute -inset-4 -z-10 rounded-[2rem] bg-gradient-to-br from-ochre/30 via-emerald/10 to-transparent blur-2xl" />
            <BeforeAfter
              before={HERO_BEFORE}
              after={HERO_AFTER}
              className="aspect-[4/5] shadow-editorial"
            />
            <div className="mt-4 flex items-center justify-between text-xs text-ink-muted">
              <span className="num uppercase tracking-[0.16em]">Drag · See the lift</span>
              <span className="num">12 Maple St · Score 94</span>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function LogoStrip() {
  const items = ["Greenline Lawn", "Sterling Roofing", "Pacific Painting", "BlueWave Pools", "Cedar Fence Co.", "RidgePro HVAC", "Sunbelt Solar"];
  return (
    <section className="border-y border-line bg-ivory-50/60">
      <div className="container py-8">
        <p className="mb-6 text-center text-[11px] font-medium uppercase tracking-[0.22em] text-ink-muted">
          Trusted by contractors closing real jobs
        </p>
        <Marquee>
          {items.map((name) => (
            <span key={name} className="font-display text-2xl font-medium text-ink-soft/70">
              {name}
            </span>
          ))}
        </Marquee>
      </div>
    </section>
  );
}

function HowItWorks() {
  return (
    <section id="how" className="container py-28">
      <div className="grid gap-12 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <Reveal>
            <p className="mb-4 text-xs font-medium uppercase tracking-[0.22em] text-ink-muted">The pipeline</p>
            <h2 className="display text-display-lg">
              From a ZIP code <span className="display-italic text-emerald">to a closed job.</span>
            </h2>
            <p className="mt-6 max-w-md text-base leading-relaxed text-ink-soft">
              Four steps. Fully automated. You review the leads we surface — we handle scoring,
              rendering, mail, and the landing page.
            </p>
          </Reveal>
        </div>

        <div className="lg:col-span-8">
          <ol className="grid gap-px overflow-hidden rounded-3xl border border-line bg-line sm:grid-cols-2">
            {STEPS.map((s, i) => (
              <Reveal key={s.n} delay={i * 0.05} as="li" className="group relative bg-ivory-50 p-7 transition-colors hover:bg-paper/60">
                <div className="flex items-start justify-between">
                  <span className="num text-xs uppercase tracking-[0.22em] text-ink-muted">{s.n}</span>
                  <s.icon className="h-5 w-5 text-emerald transition-transform group-hover:rotate-6" />
                </div>
                <h3 className="mt-8 font-display text-2xl font-semibold tracking-tight">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-soft">{s.body}</p>
              </Reveal>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}

function NicheGallery() {
  return (
    <section id="niches" className="border-y border-line bg-paper/40">
      <div className="container py-28">
        <div className="mb-14 flex items-end justify-between gap-6">
          <Reveal>
            <p className="mb-4 text-xs font-medium uppercase tracking-[0.22em] text-ink-muted">Niches</p>
            <h2 className="display text-display-lg">
              One platform. <span className="display-italic text-ochre">Every trade.</span>
            </h2>
          </Reveal>
          <Reveal delay={0.1} className="hidden max-w-sm text-sm text-ink-soft md:block">
            Each niche ships with a tuned scoring rubric, render style, and postcard template.
          </Reveal>
        </div>

        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {NICHES.map((n, i) => (
            <Reveal key={n.id} delay={i * 0.04}>
              <motion.div
                whileHover={{ y: -4 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className="group relative aspect-[4/5] overflow-hidden rounded-2xl bg-ink"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={n.img}
                  alt={n.label}
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/20 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 flex items-center justify-between p-5">
                  <span className="font-display text-lg font-semibold text-ivory">{n.label}</span>
                  <ArrowUpRight className="h-4 w-4 -translate-x-2 text-ivory opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100" />
                </div>
              </motion.div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function PostcardShowcase() {
  return (
    <section className="container py-28">
      <div className="grid gap-16 lg:grid-cols-12 lg:items-center">
        <div className="lg:col-span-5">
          <Reveal>
            <p className="mb-4 text-xs font-medium uppercase tracking-[0.22em] text-ink-muted">Direct mail, reinvented</p>
            <h2 className="display text-display-lg">
              A postcard that <span className="display-italic text-emerald">starts the conversation.</span>
            </h2>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="mt-6 text-base leading-relaxed text-ink-soft">
              Each piece is generated for one address. The owner sees their own home — transformed.
              A QR code drops them on a private landing page that converts.
            </p>
          </Reveal>
          <Reveal delay={0.15}>
            <ul className="mt-8 space-y-3 text-sm">
              {[
                "AI-rendered after photo of their actual home",
                "Personalized headline + ROI estimate",
                "USPS first class with full tracking",
                "Built-in opt-out + suppression list compliance",
              ].map((b) => (
                <li key={b} className="flex items-start gap-3">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald" />
                  <span className="text-ink-soft">{b}</span>
                </li>
              ))}
            </ul>
          </Reveal>
        </div>

        <div className="lg:col-span-7">
          <Reveal delay={0.05}>
            <div className="relative">
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -left-6 top-6 z-10 hidden rotate-[-6deg] rounded-2xl bg-ivory-50 p-3 shadow-editorial md:block"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={HERO_BEFORE} alt="" className="h-44 w-72 rounded-lg object-cover" />
                <p className="mt-2 text-center font-display text-xs uppercase tracking-[0.2em] text-ink-soft">Before</p>
              </motion.div>
              <motion.div
                animate={{ y: [0, 10, 0] }}
                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                className="ml-auto mt-10 w-[88%] rotate-[3deg] rounded-2xl bg-ivory-50 p-4 shadow-editorial"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={HERO_AFTER} alt="" className="aspect-[3/2] w-full rounded-lg object-cover" />
                <div className="mt-3 flex items-center justify-between">
                  <p className="font-display text-base font-semibold">Sarah, this could be your yard.</p>
                  <span className="rounded-full bg-emerald px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-ivory">After · AI</span>
                </div>
                <p className="mt-1 text-xs text-ink-soft">Est. value lift $14K – $22K · Scan for a free estimate.</p>
              </motion.div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

function Stats() {
  return (
    <section className="bg-ink text-ivory">
      <div className="container py-24">
        <div className="grid grid-cols-2 gap-y-12 md:grid-cols-4">
          {STATS.map((s) => (
            <Reveal key={s.label} className="text-center md:text-left">
              <div className="display num text-display-md text-ivory">
                <CountUp to={s.v} prefix={s.prefix ?? ""} suffix={s.suffix ?? ""} />
              </div>
              <p className="mt-2 text-xs uppercase tracking-[0.2em] text-ivory/60">{s.label}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function Testimonials() {
  return (
    <section className="container py-28">
      <Reveal>
        <p className="mb-4 text-xs font-medium uppercase tracking-[0.22em] text-ink-muted">Real contractors</p>
        <h2 className="display text-display-lg max-w-3xl">
          The work, on <span className="display-italic text-emerald">repeat.</span>
        </h2>
      </Reveal>
      <div className="mt-14 grid gap-6 md:grid-cols-3">
        {TESTIMONIALS.map((t, i) => (
          <Reveal key={t.who} delay={i * 0.08}>
            <figure className="flex h-full flex-col rounded-2xl border border-line bg-ivory-50 p-7">
              <div className="flex gap-0.5 text-ochre">
                {[...Array(5)].map((_, k) => <Star key={k} className="h-4 w-4 fill-current" />)}
              </div>
              <blockquote className="mt-4 flex-1 font-display text-xl leading-snug tracking-tight">
                “{t.quote}”
              </blockquote>
              <figcaption className="mt-6 border-t border-line pt-4 text-sm">
                <div className="font-medium text-ink">{t.who}</div>
                <div className="text-ink-soft">{t.role}</div>
              </figcaption>
            </figure>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

function Pricing() {
  return (
    <section id="pricing" className="border-y border-line bg-paper/40">
      <div className="container py-28">
        <div className="mb-14 max-w-2xl">
          <Reveal>
            <p className="mb-4 text-xs font-medium uppercase tracking-[0.22em] text-ink-muted">Pricing</p>
            <h2 className="display text-display-lg">
              Pay per <span className="display-italic text-emerald">postcard.</span>
            </h2>
          </Reveal>
          <Reveal delay={0.08}>
            <p className="mt-5 text-base text-ink-soft">
              Postage, render, scoring, and the landing page — included. No subscriptions, no setup fees.
            </p>
          </Reveal>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {PRICING.map((p, i) => (
            <Reveal key={p.name} delay={i * 0.06}>
              <motion.div
                whileHover={{ y: -4 }}
                transition={{ type: "spring", stiffness: 280, damping: 20 }}
                className={`relative flex h-full flex-col rounded-3xl p-8 ${
                  p.popular
                    ? "bg-ink text-ivory shadow-editorial"
                    : "border border-line bg-ivory-50"
                }`}
              >
                {p.popular ? (
                  <span className="absolute -top-3 left-8 rounded-full bg-ochre px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-ink">
                    Most popular
                  </span>
                ) : null}
                <h3 className="font-display text-2xl font-semibold tracking-tight">{p.name}</h3>
                <div className="mt-6 flex items-end gap-2">
                  <span className="num display text-display-md">${p.price}</span>
                  <span className={`pb-2 text-sm ${p.popular ? "text-ivory/70" : "text-ink-soft"}`}>{p.unit}</span>
                </div>
                <p className={`mt-1 text-xs ${p.popular ? "text-ivory/60" : "text-ink-muted"}`}>{p.subline}</p>
                <ul className="mt-8 flex-1 space-y-3 text-sm">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-start gap-3">
                      <Check className={`mt-0.5 h-4 w-4 shrink-0 ${p.popular ? "text-ochre" : "text-emerald"}`} />
                      <span className={p.popular ? "text-ivory/85" : "text-ink-soft"}>{f}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  href="/signup"
                  className={`mt-8 inline-flex items-center justify-center rounded-full px-5 py-3 text-sm font-medium transition-colors ${
                    p.popular ? "bg-ivory text-ink hover:bg-ochre" : "bg-ink text-ivory hover:bg-emerald"
                  }`}
                >
                  Start with {p.name} <ArrowUpRight className="ml-1 h-4 w-4" />
                </Link>
              </motion.div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function CTA() {
  return (
    <section className="container py-28">
      <Reveal>
        <div className="relative overflow-hidden rounded-[2.5rem] bg-emerald p-12 text-ivory md:p-20">
          <motion.div
            aria-hidden
            animate={{ rotate: 360 }}
            transition={{ duration: 80, repeat: Infinity, ease: "linear" }}
            className="absolute -right-40 -top-40 h-[640px] w-[640px] rounded-full bg-ochre/20 blur-3xl"
          />
          <div className="relative max-w-2xl">
            <Zap className="h-8 w-8 text-ochre" />
            <h2 className="mt-6 display text-display-lg">
              The next batch of jobs is <span className="display-italic">already on the map.</span>
            </h2>
            <p className="mt-6 max-w-lg text-base leading-relaxed text-ivory/80">
              Ship a 100-piece test batch this week. We&apos;ll spot you 100 free credits.
            </p>
            <div className="mt-10 flex flex-wrap items-center gap-3">
              <Magnetic>
                <Link href="/signup" className="inline-flex items-center justify-center rounded-full bg-ivory px-7 py-4 text-base font-medium text-ink transition-colors hover:bg-ochre">
                  Start free <ArrowUpRight className="ml-1 h-4 w-4" />
                </Link>
              </Magnetic>
              <Link href="/login" className="inline-flex items-center justify-center rounded-full border border-ivory/30 px-7 py-4 text-base font-medium text-ivory transition-colors hover:bg-ivory/10">
                I already have an account
              </Link>
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-line">
      <div className="container flex flex-col gap-8 py-12 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <span className="grid h-8 w-8 place-items-center rounded-full bg-ink text-ivory">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /><path d="M12 3v18M3 12h18" /></svg>
          </span>
          <span className="font-display text-base font-semibold tracking-tight">ProspectVision</span>
          <span className="ml-2 text-xs text-ink-muted">© 2026</span>
        </div>
        <nav className="flex flex-wrap items-center gap-6 text-sm text-ink-soft">
          <Link href="/privacy" className="link-underline hover:text-ink">Privacy</Link>
          <Link href="/tos" className="link-underline hover:text-ink">Terms</Link>
          <a href="mailto:hello@prospectvision.app" className="link-underline hover:text-ink">hello@prospectvision.app</a>
        </nav>
      </div>
    </footer>
  );
}
