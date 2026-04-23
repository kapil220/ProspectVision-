"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Calendar,
  Check,
  FileText,
  Mail,
  Phone,
} from "lucide-react";
import { PostcardPreviewModal } from "@/components/scan/PostcardPreviewModal";
import { toast } from "sonner";
import { PageContainer } from "@/components/ui/PageContainer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GoogleAttribution } from "@/components/ui/GoogleAttribution";
import { cn, formatCurrency, formatRelative } from "@/lib/utils";
import { CRM_STAGES, CRM_STAGE_MAP } from "@/lib/crm-stages";
import type { CRMStage, Lead, LeadActivity, Property } from "@/types";
import { WonModal, LostModal } from "./WonLostModals";

type Props = {
  lead: Lead & { property: Property };
  activities: LeadActivity[];
};

const CALL_OUTCOMES = [
  { value: "connected", label: "Connected" },
  { value: "voicemail", label: "Voicemail" },
  { value: "no_answer", label: "No answer" },
  { value: "appointment_set", label: "Appointment set" },
  { value: "not_interested", label: "Not interested" },
];

export function LeadDetailClient({ lead: initial, activities: initialActivities }: Props) {
  const router = useRouter();
  const [lead, setLead] = useState(initial);
  const [activities, setActivities] = useState(initialActivities);
  const [view, setView] = useState<"before" | "after">("after");

  const [note, setNote] = useState("");
  const [callDuration, setCallDuration] = useState("");
  const [callOutcome, setCallOutcome] = useState(CALL_OUTCOMES[0]!.value);
  const [callSummary, setCallSummary] = useState("");
  const [followUp, setFollowUp] = useState(lead.follow_up_date ?? "");
  const [quote, setQuote] = useState(lead.quote_amount?.toString() ?? "");
  const [closeDate, setCloseDate] = useState(lead.expected_close_date ?? "");
  const [wonOpen, setWonOpen] = useState(false);
  const [lostOpen, setLostOpen] = useState(false);
  const [postcardOpen, setPostcardOpen] = useState(false);

  const p = lead.property;
  const stageIdx = CRM_STAGES.findIndex((s) => s.id === lead.current_stage);
  const stageCfg = CRM_STAGE_MAP[lead.current_stage];
  const nextStage: CRMStage | null =
    stageIdx >= 0 && stageIdx < CRM_STAGES.length - 2 ? CRM_STAGES[stageIdx + 1]!.id : null;

  async function patch(body: Record<string, unknown>) {
    const res = await fetch("/api/crm", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lead_id: lead.id, ...body }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error ?? "Update failed");
  }


  async function handleAdvance() {
    if (!nextStage) return;
    if (nextStage === "closed_won") {
      setWonOpen(true);
      return;
    }
    try {
      await patch({ new_stage: nextStage });
      setLead({ ...lead, current_stage: nextStage });
      toast.success(`Moved to ${CRM_STAGE_MAP[nextStage].label}`);
      router.refresh();
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  async function submitNote() {
    if (!note.trim()) return;
    try {
      await patch({ note });
      toast.success("Note added");
      setNote("");
      router.refresh();
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  async function submitCall() {
    const d = Number(callDuration);
    if (!d || d < 0) return toast.error("Enter a duration");
    try {
      await patch({ call_log: { duration: d, outcome: callOutcome, notes: callSummary } });
      toast.success("Call logged");
      setCallDuration("");
      setCallSummary("");
      router.refresh();
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  async function submitFollowUp() {
    try {
      await patch({ follow_up_date: followUp || null });
      setLead({ ...lead, follow_up_date: followUp || null });
      toast.success("Follow-up saved");
      router.refresh();
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  async function saveDeal() {
    try {
      const q = quote ? Number(quote) : undefined;
      await patch({
        ...(q !== undefined ? { quote_amount: q } : {}),
        expected_close_date: closeDate || null,
      });
      setLead({ ...lead, quote_amount: q ?? lead.quote_amount, expected_close_date: closeDate || null });
      toast.success("Deal info saved");
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  // Local activity feed: append optimistically so recent adds show without full refresh
  const mergedActivities = activities;

  const before = p.satellite_url ?? p.streetview_url ?? "";
  const after = p.render_url;

  return (
    <PageContainer className="max-w-7xl">
      <Link href="/crm" className="mb-4 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-900">
        <ArrowLeft className="h-4 w-4" /> Back to pipeline
      </Link>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <section className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="relative aspect-video overflow-hidden rounded-xl bg-slate-100">
              {after ? (
                <div className="absolute right-3 top-3 z-10 flex gap-1 rounded-full bg-white/90 p-0.5 shadow">
                  <button
                    onClick={() => setView("before")}
                    className={cn(
                      "rounded-full px-3 py-1 text-xs font-medium",
                      view === "before" ? "bg-slate-900 text-white" : "text-slate-600",
                    )}
                  >
                    Before
                  </button>
                  <button
                    onClick={() => setView("after")}
                    className={cn(
                      "rounded-full px-3 py-1 text-xs font-medium",
                      view === "after" ? "bg-brand text-white" : "text-slate-600",
                    )}
                  >
                    After
                  </button>
                </div>
              ) : null}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={view === "after" && after ? after : before} alt="" className="h-full w-full object-cover" />
              <GoogleAttribution />
            </div>
            <div className="mt-4 flex flex-col gap-1">
              <p className="font-display text-lg font-semibold text-slate-900">{p.address}</p>
              <p className="text-sm text-slate-500">
                {p.city}, {p.state} {p.zip}
              </p>
            </div>
            <div className="mt-3 flex flex-wrap gap-2 text-xs">
              {p.build_year ? <Pill>Built {p.build_year}</Pill> : null}
              {p.lot_size_sqft ? <Pill>{p.lot_size_sqft.toLocaleString()} sqft</Pill> : null}
              {p.estimated_value ? <Pill>Value {formatCurrency(p.estimated_value, true)}</Pill> : null}
              {typeof p.upgrade_score === "number" ? <Pill>Score {p.upgrade_score}</Pill> : null}
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5">
            <h2 className="mb-4 font-display text-sm font-semibold uppercase tracking-wide text-slate-500">
              Stage tracker
            </h2>
            <div className="flex items-center gap-1 overflow-x-auto pb-1">
              {CRM_STAGES.map((s, i) => {
                const filled = i < stageIdx;
                const current = i === stageIdx;
                return (
                  <div key={s.id} className="flex flex-1 min-w-[90px] flex-col items-center">
                    <div
                      className={cn(
                        "relative flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-semibold",
                        current
                          ? "bg-brand text-white shadow-[0_0_0_4px_rgba(99,102,241,0.2)]"
                          : filled
                            ? "bg-brand text-white"
                            : "bg-slate-100 text-slate-400",
                      )}
                      style={current ? { background: s.color } : undefined}
                    >
                      {filled ? <Check className="h-3.5 w-3.5" /> : i + 1}
                      {current ? (
                        <span
                          className="absolute inset-0 animate-ping rounded-full opacity-40"
                          style={{ background: s.color }}
                        />
                      ) : null}
                    </div>
                    <span
                      className={cn(
                        "mt-1 text-center text-[10px] leading-tight",
                        current ? "font-semibold text-slate-900" : "text-slate-400",
                      )}
                    >
                      {s.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5">
            <h2 className="mb-4 font-display text-sm font-semibold uppercase tracking-wide text-slate-500">
              Add activity
            </h2>
            <Tabs defaultValue="note">
              <TabsList>
                <TabsTrigger value="note">Note</TabsTrigger>
                <TabsTrigger value="call">Call log</TabsTrigger>
                <TabsTrigger value="follow">Follow-up</TabsTrigger>
              </TabsList>
              <TabsContent value="note" className="mt-4 space-y-2">
                <textarea
                  rows={3}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="What happened?"
                  className="w-full rounded-md border border-slate-200 p-3 text-sm"
                />
                <Button onClick={submitNote} size="sm">Save note</Button>
              </TabsContent>
              <TabsContent value="call" className="mt-4 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Duration (min)</Label>
                    <Input
                      type="number"
                      min={0}
                      value={callDuration}
                      onChange={(e) => setCallDuration(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Outcome</Label>
                    <select
                      value={callOutcome}
                      onChange={(e) => setCallOutcome(e.target.value)}
                      className="h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-sm"
                    >
                      {CALL_OUTCOMES.map((o) => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <Label>Summary (optional)</Label>
                  <textarea
                    rows={2}
                    value={callSummary}
                    onChange={(e) => setCallSummary(e.target.value)}
                    className="w-full rounded-md border border-slate-200 p-3 text-sm"
                  />
                </div>
                <Button onClick={submitCall} size="sm">Log call</Button>
              </TabsContent>
              <TabsContent value="follow" className="mt-4 space-y-3">
                <div>
                  <Label>Follow-up date</Label>
                  <Input
                    type="date"
                    value={followUp?.slice(0, 10) ?? ""}
                    onChange={(e) => setFollowUp(e.target.value)}
                  />
                </div>
                <Button onClick={submitFollowUp} size="sm">Save follow-up</Button>
              </TabsContent>
            </Tabs>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5">
            <h2 className="mb-4 font-display text-sm font-semibold uppercase tracking-wide text-slate-500">
              Activity timeline
            </h2>
            {mergedActivities.length === 0 ? (
              <p className="text-sm text-slate-400">No activity yet.</p>
            ) : (
              <ul className="space-y-4">
                {mergedActivities.map((a) => (
                  <li key={a.id} className="flex gap-3">
                    <div className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-100">
                      {a.activity_type === "call_logged" ? (
                        <Phone className="h-3.5 w-3.5 text-slate-600" />
                      ) : a.activity_type === "follow_up_set" ? (
                        <Calendar className="h-3.5 w-3.5 text-slate-600" />
                      ) : a.activity_type === "stage_change" ? (
                        <ArrowRight className="h-3.5 w-3.5 text-slate-600" />
                      ) : (
                        <FileText className="h-3.5 w-3.5 text-slate-600" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-slate-900">{a.description ?? a.activity_type}</p>
                      <p className="text-xs text-slate-400">{formatRelative(a.created_at)}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <div className="space-y-6 lg:col-span-1">
          <section className="rounded-2xl border border-slate-200 bg-white p-5">
            <h2 className="mb-3 font-display text-sm font-semibold uppercase tracking-wide text-slate-500">
              Deal
            </h2>
            <span
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold"
              style={{ background: stageCfg.bg, color: stageCfg.color }}
            >
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: stageCfg.color }} />
              {stageCfg.label}
            </span>
            {nextStage ? (
              <Button onClick={handleAdvance} className="mt-3 w-full">
                Move to {CRM_STAGE_MAP[nextStage].label} →
              </Button>
            ) : null}
            <div className="mt-4 space-y-3">
              <div>
                <Label>Quote amount (USD)</Label>
                <Input type="number" value={quote} onChange={(e) => setQuote(e.target.value)} />
              </div>
              <div>
                <Label>Expected close date</Label>
                <Input type="date" value={closeDate?.slice(0, 10) ?? ""} onChange={(e) => setCloseDate(e.target.value)} />
              </div>
              <Button size="sm" variant="outline" onClick={saveDeal} className="w-full">
                Save deal info
              </Button>
            </div>
            <div className="mt-4 flex flex-col gap-2">
              <Button variant="outline" size="sm" onClick={() => setWonOpen(true)}>
                Mark as won
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setLostOpen(true)}>
                Mark as lost
              </Button>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5">
            <h2 className="mb-3 font-display text-sm font-semibold uppercase tracking-wide text-slate-500">
              Owner
            </h2>
            <p className="text-sm font-semibold text-slate-900">
              {[p.owner_first, p.owner_last].filter(Boolean).join(" ") || "Unknown"}
            </p>
            <p className="mt-1 text-sm text-slate-500">
              {p.address}
              <br />
              {p.city}, {p.state} {p.zip}
            </p>
            {p.estimated_value ? (
              <p className="mt-2 text-xs text-slate-500">
                Est. value: {formatCurrency(p.estimated_value, true)}
              </p>
            ) : null}
            {p.qr_code_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={p.qr_code_url} alt="QR" className="mt-3 h-16 w-16 rounded border border-slate-200" />
            ) : null}
            <p className="mt-2 text-xs text-slate-500">Page views: {p.page_views}</p>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5">
            <h2 className="mb-3 font-display text-sm font-semibold uppercase tracking-wide text-slate-500">
              Postcard
            </h2>
            <p className="text-xs text-slate-500">Lob status</p>
            <p className="text-sm font-medium text-slate-900">{p.lob_status}</p>
            {p.lob_expected_delivery ? (
              <>
                <p className="mt-3 text-xs text-slate-500">Expected delivery</p>
                <p className="text-sm font-medium text-slate-900">
                  {new Date(p.lob_expected_delivery).toLocaleDateString()}
                </p>
              </>
            ) : null}
            {p.lob_postcard_id ? (
              <p className="mt-3 text-xs text-slate-400">Tracking ID: {p.lob_postcard_id}</p>
            ) : null}
            <button
              type="button"
              onClick={() => setPostcardOpen(true)}
              className="mt-4 inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:border-brand hover:text-brand"
            >
              <Mail className="h-3.5 w-3.5" strokeWidth={2} />
              View postcard
            </button>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5">
            <h2 className="mb-3 font-display text-sm font-semibold uppercase tracking-wide text-slate-500">
              Quick actions
            </h2>
            <div className="flex flex-col gap-2">
              {lead.current_stage === "responded" || lead.current_stage === "page_viewed" ? (
                <Button size="sm" onClick={() => patch({ new_stage: "appointment_set" }).then(() => router.refresh())}>
                  Book appointment
                </Button>
              ) : null}
              {lead.current_stage === "appointment_set" ? (
                <Button size="sm" onClick={() => patch({ new_stage: "quoted" }).then(() => router.refresh())}>
                  Send quote
                </Button>
              ) : null}
            </div>
          </section>
        </div>
      </div>

      <WonModal
        open={wonOpen}
        onClose={() => setWonOpen(false)}
        onConfirm={async (deal_value) => {
          await patch({ new_stage: "closed_won", deal_value });
          router.refresh();
        }}
      />
      <LostModal
        open={lostOpen}
        onClose={() => setLostOpen(false)}
        onConfirm={async (loss_reason) => {
          await patch({ new_stage: "closed_lost", loss_reason });
          router.refresh();
        }}
      />
      {postcardOpen ? (
        <PostcardPreviewModal
          propertyId={p.id}
          address={`${p.address}, ${p.city} ${p.state}`}
          onClose={() => setPostcardOpen(false)}
        />
      ) : null}
    </PageContainer>
  );
}

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
      {children}
    </span>
  );
}
