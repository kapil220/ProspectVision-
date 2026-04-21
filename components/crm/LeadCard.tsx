"use client";

import Link from "next/link";
import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { Calendar } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import type { LeadWithProperty } from "@/app/(dashboard)/crm/page";

type Props = { lead: LeadWithProperty };

export function LeadCard({ lead }: Props) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: lead.id,
  });
  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.4 : 1,
  };

  const p = lead.property;
  const ownerName = [p?.owner_first, p?.owner_last].filter(Boolean).join(" ") || "Owner unknown";
  const thumb = p?.render_url || p?.satellite_url || p?.streetview_url || null;
  const hasFollowUp = !!lead.follow_up_date;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className="cursor-grab rounded-xl border border-slate-200 bg-white p-3 shadow-card transition-all hover:-translate-y-px hover:shadow-hover active:cursor-grabbing"
    >
      <div className="flex gap-2">
        {thumb ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={thumb} alt="" className="h-[38px] w-[38px] shrink-0 rounded-md object-cover" />
        ) : (
          <div className="h-[38px] w-[38px] shrink-0 rounded-md bg-slate-100" />
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-semibold text-slate-900">{p?.address}</p>
          <p className="truncate text-[11px] text-slate-500">{ownerName}</p>
        </div>
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[10px]">
        {typeof p?.upgrade_score === "number" ? (
          <span className="rounded bg-slate-100 px-1.5 py-0.5 font-medium text-slate-700">
            Score {p.upgrade_score}
          </span>
        ) : null}
        {p?.lob_status && p.lob_status !== "not_mailed" ? (
          <span className="rounded bg-blue-50 px-1.5 py-0.5 font-medium text-blue-700">
            {p.lob_status}
          </span>
        ) : null}
        {lead.deal_value ? (
          <span className="rounded bg-emerald-50 px-1.5 py-0.5 font-medium text-emerald-700">
            {formatCurrency(lead.deal_value, true)}
          </span>
        ) : lead.quote_amount ? (
          <span className="rounded bg-amber-50 px-1.5 py-0.5 font-medium text-amber-700">
            Q {formatCurrency(lead.quote_amount, true)}
          </span>
        ) : null}
        {hasFollowUp ? (
          <span className="inline-flex items-center gap-0.5 rounded bg-red-50 px-1.5 py-0.5 font-medium text-red-600">
            <Calendar className="h-2.5 w-2.5" />
            {new Date(lead.follow_up_date!).toLocaleDateString()}
          </span>
        ) : null}
      </div>
      <div className="mt-2 flex justify-end">
        <Link
          href={`/crm/${lead.id}`}
          onClick={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
          className="text-[11px] font-medium text-brand hover:underline"
        >
          View →
        </Link>
      </div>
    </div>
  );
}
