import Link from "next/link";

const TRUST_PILLS = [
  "AI reads satellite + street imagery automatically",
  "USPS first class · 3–5 day delivery",
  "Built-in CRM tracks every deal to close",
];

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-screen grid-cols-1 bg-ivory lg:grid-cols-[1.05fr_1fr]">
      <aside className="relative hidden overflow-hidden lg:block">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=1600&q=80"
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-ink/70 via-ink/55 to-ink/85" />

        <div className="relative z-10 flex h-full flex-col justify-between p-12 text-ivory">
          <Link href="/" className="flex items-center gap-2 font-display text-lg font-semibold tracking-tight">
            <span className="grid h-8 w-8 place-items-center rounded-full bg-ivory text-ink">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /><path d="M12 3v18M3 12h18" /></svg>
            </span>
            ProspectVision
          </Link>

          <div className="max-w-md">
            <p className="num text-xs uppercase tracking-[0.24em] text-ivory/70">For contractors who close</p>
            <h1 className="mt-5 display text-4xl font-medium leading-[1.1] tracking-tight md:text-5xl">
              See the home <span className="display-italic text-ochre">before you knock.</span>
            </h1>
            <ul className="mt-10 space-y-3 text-sm text-ivory/80">
              {TRUST_PILLS.map((pill) => (
                <li key={pill} className="flex items-start gap-3">
                  <span className="mt-1.5 h-1 w-6 shrink-0 rounded-full bg-ochre" />
                  {pill}
                </li>
              ))}
            </ul>
          </div>

          <p className="num text-[11px] uppercase tracking-[0.22em] text-ivory/50">
            © 2026 · Trusted by contractors across the US
          </p>
        </div>
      </aside>

      <main className="flex min-h-screen flex-col">
        <header className="flex h-16 items-center justify-between border-b border-line px-6 lg:hidden">
          <Link href="/" className="flex items-center gap-2 font-display text-base font-semibold">
            <span className="grid h-7 w-7 place-items-center rounded-full bg-ink text-ivory">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /><path d="M12 3v18M3 12h18" /></svg>
            </span>
            ProspectVision
          </Link>
        </header>
        <div className="flex flex-1 items-center justify-center px-6 py-12 lg:px-16">
          <div className="w-full max-w-md">{children}</div>
        </div>
      </main>
    </div>
  );
}
