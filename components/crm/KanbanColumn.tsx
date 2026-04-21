"use client";

import { useDroppable } from "@dnd-kit/core";
import { cn } from "@/lib/utils";
import type { CRMStageConfig } from "@/lib/crm-stages";
import type { LeadWithProperty } from "@/app/(dashboard)/crm/page";
import { LeadCard } from "./LeadCard";

type Props = { stage: CRMStageConfig; leads: LeadWithProperty[] };

export function KanbanColumn({ stage, leads }: Props) {
  const { setNodeRef, isOver } = useDroppable({ id: stage.id });

  return (
    <div className="flex w-[272px] flex-shrink-0 flex-col">
      <div className="mb-2 flex items-center gap-2 px-2">
        <span className="h-2.5 w-2.5 rounded-full" style={{ background: stage.color }} />
        <span className="text-sm font-semibold text-slate-900">{stage.label}</span>
        <span className="ml-auto rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
          {leads.length}
        </span>
      </div>
      <div
        ref={setNodeRef}
        className={cn(
          "flex-1 space-y-2 rounded-xl p-2 transition-colors",
          isOver ? "border-2 border-dashed border-brand bg-brand-light" : "",
        )}
        style={!isOver ? { background: stage.bg } : undefined}
      >
        {leads.length === 0 ? (
          <p className="py-4 text-center text-[11px] text-slate-400">No leads</p>
        ) : (
          leads.map((lead) => <LeadCard key={lead.id} lead={lead} />)
        )}
      </div>
    </div>
  );
}
