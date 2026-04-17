'use client'

import confetti from 'canvas-confetti'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowLeft, ArrowRight, Check, Loader2, X, Zap } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useMemo, useState, type KeyboardEvent } from 'react'
import { toast } from 'sonner'
import { LAUNCH_NICHES, NICHES, getNiche } from '@/lib/niches'
import { cn, sleep } from '@/lib/utils'
import { US_STATES } from '@/lib/usStates'
import type { NicheId } from '@/types'

type FormState = {
  niche: NicheId | ''
  company_name: string
  phone: string
  website: string
  return_address: string
  return_city: string
  return_state: string
  return_zip: string
  service_area_zips: string[]
}

const INITIAL: FormState = {
  niche: '',
  company_name: '',
  phone: '',
  website: '',
  return_address: '',
  return_city: '',
  return_state: '',
  return_zip: '',
  service_area_zips: [],
}

const STEP_LABELS = ['Niche', 'Company', 'Location', 'Launch']

function formatPhone(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 10)
  if (digits.length === 0) return ''
  if (digits.length <= 3) return `(${digits}`
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`
}

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [form, setForm] = useState<FormState>(INITIAL)
  const [zipInput, setZipInput] = useState('')
  const [zipError, setZipError] = useState('')
  const [launching, setLaunching] = useState(false)

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }))

  const canContinue = useMemo(() => {
    if (step === 1) return LAUNCH_NICHES.includes(form.niche as NicheId)
    if (step === 2) return form.company_name.trim().length > 0
    if (step === 3)
      return (
        form.return_address.trim().length > 0 &&
        form.return_city.trim().length > 0 &&
        /^[A-Z]{2}$/.test(form.return_state) &&
        /^\d{5}$/.test(form.return_zip)
      )
    return true
  }, [step, form])

  const addZip = () => {
    const raw = zipInput.trim().replace(/,$/, '')
    if (!raw) return
    if (!/^\d{5}$/.test(raw)) {
      setZipError('ZIP must be 5 digits')
      return
    }
    if (form.service_area_zips.includes(raw)) {
      setZipError('Already added')
      return
    }
    set('service_area_zips', [...form.service_area_zips, raw])
    setZipInput('')
    setZipError('')
  }

  const onZipKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      addZip()
    } else if (e.key === 'Backspace' && zipInput === '' && form.service_area_zips.length) {
      set('service_area_zips', form.service_area_zips.slice(0, -1))
    }
  }

  const removeZip = (z: string) =>
    set(
      'service_area_zips',
      form.service_area_zips.filter((x) => x !== z)
    )

  const handleLaunch = async () => {
    setLaunching(true)
    try {
      const profileRes = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company_name: form.company_name.trim(),
          phone: form.phone || null,
          website: form.website || null,
          niche: form.niche,
          return_address: form.return_address.trim(),
          return_city: form.return_city.trim(),
          return_state: form.return_state,
          return_zip: form.return_zip,
          service_area_zips: form.service_area_zips,
          onboarded_at: new Date().toISOString(),
        }),
      })
      if (!profileRes.ok) {
        const { error } = await profileRes.json().catch(() => ({ error: 'Profile update failed' }))
        throw new Error(error || 'Profile update failed')
      }

      const creditsRes = await fetch('/api/profile/credits', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: 10 }),
      })
      if (!creditsRes.ok) {
        const { error } = await creditsRes.json().catch(() => ({ error: 'Credit grant failed' }))
        throw new Error(error || 'Credit grant failed')
      }

      confetti({
        particleCount: 120,
        spread: 80,
        colors: ['#4F46E5', '#818CF8', '#C7D2FE'],
        origin: { y: 0.6 },
      })
      await sleep(900)
      router.push('/dashboard')
      router.refresh()
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Something went wrong'
      toast.error(msg)
      setLaunching(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#F8FAFC]">
      <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-8">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-brand/10">
            <Zap size={14} className="text-brand" strokeWidth={2.5} />
          </span>
          <span className="font-display text-base font-semibold text-slate-900">ProspectVision</span>
        </Link>
        <span className="text-sm text-slate-500">Step {step} of 4</span>
      </header>

      <main className="flex flex-1 items-center justify-center py-12">
        <div className="w-full max-w-[560px] px-6">
          <StepIndicator step={step} onJump={(s) => s < step && setStep(s)} />

          <div className="min-h-[420px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, x: 24 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -24 }}
                transition={{ duration: 0.2 }}
              >
                {step === 1 && <Step1 niche={form.niche} onSelect={(id) => set('niche', id)} />}
                {step === 2 && (
                  <Step2
                    form={form}
                    onChange={set}
                    onPhoneChange={(v) => set('phone', formatPhone(v))}
                  />
                )}
                {step === 3 && (
                  <Step3
                    form={form}
                    onChange={set}
                    zipInput={zipInput}
                    setZipInput={(v) => {
                      setZipInput(v)
                      setZipError('')
                    }}
                    addZip={addZip}
                    onZipKey={onZipKey}
                    removeZip={removeZip}
                    zipError={zipError}
                  />
                )}
                {step === 4 && (
                  <Step4
                    form={form}
                    onEdit={setStep}
                    onLaunch={handleLaunch}
                    launching={launching}
                  />
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {step < 4 && (
            <div className="mt-8 flex justify-between">
              {step > 1 ? (
                <button
                  type="button"
                  onClick={() => setStep((s) => s - 1)}
                  className="flex h-[42px] items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
                >
                  <ArrowLeft size={14} />
                  Back
                </button>
              ) : (
                <span />
              )}
              <button
                type="button"
                disabled={!canContinue}
                onClick={() => setStep((s) => s + 1)}
                className="flex h-[42px] items-center gap-1.5 rounded-lg bg-brand px-5 text-sm font-semibold text-white transition-all duration-150 hover:-translate-y-px hover:bg-brand-dark hover:shadow-hover disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-none"
              >
                Continue
                <ArrowRight size={14} />
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

function StepIndicator({ step, onJump }: { step: number; onJump: (s: number) => void }) {
  return (
    <div className="mb-10">
      <div className="flex items-center">
        {[1, 2, 3, 4].map((n, i) => {
          const done = n < step
          const current = n === step
          return (
            <div key={n} className="flex flex-1 items-center last:flex-none">
              <button
                type="button"
                onClick={() => onJump(n)}
                disabled={!done}
                className={cn(
                  'flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold transition-colors',
                  done && 'bg-brand text-white',
                  current && 'bg-brand text-white ring-4 ring-brand/15',
                  !done && !current && 'border-2 border-slate-200 bg-white text-slate-400',
                  done && 'cursor-pointer hover:bg-brand-dark'
                )}
                aria-label={`Step ${n}: ${STEP_LABELS[i]}`}
              >
                {done ? <Check size={16} strokeWidth={3} /> : n}
              </button>
              {n < 4 && (
                <div
                  className={cn('h-px flex-1 transition-colors', n < step ? 'bg-brand' : 'bg-slate-200')}
                />
              )}
            </div>
          )
        })}
      </div>
      <div className="mt-1.5 flex">
        {STEP_LABELS.map((label, i) => (
          <div key={label} className={cn('flex-1 last:flex-none', i === 3 && 'w-9 text-right')}>
            <p className="w-9 text-center text-[11px] text-slate-500">{label}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

function Step1({ niche, onSelect }: { niche: string; onSelect: (id: NicheId) => void }) {
  return (
    <div>
      <h2 className="font-display text-2xl font-semibold text-slate-900">
        What service do you specialize in?
      </h2>
      <p className="mt-1.5 text-sm text-slate-500">
        This personalizes ProspectVision for your trade
      </p>
      <div className="mt-6 grid grid-cols-3 gap-3">
        {NICHES.map((n) => {
          const live = LAUNCH_NICHES.includes(n.id)
          const selected = niche === n.id
          return (
            <motion.button
              key={n.id}
              type="button"
              onClick={() => live && onSelect(n.id)}
              disabled={!live}
              whileHover={live ? { scale: 1.02 } : undefined}
              whileTap={live ? { scale: 0.98 } : undefined}
              className={cn(
                'relative rounded-xl border p-4 text-left transition-all',
                selected
                  ? 'border-2 border-brand bg-brand-light'
                  : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-card',
                !live && 'cursor-not-allowed opacity-60 hover:border-slate-200 hover:shadow-none'
              )}
            >
              {live ? (
                <span className="absolute -right-2 -top-2 rounded-full bg-brand px-2 py-0.5 text-[9px] font-semibold text-white">
                  ✓ Live
                </span>
              ) : (
                <span className="absolute -right-2 -top-2 rounded-full bg-slate-200 px-2 py-0.5 text-[9px] font-medium text-slate-600">
                  Soon
                </span>
              )}
              <span className="mb-2 block text-[28px] leading-none">{n.icon}</span>
              <span className="block text-sm font-semibold text-slate-900">{n.label}</span>
              <span className="mt-1 block text-xs text-slate-500">{n.description}</span>
            </motion.button>
          )
        })}
      </div>
    </div>
  )
}

function Step2({
  form,
  onChange,
  onPhoneChange,
}: {
  form: FormState
  onChange: <K extends keyof FormState>(k: K, v: FormState[K]) => void
  onPhoneChange: (v: string) => void
}) {
  return (
    <div>
      <h2 className="font-display text-2xl font-semibold text-slate-900">
        Tell us about your business
      </h2>
      <p className="mt-1.5 text-sm text-slate-500">
        This info appears on your postcards and homeowner landing pages
      </p>
      <div className="mt-6 flex flex-col gap-4">
        <Field label="Company name" required>
          <input
            type="text"
            value={form.company_name}
            onChange={(e) => onChange('company_name', e.target.value)}
            placeholder="Acme Landscaping LLC"
            className={fieldInput}
            autoFocus
          />
        </Field>
        <Field label="Phone">
          <input
            type="tel"
            value={form.phone}
            onChange={(e) => onPhoneChange(e.target.value)}
            placeholder="(555) 123-4567"
            className={fieldInput}
          />
        </Field>
        <Field label="Website" hint="Optional">
          <input
            type="url"
            value={form.website}
            onChange={(e) => onChange('website', e.target.value)}
            placeholder="https://acmelandscaping.com"
            className={fieldInput}
          />
        </Field>
      </div>
    </div>
  )
}

function Step3({
  form,
  onChange,
  zipInput,
  setZipInput,
  addZip,
  onZipKey,
  removeZip,
  zipError,
}: {
  form: FormState
  onChange: <K extends keyof FormState>(k: K, v: FormState[K]) => void
  zipInput: string
  setZipInput: (v: string) => void
  addZip: () => void
  onZipKey: (e: KeyboardEvent<HTMLInputElement>) => void
  removeZip: (z: string) => void
  zipError: string
}) {
  return (
    <div>
      <h2 className="font-display text-2xl font-semibold text-slate-900">
        Where do you operate?
      </h2>
      <p className="mt-1.5 text-sm text-slate-500">
        Your return address goes on every postcard. Service ZIPs tell us where to scan.
      </p>

      <div className="mt-6 rounded-lg border-l-4 border-amber-400 bg-amber-50 p-4 text-sm text-amber-900">
        <span className="font-semibold">⚠️ Required by USPS for all direct mail.</span> This
        appears on every postcard you send.
      </div>

      <div className="mt-6 flex flex-col gap-4">
        <Field label="Street address" required>
          <input
            type="text"
            value={form.return_address}
            onChange={(e) => onChange('return_address', e.target.value)}
            placeholder="123 Main Street"
            className={fieldInput}
          />
        </Field>
        <div className="grid grid-cols-[1fr_120px_140px] gap-3">
          <Field label="City" required>
            <input
              type="text"
              value={form.return_city}
              onChange={(e) => onChange('return_city', e.target.value)}
              placeholder="Dallas"
              className={fieldInput}
            />
          </Field>
          <Field label="State" required>
            <select
              value={form.return_state}
              onChange={(e) => onChange('return_state', e.target.value)}
              className={cn(fieldInput, 'appearance-none pr-8')}
            >
              <option value="">—</option>
              {US_STATES.map((s) => (
                <option key={s.code} value={s.code}>
                  {s.code}
                </option>
              ))}
            </select>
          </Field>
          <Field label="ZIP" required>
            <input
              type="text"
              inputMode="numeric"
              maxLength={5}
              value={form.return_zip}
              onChange={(e) => onChange('return_zip', e.target.value.replace(/\D/g, ''))}
              placeholder="75201"
              className={fieldInput}
            />
          </Field>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">
            Service area ZIP codes
          </label>
          <div
            className={cn(
              'flex min-h-[46px] flex-wrap items-center gap-2 rounded-lg border bg-white p-2 transition-all focus-within:ring-2 focus-within:ring-brand/20',
              zipError ? 'border-red-300' : 'border-slate-200 focus-within:border-brand'
            )}
          >
            {form.service_area_zips.map((z) => (
              <span
                key={z}
                className="inline-flex items-center gap-1 rounded-full bg-brand-light px-2.5 py-1 font-mono text-xs font-medium text-brand-dark"
              >
                {z}
                <button
                  type="button"
                  onClick={() => removeZip(z)}
                  className="flex h-3.5 w-3.5 items-center justify-center rounded-full hover:bg-brand/15"
                  aria-label={`Remove ${z}`}
                >
                  <X size={10} strokeWidth={3} />
                </button>
              </span>
            ))}
            <input
              type="text"
              inputMode="numeric"
              maxLength={5}
              value={zipInput}
              onChange={(e) => setZipInput(e.target.value.replace(/\D/g, ''))}
              onKeyDown={onZipKey}
              onBlur={() => zipInput && addZip()}
              placeholder={form.service_area_zips.length ? '' : 'Enter ZIPs and press Enter or comma'}
              className="min-w-[120px] flex-1 bg-transparent px-1.5 py-1 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
            />
          </div>
          <p className="mt-1 text-xs text-slate-500">
            {zipError ? (
              <span className="text-red-500">{zipError}</span>
            ) : (
              'Press Enter or comma to add. You can edit these later in Settings.'
            )}
          </p>
        </div>
      </div>
    </div>
  )
}

function Step4({
  form,
  onEdit,
  onLaunch,
  launching,
}: {
  form: FormState
  onEdit: (step: number) => void
  onLaunch: () => void
  launching: boolean
}) {
  const niche = form.niche ? getNiche(form.niche as NicheId) : undefined
  const addressOneLine =
    `${form.return_address}, ${form.return_city}, ${form.return_state} ${form.return_zip}`.trim()

  return (
    <div>
      <h2 className="font-display text-2xl font-semibold text-slate-900">You&apos;re all set 🚀</h2>
      <p className="mt-1.5 text-sm text-slate-500">Review your setup and launch your account.</p>

      <div className="mt-6 divide-y divide-slate-200 rounded-xl border border-slate-200 bg-white">
        <SummaryRow label="Niche" onEdit={() => onEdit(1)}>
          {niche ? (
            <span className="inline-flex items-center gap-1.5">
              <span className="text-base">{niche.icon}</span>
              <span className="text-sm font-medium text-slate-900">{niche.label}</span>
            </span>
          ) : (
            <span className="text-sm text-slate-400">Not selected</span>
          )}
        </SummaryRow>
        <SummaryRow label="Company" onEdit={() => onEdit(2)}>
          <span className="text-sm text-slate-900">{form.company_name || '—'}</span>
        </SummaryRow>
        <SummaryRow label="Return address" onEdit={() => onEdit(3)}>
          <span className="text-right text-sm text-slate-900">{addressOneLine}</span>
        </SummaryRow>
        <SummaryRow label="Service area" onEdit={() => onEdit(3)}>
          <span className="text-sm text-slate-900">
            {form.service_area_zips.length} ZIP code{form.service_area_zips.length === 1 ? '' : 's'}
          </span>
        </SummaryRow>
      </div>

      <div className="mt-5 rounded-xl border-2 border-brand bg-brand-light p-5">
        <p className="font-display text-base font-semibold text-brand-dark">
          ⚡ 10 free credits included
        </p>
        <p className="mt-1 text-sm text-slate-700">
          Mail your first 10 postcards on us. No credit card required.
        </p>
      </div>

      <button
        type="button"
        onClick={onLaunch}
        disabled={launching}
        className="mt-6 flex h-[52px] w-full items-center justify-center gap-2 rounded-xl bg-brand font-display text-lg font-semibold text-white transition-all duration-150 hover:-translate-y-px hover:bg-brand-dark hover:shadow-hover disabled:cursor-not-allowed disabled:opacity-80 disabled:hover:translate-y-0"
      >
        {launching ? (
          <>
            <Loader2 size={18} className="animate-spin" />
            Setting up your account...
          </>
        ) : (
          <>Launch ProspectVision →</>
        )}
      </button>
    </div>
  )
}

function SummaryRow({
  label,
  children,
  onEdit,
}: {
  label: string
  children: React.ReactNode
  onEdit: () => void
}) {
  return (
    <div className="flex items-center justify-between gap-4 p-4">
      <span className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</span>
      <div className="flex items-center gap-3">
        {children}
        <button
          type="button"
          onClick={onEdit}
          className="text-sm font-medium text-brand hover:text-brand-dark"
        >
          Edit
        </button>
      </div>
    </div>
  )
}

function Field({
  label,
  required,
  hint,
  children,
}: {
  label: string
  required?: boolean
  hint?: string
  children: React.ReactNode
}) {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <label className="text-sm font-medium text-slate-700">
          {label}
          {required && <span className="ml-0.5 text-red-500">*</span>}
        </label>
        {hint && <span className="text-xs text-slate-400">{hint}</span>}
      </div>
      {children}
    </div>
  )
}

const fieldInput =
  'h-[42px] w-full rounded-lg border border-slate-200 bg-white px-3.5 text-sm text-slate-900 placeholder:text-slate-400 transition-all focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20'
