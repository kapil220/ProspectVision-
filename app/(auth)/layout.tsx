import { Zap } from 'lucide-react'
import Link from 'next/link'

const TRUST_PILLS = [
  '⚡ AI scans satellite imagery automatically',
  '📬 3–5 day delivery to any US mailbox',
  '📊 Built-in CRM tracks every deal to close',
]

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex">
      <aside className="relative hidden lg:flex lg:w-2/5 bg-[#0F172A] flex-col items-center justify-center px-14 text-center">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand/15">
            <Zap size={18} className="text-brand" strokeWidth={2.5} />
          </span>
          <span className="font-display text-xl font-semibold text-white">ProspectVision</span>
        </Link>

        <p className="mt-6 text-lg text-slate-400">Turn any property into a customer</p>

        <ul className="mt-10 flex flex-col gap-3">
          {TRUST_PILLS.map((pill) => (
            <li
              key={pill}
              className="rounded-full border border-slate-700 px-5 py-2 text-sm text-slate-300"
            >
              {pill}
            </li>
          ))}
        </ul>

        <p className="absolute bottom-8 text-xs text-slate-600">
          Trusted by contractors across the US
        </p>
      </aside>

      <main className="flex w-full items-center justify-center bg-white px-8 py-12 lg:w-3/5">
        <div className="w-full max-w-[390px]">{children}</div>
      </main>
    </div>
  )
}
