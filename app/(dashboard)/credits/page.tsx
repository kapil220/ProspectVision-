"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CheckCircle, Loader2, Zap } from "lucide-react";
import { toast } from "sonner";
import { PageContainer } from "@/components/ui/PageContainer";
import { cn, formatCurrency, formatDate } from "@/lib/utils";

type Pack = {
  id: "starter" | "growth" | "scale";
  name: string;
  credits: number;
  priceUsd: number;
  perPostcard: string;
  popular: boolean;
};

const PACKS: Pack[] = [
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

type Purchase = {
  id: string;
  created_at: string;
  credits_purchased: number;
  amount_cents: number;
  status: string;
  stripe_payment_intent: string | null;
};

export default function CreditsPage() {
  const params = useSearchParams();
  const [balance, setBalance] = useState<number | null>(null);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState<string | null>(null);

  useEffect(() => {
    if (params.get("success") === "true") {
      const pack = params.get("pack");
      toast.success(`Purchase complete! Credits added${pack ? ` from ${pack} pack` : ""}.`);
    }
    if (params.get("canceled") === "true") {
      toast("Checkout canceled — no charge made.");
    }
  }, [params]);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/profile", { cache: "no-store" });
        const json = await res.json();
        if (json.data?.credit_balance !== undefined) setBalance(json.data.credit_balance);
      } catch {
        /* ignore */
      }
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

  async function buy(packId: string) {
    setLoading(packId);
    try {
      const res = await fetch("/api/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pack_id: packId }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Checkout failed");
      if (json.url) window.location.href = json.url;
    } catch (e) {
      toast.error((e as Error).message);
      setLoading(null);
    }
  }

  const b = balance ?? 0;

  return (
    <PageContainer>
      <div className="mb-8 rounded-2xl border border-indigo-200 bg-gradient-to-br from-indigo-50 to-purple-50 p-8">
        <div className="flex items-center gap-3">
          <Zap className="h-10 w-10 text-brand" strokeWidth={2} />
          <div className="font-display text-5xl font-bold text-brand">
            {balance === null ? "—" : b.toLocaleString()}
          </div>
        </div>
        <p className="mt-2 text-lg text-slate-600">credits available</p>
        <p className="mt-1 text-sm text-slate-500">≈ {Math.floor(b / 30)} ZIP code scans</p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
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
            <button
              onClick={() => buy(p.id)}
              disabled={loading !== null}
              className={cn(
                "mt-8 flex h-11 w-full items-center justify-center rounded-lg text-sm font-semibold transition-colors disabled:opacity-60",
                p.popular
                  ? "bg-brand text-white hover:bg-brand-dark"
                  : "border border-brand text-brand hover:bg-brand-light",
              )}
            >
              {loading === p.id ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                `Get ${p.credits} Credits`
              )}
            </button>
          </div>
        ))}
      </div>

      <p className="mt-6 text-center text-xs text-slate-400">
        Credits never expire · Unused credits refundable within 30 days
      </p>

      <div className="mt-10">
        <h2 className="font-display text-xl font-semibold text-slate-900">Purchase history</h2>
        <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Pack</th>
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
                        : `${p.credits_purchased} credits`}
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
      </div>
    </PageContainer>
  );
}
