"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AlertTriangle, Loader2, MapPin } from "lucide-react";
import { toast } from "sonner";
import { PageContainer } from "@/components/ui/PageContainer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import { NICHES } from "@/lib/niches";
import type { NicheId } from "@/types";

type Profile = {
  id: string;
  email: string;
  full_name: string | null;
  company_name: string;
  phone: string | null;
  website: string | null;
  niche: NicheId | "";
  return_address: string;
  return_city: string;
  return_state: string;
  return_zip: string;
  service_area_zips: string[];
  credit_balance: number;
};

type Purchase = {
  id: string;
  created_at: string;
  credits_purchased: number;
  amount_cents: number;
  status: string;
  stripe_payment_intent: string | null;
};

const TABS = [
  { id: "profile", label: "Profile" },
  { id: "mailing", label: "Mailing Address" },
  { id: "service", label: "Service Area" },
  { id: "billing", label: "Billing" },
] as const;

type TabId = (typeof TABS)[number]["id"];

const US_STATES = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA","KS",
  "KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ","NM","NY",
  "NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT","VA","WA","WV","WI","WY",
];

export default function SettingsPage() {
  const [tab, setTab] = useState<TabId>("profile");
  const [profile, setProfile] = useState<Profile | null>(null);
  const [purchases, setPurchases] = useState<Purchase[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/profile", { cache: "no-store" });
        const json = await res.json();
        if (json.data) setProfile(json.data);
      } catch {
        toast.error("Failed to load profile.");
      }
    })();
    (async () => {
      try {
        const res = await fetch("/api/credits/history", { cache: "no-store" });
        if (res.ok) {
          const j = await res.json();
          setPurchases(j.data ?? []);
        }
      } catch {
        /* ignore */
      }
    })();
  }, []);

  if (!profile) {
    return (
      <PageContainer>
        <div className="flex h-64 items-center justify-center text-slate-400">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <h1 className="font-display text-2xl font-semibold text-slate-900">Settings</h1>
      <p className="mt-1 text-sm text-slate-500">
        Manage your profile, mailing address, service area, and billing.
      </p>

      <div className="mt-6 flex gap-6 border-b border-slate-200">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              "relative -mb-px pb-3 text-sm font-medium transition-colors",
              tab === t.id ? "text-brand" : "text-slate-500 hover:text-slate-900",
            )}
          >
            {t.label}
            {tab === t.id ? (
              <span className="absolute inset-x-0 -bottom-px h-0.5 bg-brand" />
            ) : null}
          </button>
        ))}
      </div>

      <div className="mt-8">
        {tab === "profile" && <ProfileTab profile={profile} onSaved={setProfile} />}
        {tab === "mailing" && <MailingTab profile={profile} onSaved={setProfile} />}
        {tab === "service" && <ServiceAreaTab profile={profile} onSaved={setProfile} />}
        {tab === "billing" && <BillingTab profile={profile} purchases={purchases} />}
      </div>
    </PageContainer>
  );
}

async function savePatch(body: Record<string, unknown>): Promise<Profile> {
  const res = await fetch("/api/profile", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error ?? "Save failed");
  return json.data as Profile;
}

function ProfileTab({
  profile,
  onSaved,
}: {
  profile: Profile;
  onSaved: (p: Profile) => void;
}) {
  const [company, setCompany] = useState(profile.company_name);
  const [fullName, setFullName] = useState(profile.full_name ?? "");
  const [phone, setPhone] = useState(profile.phone ?? "");
  const [website, setWebsite] = useState(profile.website ?? "");
  const [niche, setNiche] = useState<NicheId | "">(profile.niche);
  const [saving, setSaving] = useState(false);

  async function save() {
    if (!company.trim()) return toast.error("Company name is required");
    setSaving(true);
    try {
      const updated = await savePatch({
        company_name: company,
        phone: phone || null,
        website: website || null,
        niche: niche || undefined,
      });
      onSaved(updated);
      toast.success("Profile saved");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Section title="Profile details">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Company name *">
          <Input value={company} onChange={(e) => setCompany(e.target.value)} />
        </Field>
        <Field label="Contact name">
          <Input value={fullName} onChange={(e) => setFullName(e.target.value)} />
        </Field>
        <Field label="Phone">
          <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(555) 123-4567" />
        </Field>
        <Field label="Website">
          <Input value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://" />
        </Field>
      </div>
      <div className="mt-6">
        <Label>Niche</Label>
        <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-5">
          {NICHES.map((n) => (
            <button
              key={n.id}
              onClick={() => setNiche(n.id)}
              className={cn(
                "flex items-center gap-2 rounded-xl border px-3 py-2 text-left text-sm transition-colors",
                niche === n.id
                  ? "border-brand bg-brand-light text-brand"
                  : "border-slate-200 hover:bg-slate-50",
              )}
            >
              <span className="text-base">{n.icon}</span>
              <span className="truncate font-medium">{n.label}</span>
            </button>
          ))}
        </div>
      </div>
      <div className="mt-6">
        <Button onClick={save} disabled={saving}>
          {saving ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </Section>
  );
}

function MailingTab({
  profile,
  onSaved,
}: {
  profile: Profile;
  onSaved: (p: Profile) => void;
}) {
  const [editing, setEditing] = useState(!profile.return_address);
  const [addr, setAddr] = useState(profile.return_address);
  const [city, setCity] = useState(profile.return_city);
  const [state, setState] = useState(profile.return_state);
  const [zip, setZip] = useState(profile.return_zip);
  const [saving, setSaving] = useState(false);

  async function save() {
    if (!addr.trim()) return toast.error("Street address is required");
    if (!/^\d{5}$/.test(zip)) return toast.error("ZIP must be 5 digits");
    setSaving(true);
    try {
      const updated = await savePatch({
        return_address: addr,
        return_city: city,
        return_state: state,
        return_zip: zip,
      });
      onSaved(updated);
      toast.success("Mailing address saved");
      setEditing(false);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Section title="Return / mailing address">
      <div className="mb-4 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
        <div>
          <p className="font-semibold">Required by USPS</p>
          <p className="text-amber-800">
            This address appears on every postcard as the return address. It must be a valid
            US business address.
          </p>
        </div>
      </div>

      {!editing ? (
        <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex items-start gap-3">
            <MapPin className="mt-0.5 h-4 w-4 text-slate-400" />
            <div className="text-sm">
              <p className="font-medium text-slate-900">{profile.company_name}</p>
              <p className="text-slate-600">{profile.return_address}</p>
              <p className="text-slate-600">
                {profile.return_city}, {profile.return_state} {profile.return_zip}
              </p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
            Edit
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <Field label="Street address">
            <Input value={addr} onChange={(e) => setAddr(e.target.value)} />
          </Field>
          <div className="grid grid-cols-3 gap-4">
            <Field label="City">
              <Input value={city} onChange={(e) => setCity(e.target.value)} />
            </Field>
            <Field label="State">
              <select
                value={state}
                onChange={(e) => setState(e.target.value)}
                className="h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-sm"
              >
                <option value="">—</option>
                {US_STATES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </Field>
            <Field label="ZIP">
              <Input value={zip} onChange={(e) => setZip(e.target.value)} maxLength={5} />
            </Field>
          </div>
          <div className="flex gap-2">
            <Button onClick={save} disabled={saving}>
              {saving ? "Saving..." : "Save Address"}
            </Button>
            <Button variant="outline" onClick={() => setEditing(false)}>
              Cancel
            </Button>
          </div>
        </div>
      )}
    </Section>
  );
}

function ServiceAreaTab({
  profile,
  onSaved,
}: {
  profile: Profile;
  onSaved: (p: Profile) => void;
}) {
  const [zips, setZips] = useState<string[]>(profile.service_area_zips ?? []);
  const [input, setInput] = useState("");
  const [saving, setSaving] = useState(false);

  function addZip(raw: string) {
    const clean = raw.replace(/[^0-9]/g, "").slice(0, 5);
    if (clean.length !== 5) return;
    if (zips.includes(clean)) return;
    setZips((z) => [...z, clean]);
  }

  function handleKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addZip(input);
      setInput("");
    } else if (e.key === "Backspace" && !input && zips.length) {
      setZips((z) => z.slice(0, -1));
    }
  }

  async function save() {
    setSaving(true);
    try {
      const updated = await savePatch({ service_area_zips: zips });
      onSaved(updated);
      toast.success("Service area saved");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Section title="Service area">
      <p className="mb-3 text-sm text-slate-500">
        ZIP codes you work in. Scans and benchmarks are scoped to these ZIPs.
      </p>
      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-white p-3">
        {zips.map((z) => (
          <span
            key={z}
            className="inline-flex items-center gap-1.5 rounded-full bg-brand-light px-2.5 py-1 font-mono text-xs font-medium text-brand"
          >
            {z}
            <button
              onClick={() => setZips((arr) => arr.filter((x) => x !== z))}
              className="text-brand/70 hover:text-brand"
            >
              ×
            </button>
          </span>
        ))}
        <input
          value={input}
          onChange={(e) => setInput(e.target.value.replace(/[^0-9]/g, "").slice(0, 5))}
          onKeyDown={handleKey}
          placeholder={zips.length === 0 ? "Type ZIP and press Enter…" : "Add another…"}
          className="min-w-[140px] flex-1 bg-transparent text-sm outline-none"
        />
      </div>
      <div className="mt-4">
        <Button onClick={save} disabled={saving}>
          {saving ? "Saving..." : "Save ZIPs"}
        </Button>
      </div>
    </Section>
  );
}

function BillingTab({ profile, purchases }: { profile: Profile; purchases: Purchase[] }) {
  const totalSpent = useMemo(
    () => purchases.reduce((sum, p) => sum + (p.amount_cents ?? 0), 0),
    [purchases],
  );

  return (
    <Section title="Billing">
      <div className="flex items-center justify-between rounded-2xl border border-indigo-200 bg-gradient-to-br from-indigo-50 to-purple-50 p-6">
        <div>
          <p className="text-sm text-slate-600">Current balance</p>
          <p className="mt-1 font-display text-3xl font-bold text-brand">
            ⚡ {profile.credit_balance.toLocaleString()} credits
          </p>
        </div>
        <Button asChild>
          <Link href="/credits">Buy More Credits →</Link>
        </Button>
      </div>

      <div className="mt-6">
        <p className="text-xs text-slate-500">
          Lifetime spend: <span className="font-semibold text-slate-900">{formatCurrency(totalSpent / 100)}</span>
        </p>
      </div>

      <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Description</th>
              <th className="px-4 py-3">Credits</th>
              <th className="px-4 py-3">Amount</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {purchases.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-slate-400">
                  No purchases yet.
                </td>
              </tr>
            ) : (
              purchases.map((p) => (
                <tr key={p.id}>
                  <td className="px-4 py-3 text-slate-600">{formatDate(p.created_at)}</td>
                  <td className="px-4 py-3 text-slate-900">
                    {p.stripe_payment_intent === "free_onboarding_credits"
                      ? "Onboarding (free)"
                      : `${p.credits_purchased} credit pack`}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{p.credits_purchased}</td>
                  <td className="px-4 py-3 text-slate-600">
                    {p.amount_cents === 0 ? "Free" : formatCurrency(p.amount_cents / 100)}
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                      {p.status}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </Section>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-card">
      <h2 className="font-display text-lg font-semibold text-slate-900">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <Label>{label}</Label>
      <div className="mt-1.5">{children}</div>
    </div>
  );
}
