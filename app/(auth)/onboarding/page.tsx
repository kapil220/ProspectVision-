"use client";

import confetti from "canvas-confetti";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Check, Loader2, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, type KeyboardEvent } from "react";
import { toast } from "sonner";
import { LAUNCH_NICHES, NICHES, getNiche } from "@/lib/niches";
import { cn, sleep } from "@/lib/utils";
import { US_STATES } from "@/lib/usStates";
import type { NicheId } from "@/types";

type FormState = {
  niche: NicheId | "";
  company_name: string;
  phone: string;
  website: string;
  return_address: string;
  return_city: string;
  return_state: string;
  return_zip: string;
  service_area_zips: string[];
};

const INITIAL: FormState = {
  niche: "",
  company_name: "",
  phone: "",
  website: "",
  return_address: "",
  return_city: "",
  return_state: "",
  return_zip: "",
  service_area_zips: [],
};

const STEP_LABELS = ["Niche", "Company", "Location", "Launch"] as const;

// Editorial imagery for each step's hero panel.
const STEP_IMAGES: Record<number, { src: string; caption: string }> = {
  1: {
    src: "https://images.unsplash.com/photo-1568605114967-8130f3a36994?auto=format&fit=crop&w=1600&q=80",
    caption: "Pick the trade you sell. We'll tune the entire pipeline to it.",
  },
  2: {
    src: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1600&q=80",
    caption: "Your name shows up on every postcard. Make it look right.",
  },
  3: {
    src: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1600&q=80",
    caption: "Where do you work? We'll prospect those neighborhoods.",
  },
  4: {
    src: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1600&q=80",
    caption: "100 free credits. Your first batch is on us.",
  },
};

function formatPhone(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 10);
  if (digits.length === 0) return "";
  if (digits.length <= 3) return `(${digits}`;
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormState>(INITIAL);
  const [zipInput, setZipInput] = useState("");
  const [zipError, setZipError] = useState("");
  const [launching, setLaunching] = useState(false);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const canContinue = useMemo(() => {
    if (step === 1) return LAUNCH_NICHES.includes(form.niche as NicheId);
    if (step === 2) return form.company_name.trim().length > 0;
    if (step === 3)
      return (
        form.return_address.trim().length > 0 &&
        form.return_city.trim().length > 0 &&
        /^[A-Z]{2}$/.test(form.return_state) &&
        /^\d{5}$/.test(form.return_zip)
      );
    return true;
  }, [step, form]);

  const addZip = () => {
    const raw = zipInput.trim().replace(/,$/, "");
    if (!raw) return;
    if (!/^\d{5}$/.test(raw)) {
      setZipError("ZIP must be 5 digits");
      return;
    }
    if (form.service_area_zips.includes(raw)) {
      setZipError("Already added");
      return;
    }
    set("service_area_zips", [...form.service_area_zips, raw]);
    setZipInput("");
    setZipError("");
  };

  const onZipKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addZip();
    } else if (e.key === "Backspace" && zipInput === "" && form.service_area_zips.length) {
      set("service_area_zips", form.service_area_zips.slice(0, -1));
    }
  };

  const removeZip = (z: string) =>
    set(
      "service_area_zips",
      form.service_area_zips.filter((x) => x !== z),
    );

  const handleLaunch = async () => {
    setLaunching(true);
    try {
      const profileRes = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
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
      });
      if (!profileRes.ok) {
        const { error } = await profileRes.json().catch(() => ({ error: "Profile update failed" }));
        throw new Error(error || "Profile update failed");
      }

      const creditsRes = await fetch("/api/profile/credits", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: 10 }),
      });
      if (!creditsRes.ok) {
        const { error } = await creditsRes.json().catch(() => ({ error: "Credit grant failed" }));
        throw new Error(error || "Credit grant failed");
      }

      confetti({
        particleCount: 140,
        spread: 90,
        colors: ["#0F5132", "#3A7559", "#D6A556", "#F5F1EA"],
        origin: { y: 0.55 },
      });
      await sleep(900);
      router.push("/dashboard");
      router.refresh();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Something went wrong";
      toast.error(msg);
      setLaunching(false);
    }
  };

  const hero = STEP_IMAGES[step];

  return (
    <div className="grid min-h-screen grid-cols-1 bg-ivory lg:grid-cols-[1.1fr_1fr]">
      {/* Editorial left panel */}
      <aside className="relative hidden overflow-hidden bg-ink lg:block">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, scale: 1.06 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.02 }}
            transition={{ duration: 1.1, ease: [0.21, 0.61, 0.35, 1] }}
            className="absolute inset-0"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={hero.src} alt="" className="h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/30 to-ink/40" />
          </motion.div>
        </AnimatePresence>

        <div className="relative z-10 flex h-full flex-col justify-between p-12 text-ivory">
          <Link href="/" className="flex items-center gap-2 font-display text-lg font-semibold tracking-tight">
            <span className="grid h-8 w-8 place-items-center rounded-full bg-ivory text-ink">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /><path d="M12 3v18M3 12h18" /></svg>
            </span>
            ProspectVision
          </Link>

          <AnimatePresence mode="wait">
            <motion.div
              key={`cap-${step}`}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.6, ease: [0.21, 0.61, 0.35, 1] }}
              className="max-w-md"
            >
              <p className="num text-xs uppercase tracking-[0.24em] text-ivory/70">
                Step {step} of 4 · {STEP_LABELS[step - 1]}
              </p>
              <h2 className="mt-5 display text-4xl font-medium leading-[1.1] tracking-tight md:text-5xl">
                {hero.caption}
              </h2>
            </motion.div>
          </AnimatePresence>

          <div className="flex items-center gap-3">
            {STEP_LABELS.map((_, i) => {
              const n = i + 1;
              const active = n <= step;
              return (
                <div
                  key={n}
                  className={cn(
                    "h-[3px] flex-1 rounded-full transition-all duration-700",
                    active ? "bg-ivory" : "bg-ivory/20",
                  )}
                />
              );
            })}
          </div>
        </div>
      </aside>

      {/* Form right panel */}
      <main className="relative flex min-h-screen flex-col">
        <header className="flex h-16 items-center justify-between border-b border-line px-6 lg:hidden">
          <Link href="/" className="flex items-center gap-2 font-display text-base font-semibold">
            <span className="grid h-7 w-7 place-items-center rounded-full bg-ink text-ivory">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /><path d="M12 3v18M3 12h18" /></svg>
            </span>
            ProspectVision
          </Link>
          <span className="num text-xs uppercase tracking-[0.18em] text-ink-muted">
            {step}/4
          </span>
        </header>

        <div className="flex flex-1 items-center justify-center px-6 py-12 lg:px-16">
          <div className="w-full max-w-md">
            <StepIndicator step={step} onJump={(s) => s < step && setStep(s)} />

            <div className="min-h-[440px]">
              <AnimatePresence mode="wait">
                <motion.div
                  key={step}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.45, ease: [0.21, 0.61, 0.35, 1] }}
                >
                  {step === 1 && <Step1 niche={form.niche} onSelect={(id) => set("niche", id)} />}
                  {step === 2 && (
                    <Step2
                      form={form}
                      onChange={set}
                      onPhoneChange={(v) => set("phone", formatPhone(v))}
                    />
                  )}
                  {step === 3 && (
                    <Step3
                      form={form}
                      onChange={set}
                      zipInput={zipInput}
                      setZipInput={(v) => {
                        setZipInput(v);
                        setZipError("");
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
              <div className="mt-10 flex items-center justify-between">
                {step > 1 ? (
                  <button
                    type="button"
                    onClick={() => setStep((s) => s - 1)}
                    className="btn-ghost h-11 px-5"
                  >
                    <ArrowLeft className="mr-1.5 h-4 w-4" />
                    Back
                  </button>
                ) : (
                  <span />
                )}
                <motion.button
                  type="button"
                  disabled={!canContinue}
                  onClick={() => setStep((s) => s + 1)}
                  whileTap={{ scale: 0.97 }}
                  className="btn-primary h-11 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Continue
                  <ArrowRight className="ml-1.5 h-4 w-4" />
                </motion.button>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

function StepIndicator({ step, onJump }: { step: number; onJump: (s: number) => void }) {
  return (
    <ol className="mb-10 flex items-center gap-3 text-xs num uppercase tracking-[0.2em]">
      {STEP_LABELS.map((label, i) => {
        const n = i + 1;
        const done = n < step;
        const active = n === step;
        return (
          <li key={label} className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => onJump(n)}
              disabled={!done}
              className={cn(
                "flex items-center gap-2 transition-colors",
                done && "text-ink hover:text-emerald cursor-pointer",
                active && "text-ink",
                !done && !active && "text-ink-muted",
              )}
            >
              <span
                className={cn(
                  "grid h-6 w-6 place-items-center rounded-full text-[10px] transition-all",
                  done && "bg-emerald text-ivory",
                  active && "bg-ink text-ivory",
                  !done && !active && "border border-line text-ink-muted",
                )}
              >
                {done ? <Check className="h-3 w-3" /> : n}
              </span>
              <span className="hidden sm:inline">{label}</span>
            </button>
            {i < STEP_LABELS.length - 1 && (
              <span className={cn("h-px w-6 transition-colors", n < step ? "bg-emerald" : "bg-line")} />
            )}
          </li>
        );
      })}
    </ol>
  );
}

function Step1({ niche, onSelect }: { niche: string; onSelect: (id: NicheId) => void }) {
  return (
    <div>
      <p className="num text-xs uppercase tracking-[0.22em] text-ink-muted">Step 1</p>
      <h1 className="mt-3 display text-4xl font-medium leading-[1.05] tracking-tight">
        What do you sell?
      </h1>
      <p className="mt-3 text-sm text-ink-soft">
        Pick a niche. We tune scoring, rendering, and postcard templates to it.
      </p>

      <div className="mt-8 grid grid-cols-2 gap-2.5">
        {NICHES.map((n) => {
          const launchable = LAUNCH_NICHES.includes(n.id);
          const selected = niche === n.id;
          return (
            <motion.button
              key={n.id}
              type="button"
              onClick={() => launchable && onSelect(n.id)}
              disabled={!launchable}
              whileHover={launchable ? { y: -2 } : undefined}
              whileTap={launchable ? { scale: 0.98 } : undefined}
              className={cn(
                "relative rounded-xl border p-4 text-left transition-all",
                selected
                  ? "border-ink bg-ink text-ivory shadow-card"
                  : "border-line bg-ivory-50 text-ink hover:border-ink/40",
                !launchable && "cursor-not-allowed opacity-50",
              )}
            >
              <div className="flex items-start justify-between">
                <span className="text-2xl">{n.icon}</span>
                {selected && <Check className="h-4 w-4" />}
              </div>
              <div className="mt-3 font-display text-base font-semibold leading-tight">{n.label}</div>
              {!launchable && (
                <span className="mt-1 block text-[10px] uppercase tracking-[0.18em] text-ink-muted">
                  Coming soon
                </span>
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

type Step2Props = {
  form: FormState;
  onChange: <K extends keyof FormState>(key: K, value: FormState[K]) => void;
  onPhoneChange: (raw: string) => void;
};

function Step2({ form, onChange, onPhoneChange }: Step2Props) {
  return (
    <div>
      <p className="num text-xs uppercase tracking-[0.22em] text-ink-muted">Step 2</p>
      <h1 className="mt-3 display text-4xl font-medium leading-[1.05] tracking-tight">
        Tell us about you.
      </h1>
      <p className="mt-3 text-sm text-ink-soft">
        Your name goes on every postcard. Phone and website are optional but boost reply rate.
      </p>

      <div className="mt-8 space-y-5">
        <Field label="Company name" required>
          <input
            type="text"
            value={form.company_name}
            onChange={(e) => onChange("company_name", e.target.value)}
            placeholder="Greenline Lawn Care"
            className="input"
          />
        </Field>
        <Field label="Phone" hint="Format: (555) 123-4567">
          <input
            type="tel"
            value={form.phone}
            onChange={(e) => onPhoneChange(e.target.value)}
            placeholder="(555) 123-4567"
            className="input"
          />
        </Field>
        <Field label="Website">
          <input
            type="url"
            value={form.website}
            onChange={(e) => onChange("website", e.target.value)}
            placeholder="https://greenline.com"
            className="input"
          />
        </Field>
      </div>
    </div>
  );
}

type Step3Props = {
  form: FormState;
  onChange: <K extends keyof FormState>(key: K, value: FormState[K]) => void;
  zipInput: string;
  setZipInput: (v: string) => void;
  addZip: () => void;
  onZipKey: (e: KeyboardEvent<HTMLInputElement>) => void;
  removeZip: (z: string) => void;
  zipError: string;
};

function Step3({ form, onChange, zipInput, setZipInput, addZip, onZipKey, removeZip, zipError }: Step3Props) {
  return (
    <div>
      <p className="num text-xs uppercase tracking-[0.22em] text-ink-muted">Step 3</p>
      <h1 className="mt-3 display text-4xl font-medium leading-[1.05] tracking-tight">
        Where do you work?
      </h1>
      <p className="mt-3 text-sm text-ink-soft">
        Return address goes on every postcard (USPS requires it). Service ZIPs help us prospect.
      </p>

      <div className="mt-8 space-y-5">
        <Field label="Return address" required>
          <input
            type="text"
            value={form.return_address}
            onChange={(e) => onChange("return_address", e.target.value)}
            placeholder="1234 Main St"
            className="input"
          />
        </Field>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-[1.4fr_0.8fr_1fr]">
          <Field label="City" required>
            <input
              type="text"
              value={form.return_city}
              onChange={(e) => onChange("return_city", e.target.value)}
              placeholder="Austin"
              className="input"
            />
          </Field>
          <Field label="State" required>
            <select
              value={form.return_state}
              onChange={(e) => onChange("return_state", e.target.value)}
              className="input"
            >
              <option value="">—</option>
              {US_STATES.map((s) => (
                <option key={s.code} value={s.code}>{s.code}</option>
              ))}
            </select>
          </Field>
          <Field label="ZIP" required>
            <input
              type="text"
              inputMode="numeric"
              value={form.return_zip}
              onChange={(e) => onChange("return_zip", e.target.value.replace(/\D/g, "").slice(0, 5))}
              placeholder="78701"
              className="input num"
            />
          </Field>
        </div>

        <Field label="Service area ZIPs" hint="Optional · press Enter or comma to add">
          <div className="rounded-lg border border-line bg-ivory-50 px-3 py-2 transition-colors focus-within:border-ink">
            <div className="flex flex-wrap items-center gap-1.5">
              {form.service_area_zips.map((z) => (
                <motion.span
                  key={z}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  className="num inline-flex items-center gap-1 rounded-md bg-ink/5 px-2 py-0.5 text-xs text-ink"
                >
                  {z}
                  <button type="button" onClick={() => removeZip(z)} aria-label={`Remove ${z}`}>
                    <X className="h-3 w-3 text-ink-muted hover:text-crimson" />
                  </button>
                </motion.span>
              ))}
              <input
                type="text"
                inputMode="numeric"
                value={zipInput}
                onChange={(e) => setZipInput(e.target.value.replace(/\D/g, "").slice(0, 5))}
                onKeyDown={onZipKey}
                onBlur={addZip}
                placeholder={form.service_area_zips.length ? "" : "78701"}
                className="num min-w-[80px] flex-1 bg-transparent py-1 text-sm outline-none placeholder:text-ink-muted/60"
              />
            </div>
          </div>
          {zipError && <p className="mt-2 text-xs text-crimson">{zipError}</p>}
        </Field>
      </div>
    </div>
  );
}

type Step4Props = {
  form: FormState;
  onEdit: (step: number) => void;
  onLaunch: () => void;
  launching: boolean;
};

function Step4({ form, onEdit, onLaunch, launching }: Step4Props) {
  const niche = form.niche ? getNiche(form.niche as NicheId) : null;
  return (
    <div>
      <p className="num text-xs uppercase tracking-[0.22em] text-ink-muted">All set</p>
      <h1 className="mt-3 display text-4xl font-medium leading-[1.05] tracking-tight">
        Ready to <span className="display-italic text-emerald">prospect.</span>
      </h1>
      <p className="mt-3 text-sm text-ink-soft">
        Review the details, then launch. We&apos;ll spot you 100 free credits to start.
      </p>

      <div className="mt-8 divide-y divide-line rounded-xl border border-line bg-ivory-50">
        <SummaryRow
          label="Niche"
          value={niche ? `${niche.icon} ${niche.label}` : "—"}
          onEdit={() => onEdit(1)}
        />
        <SummaryRow
          label="Company"
          value={form.company_name || "—"}
          extra={[form.phone, form.website].filter(Boolean).join(" · ")}
          onEdit={() => onEdit(2)}
        />
        <SummaryRow
          label="Location"
          value={`${form.return_address}, ${form.return_city}, ${form.return_state} ${form.return_zip}`}
          extra={
            form.service_area_zips.length
              ? `Service: ${form.service_area_zips.join(", ")}`
              : undefined
          }
          onEdit={() => onEdit(3)}
        />
      </div>

      <motion.button
        type="button"
        onClick={onLaunch}
        disabled={launching}
        whileTap={{ scale: 0.98 }}
        className="mt-8 flex h-12 w-full items-center justify-center gap-2 rounded-full bg-ink text-base font-medium text-ivory transition-colors hover:bg-emerald disabled:opacity-60"
      >
        {launching ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" /> Launching your account…
          </>
        ) : (
          <>
            Claim 100 credits & launch <ArrowRight className="h-4 w-4" />
          </>
        )}
      </motion.button>
    </div>
  );
}

function SummaryRow({
  label,
  value,
  extra,
  onEdit,
}: {
  label: string;
  value: string;
  extra?: string;
  onEdit: () => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4 px-5 py-4">
      <div className="min-w-0">
        <div className="num text-[10px] uppercase tracking-[0.22em] text-ink-muted">{label}</div>
        <div className="mt-1 truncate text-sm font-medium text-ink">{value}</div>
        {extra ? <div className="mt-0.5 truncate text-xs text-ink-soft">{extra}</div> : null}
      </div>
      <button
        type="button"
        onClick={onEdit}
        className="shrink-0 text-xs font-medium text-emerald link-underline"
      >
        Edit
      </button>
    </div>
  );
}

function Field({
  label,
  hint,
  required,
  children,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-[0.16em] text-ink-soft">
          {label}
          {required && <span className="ml-1 text-emerald">*</span>}
        </span>
        {hint && <span className="text-[11px] text-ink-muted">{hint}</span>}
      </span>
      {children}
    </label>
  );
}
