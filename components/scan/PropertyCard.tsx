"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { User, Mail } from "lucide-react";
import { GoogleAttribution } from "@/components/ui/GoogleAttribution";
import { PostcardPreviewModal } from "@/components/scan/PostcardPreviewModal";
import { cn, formatCurrency, formatNumber } from "@/lib/utils";
import type { Property } from "@/types";

type Props = {
  property: Property;
  onApprovalChange: (id: string, approved: boolean) => void;
};

export function PropertyCard({ property, onApprovalChange }: Props) {
  const [showAfter, setShowAfter] = useState(Boolean(property.render_url));
  const [approved, setApproved] = useState(property.approved);
  const [pending, setPending] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);

  const score = property.upgrade_score ?? 0;
  const hot = score >= 90;
  const warm = score >= 70 && score < 90;

  async function toggleApprove() {
    const next = !approved;
    setApproved(next);
    setPending(true);
    onApprovalChange(property.id, next);
    try {
      const res = await fetch(`/api/properties/${property.id}/approve`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ approved: next }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Failed");
    } catch (e) {
      setApproved(!next);
      onApprovalChange(property.id, !next);
      toast.error((e as Error).message);
    } finally {
      setPending(false);
    }
  }

  const img =
    showAfter && property.render_url
      ? property.render_url
      : property.satellite_url ?? property.streetview_url ?? "";

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:shadow-hover">
      <div className="relative aspect-video bg-slate-100">
        {property.render_url ? (
          <div className="absolute left-2 top-2 z-10 flex gap-1">
            <button
              type="button"
              onClick={() => setShowAfter(false)}
              className={cn(
                "cursor-pointer rounded-full px-2.5 py-1 text-[11px] font-semibold transition-colors",
                !showAfter
                  ? "bg-white text-slate-900 shadow-sm"
                  : "bg-black/40 text-white hover:bg-black/60",
              )}
            >
              Before
            </button>
            <button
              type="button"
              onClick={() => setShowAfter(true)}
              className={cn(
                "cursor-pointer rounded-full px-2.5 py-1 text-[11px] font-semibold transition-colors",
                showAfter
                  ? "bg-white text-slate-900 shadow-sm"
                  : "bg-black/40 text-white hover:bg-black/60",
              )}
            >
              After ✨
            </button>
          </div>
        ) : null}

        {img ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={img}
            alt={property.address}
            className="h-full w-full object-cover transition-opacity duration-300"
          />
        ) : null}

        {hot || warm ? (
          <div
            className={cn(
              "absolute right-2 top-2 rounded-full px-2.5 py-1 text-xs font-bold text-white",
              hot ? "bg-red-500" : "bg-amber-500",
            )}
          >
            {hot ? "🔥" : "⚡"} {score}
          </div>
        ) : null}

        <GoogleAttribution />
      </div>

      <div className="p-4">
        <p className="text-[13px] font-semibold leading-tight text-slate-900">
          {property.address}
        </p>
        <p className="mt-0.5 text-xs text-slate-400">
          {property.city}, {property.state} {property.zip}
        </p>

        <div className="mt-2.5 flex flex-wrap gap-1.5">
          {property.build_year ? (
            <Pill>🏠 {property.build_year}</Pill>
          ) : null}
          {property.lot_size_sqft ? (
            <Pill>📐 {formatNumber(property.lot_size_sqft)} sqft</Pill>
          ) : null}
          {property.estimated_value ? (
            <Pill>💰 {formatCurrency(property.estimated_value, true)}</Pill>
          ) : null}
        </div>

        <div className="mt-2 flex items-center gap-1">
          <User className="h-3 w-3 text-slate-400" strokeWidth={2} />
          {property.owner_first || property.owner_last ? (
            <span className="text-xs text-slate-500">
              {[property.owner_first, property.owner_last].filter(Boolean).join(" ")}
            </span>
          ) : (
            <span className="text-xs italic text-slate-300">
              Owner data unavailable
            </span>
          )}
        </div>

        {property.score_reasons?.length ? (
          <div className="mt-2 space-y-0.5">
            {property.score_reasons.slice(0, 2).map((r, i) => (
              <p key={i} className="text-xs italic text-slate-400">
                → {r}
              </p>
            ))}
          </div>
        ) : null}

        {property.roi_estimate_low !== null && property.roi_estimate_high !== null ? (
          <div className="mt-3 flex items-baseline justify-between border-t border-slate-100 pt-3">
            <p className="text-xs text-slate-500">Est. value added</p>
            <p className="text-sm font-semibold text-green-600">
              {formatCurrency(property.roi_estimate_low, true)}–
              {formatCurrency(property.roi_estimate_high, true)}
            </p>
          </div>
        ) : null}
      </div>

      <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3">
        <div className="flex items-baseline gap-1">
          <span
            className={cn(
              "font-mono text-base font-bold",
              hot ? "text-red-600" : "text-amber-600",
            )}
          >
            {score}
          </span>
          <span className="text-xs text-slate-400">/100</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setPreviewOpen(true)}
            className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 transition-colors hover:text-brand"
          >
            <Mail className="h-3.5 w-3.5" strokeWidth={2} />
            Postcard
          </button>
          {property.landing_slug ? (
            <Link
              href={`/p/${property.landing_slug}`}
              target="_blank"
              className="text-xs text-slate-400 hover:text-slate-600"
            >
              Landing
            </Link>
          ) : null}
          <motion.button
            type="button"
            whileTap={{ scale: 0.95 }}
            onClick={toggleApprove}
            disabled={pending}
            className={cn(
              "h-8 rounded-lg px-3 text-sm font-medium transition-colors disabled:opacity-60",
              approved
                ? "bg-brand text-white hover:bg-brand-dark"
                : "border border-slate-200 text-slate-600 hover:border-slate-300",
            )}
          >
            {approved ? "✓ Approved" : "Approve"}
          </motion.button>
        </div>
      </div>

      {previewOpen ? (
        <PostcardPreviewModal
          propertyId={property.id}
          address={`${property.address}, ${property.city} ${property.state}`}
          onClose={() => setPreviewOpen(false)}
        />
      ) : null}
    </div>
  );
}

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-md bg-slate-50 px-2 py-1 text-xs text-slate-600">
      {children}
    </span>
  );
}
