"use client";

import { useMemo, useState } from "react";
import {
  DndContext,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { toast } from "sonner";
import { PageContainer } from "@/components/ui/PageContainer";
import { Input } from "@/components/ui/input";
import { cn, formatCurrency } from "@/lib/utils";
import { CRM_STAGES } from "@/lib/crm-stages";
import type { CRMStage, LossReason } from "@/types";
import type { LeadWithProperty } from "@/app/(dashboard)/crm/page";
import { KanbanColumn } from "./KanbanColumn";
import { WonModal, LostModal } from "./WonLostModals";

const FILTERS = [
  { id: "all", label: "All" },
  { id: "hot", label: "🔥 Hot" },
  { id: "overdue", label: "Overdue follow-up" },
  { id: "week", label: "This week" },
] as const;

type Filter = (typeof FILTERS)[number]["id"];

export function CRMClient({ leads: initial }: { leads: LeadWithProperty[] }) {
  const [leads, setLeads] = useState(initial);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [wonModal, setWonModal] = useState<string | null>(null);
  const [lostModal, setLostModal] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor),
  );

  const grouped = useMemo(() => {
    const filtered = leads.filter((l) => {
      if (search) {
        const s = search.toLowerCase();
        const hay = `${l.property?.address ?? ""} ${l.property?.owner_first ?? ""} ${l.property?.owner_last ?? ""}`.toLowerCase();
        if (!hay.includes(s)) return false;
      }
      if (filter === "hot") {
        const hot = ["responded", "appointment_set", "quoted"];
        return hot.includes(l.current_stage);
      }
      if (filter === "overdue") {
        return !!l.follow_up_date && new Date(l.follow_up_date) <= new Date();
      }
      if (filter === "week") {
        const d = new Date();
        d.setDate(d.getDate() + 7);
        return !!l.follow_up_date && new Date(l.follow_up_date) <= d;
      }
      return true;
    });

    const map = new Map<CRMStage, LeadWithProperty[]>();
    for (const s of CRM_STAGES) map.set(s.id, []);
    for (const l of filtered) map.get(l.current_stage)?.push(l);
    return map;
  }, [leads, search, filter]);

  const pipelineTotal = useMemo(
    () =>
      leads
        .filter((l) => !["closed_won", "closed_lost"].includes(l.current_stage))
        .reduce((sum, l) => sum + (l.quote_amount ?? 0), 0),
    [leads],
  );

  async function patchStage(leadId: string, newStage: CRMStage, extra: Record<string, unknown> = {}) {
    const prev = leads;
    setLeads((ls) => ls.map((l) => (l.id === leadId ? { ...l, current_stage: newStage } : l)));
    try {
      const res = await fetch("/api/crm", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lead_id: leadId, new_stage: newStage, ...extra }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Update failed");
    } catch (e) {
      setLeads(prev);
      toast.error((e as Error).message);
    }
  }

  function handleDragEnd(e: DragEndEvent) {
    const leadId = String(e.active.id);
    const target = e.over?.id;
    if (!target) return;
    const newStage = String(target) as CRMStage;
    const lead = leads.find((l) => l.id === leadId);
    if (!lead || lead.current_stage === newStage) return;

    if (newStage === "closed_won") {
      setWonModal(leadId);
      return;
    }
    if (newStage === "closed_lost") {
      setLostModal(leadId);
      return;
    }
    void patchStage(leadId, newStage);
  }

  return (
    <PageContainer className="max-w-none">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold text-slate-900">CRM Pipeline</h1>
          <p className="mt-1 text-sm text-slate-500">
            {leads.length} leads · {formatCurrency(pipelineTotal, true)} pipeline
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Input
            placeholder="Search address or owner…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 w-64"
          />
          <div className="flex gap-1.5">
            {FILTERS.map((f) => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                className={cn(
                  "rounded-full px-3 py-1 text-xs font-medium transition-colors",
                  filter === f.id
                    ? "bg-brand text-white"
                    : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50",
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {initial.length === 0 ? (
        <div className="flex min-h-[50vh] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white/60 p-12 text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand/10 text-2xl">
            📮
          </div>
          <h2 className="font-display text-xl font-semibold text-slate-900">
            No leads in your pipeline yet
          </h2>
          <p className="mt-2 max-w-sm text-sm text-slate-500">
            Every postcard you mail creates a lead here. Start a scan to find
            properties and queue up your first batch.
          </p>
          <a
            href="/scan"
            className="mt-5 inline-flex h-10 items-center rounded-xl bg-brand px-5 text-sm font-semibold text-white shadow-card transition-colors hover:bg-brand-dark"
          >
            Start a scan
          </a>
        </div>
      ) : (
        <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
          <div className="flex min-h-[calc(100vh-200px)] gap-4 overflow-x-auto pb-6">
            {CRM_STAGES.map((s) => (
              <KanbanColumn key={s.id} stage={s} leads={grouped.get(s.id) ?? []} />
            ))}
          </div>
        </DndContext>
      )}

      <WonModal
        open={wonModal !== null}
        onClose={() => setWonModal(null)}
        onConfirm={async (deal_value) => {
          if (wonModal) await patchStage(wonModal, "closed_won", { deal_value });
        }}
      />
      <LostModal
        open={lostModal !== null}
        onClose={() => setLostModal(null)}
        onConfirm={async (loss_reason: LossReason) => {
          if (lostModal) await patchStage(lostModal, "closed_lost", { loss_reason });
        }}
      />
    </PageContainer>
  );
}
