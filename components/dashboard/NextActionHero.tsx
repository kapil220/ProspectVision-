import Link from "next/link";
import { ArrowRight, ScanLine, Eye, Sparkles, Mail, Inbox } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { BatchProgress } from "@/components/scan/BatchProgress";
import { Reveal } from "@/components/motion/Reveal";
import type { BatchStatus, ScanBatch, Property } from "@/types";
import { getNiche } from "@/lib/niches";

const NON_TERMINAL: BatchStatus[] = ["queued", "scanning", "scoring", "rendering", "enriching"];

type State =
  | { kind: "empty" }
  | { kind: "active"; batch: ScanBatch }
  | { kind: "ready"; batch: ScanBatch; topProps: Property[] }
  | { kind: "mailed"; count: number; lastBatchId: string }
  | { kind: "replies"; count: number };

export async function NextActionHero({ userId }: { userId: string }) {
  const state = await loadState(userId);
  return <Render state={state} />;
}

async function loadState(userId: string): Promise<State> {
  const supabase = createClient();

  const { data: latestBatches } = await supabase
    .from("scan_batches")
    .select("*")
    .eq("profile_id", userId)
    .order("created_at", { ascending: false })
    .limit(5);

  if (!latestBatches || latestBatches.length === 0) {
    return { kind: "empty" };
  }

  const active = latestBatches.find((b) => NON_TERMINAL.includes(b.status as BatchStatus));
  if (active) return { kind: "active", batch: active as ScanBatch };

  // Look for replies (any lead with stage past "delivered")
  const { count: replyCount } = await supabase
    .from("leads")
    .select("id", { count: "exact", head: true })
    .eq("profile_id", userId)
    .in("current_stage", ["responded", "appointment_set", "quoted"]);

  if (replyCount && replyCount > 0) {
    return { kind: "replies", count: replyCount };
  }

  // Properties ready in newest ready batch?
  const ready = latestBatches.find((b) => b.status === "ready");
  if (ready) {
    const { data: topProps } = await supabase
      .from("properties")
      .select("*")
      .eq("batch_id", ready.id)
      .eq("profile_id", userId)
      .eq("approved", false)
      .order("upgrade_score", { ascending: false })
      .limit(3);

    const { count: unmailed } = await supabase
      .from("properties")
      .select("id", { count: "exact", head: true })
      .eq("batch_id", ready.id)
      .eq("profile_id", userId)
      .neq("lob_status", "mailed");

    if (unmailed && unmailed > 0) {
      return { kind: "ready", batch: ready as ScanBatch, topProps: (topProps ?? []) as Property[] };
    }
  }

  // Mailed but no replies yet
  const { count: mailedCount } = await supabase
    .from("leads")
    .select("id", { count: "exact", head: true })
    .eq("profile_id", userId)
    .in("current_stage", ["postcard_sent", "delivered", "page_viewed"]);

  if (mailedCount && mailedCount > 0) {
    return { kind: "mailed", count: mailedCount, lastBatchId: latestBatches[0].id };
  }

  // Fallback: empty
  return { kind: "empty" };
}

function Render({ state }: { state: State }) {
  switch (state.kind) {
    case "empty":
      return <EmptyHero />;
    case "active":
      return <ActiveHero batch={state.batch} />;
    case "ready":
      return <ReadyHero batch={state.batch} topProps={state.topProps} />;
    case "mailed":
      return <MailedHero count={state.count} lastBatchId={state.lastBatchId} />;
    case "replies":
      return <RepliesHero count={state.count} />;
  }
}

const STEPS = [
  { icon: ScanLine, label: "Scan", body: "Pull every parcel in a ZIP." },
  { icon: Eye, label: "Score", body: "AI ranks by visible need." },
  { icon: Sparkles, label: "Render", body: "Generate the 'after' image." },
  { icon: Mail, label: "Mail", body: "Personalized postcards via Lob." },
];

function EmptyHero() {
  return (
    <Reveal>
      <div className="overflow-hidden rounded-3xl bg-ink p-8 text-ivory md:p-12">
        <div className="grid gap-10 lg:grid-cols-[1.2fr_1fr] lg:items-center">
          <div>
            <p className="num text-[11px] uppercase tracking-[0.22em] text-ivory/60">Welcome</p>
            <h1 className="mt-3 display text-display-md font-medium leading-[1.05] tracking-tight">
              Run your first scan <span className="display-italic text-ochre">in 60 seconds.</span>
            </h1>
            <p className="mt-4 max-w-md text-base text-ivory/75">
              Drop a ZIP code, pick your niche. We&apos;ll surface every home that visibly needs your service.
            </p>
            <Link
              href="/scan"
              className="mt-7 inline-flex items-center gap-2 rounded-full bg-ivory px-6 py-3 text-sm font-medium text-ink transition-colors hover:bg-ochre"
            >
              Start your first scan <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <ol className="grid grid-cols-2 gap-3">
            {STEPS.map((s, i) => (
              <Reveal key={s.label} delay={i * 0.08} as="li" className="rounded-2xl border border-ivory/10 bg-ivory/5 p-4">
                <s.icon className="h-4 w-4 text-ochre" />
                <div className="mt-3 num text-[10px] uppercase tracking-[0.22em] text-ivory/60">
                  Step {String(i + 1).padStart(2, "0")}
                </div>
                <div className="mt-1 font-display text-lg font-semibold tracking-tight">{s.label}</div>
                <p className="mt-1 text-xs text-ivory/65">{s.body}</p>
              </Reveal>
            ))}
          </ol>
        </div>
      </div>
    </Reveal>
  );
}

function ActiveHero({ batch }: { batch: ScanBatch }) {
  const niche = getNiche(batch.niche);
  return (
    <Reveal>
      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr] lg:items-stretch">
        <div className="rounded-3xl border border-line bg-ivory-50 p-6">
          <BatchProgress
            status={batch.status}
            progressPct={batch.progress_pct ?? 0}
            totalScanned={batch.total_scanned ?? 0}
            totalScored={batch.total_scored ?? 0}
            totalApproved={batch.total_approved ?? 0}
            errorMessage={batch.error_message ?? null}
            zipCodes={(batch.zip_codes ?? []) as string[]}
            niche={niche?.label}
            compact
          />
          <Link
            href={`/batches/${batch.id}`}
            className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-emerald link-underline"
          >
            Open batch <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        <div className="rounded-3xl bg-ink p-6 text-ivory">
          <p className="num text-[10px] uppercase tracking-[0.22em] text-ivory/60">In flight</p>
          <h2 className="mt-3 display text-2xl font-medium leading-tight tracking-tight">
            We&apos;ll ping you when it&apos;s ready to <span className="display-italic text-ochre">review.</span>
          </h2>
          <p className="mt-3 text-sm text-ivory/70">
            Average scan completes in 30–90 seconds depending on ZIP density.
          </p>
        </div>
      </div>
    </Reveal>
  );
}

function ReadyHero({ batch, topProps }: { batch: ScanBatch; topProps: Property[] }) {
  return (
    <Reveal>
      <div className="overflow-hidden rounded-3xl bg-emerald p-8 text-ivory md:p-10">
        <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <p className="num text-[10px] uppercase tracking-[0.22em] text-ivory/70">Ready to mail</p>
            <h1 className="mt-3 display text-display-md font-medium leading-[1.05] tracking-tight">
              {batch.total_approved ?? topProps.length} home{(batch.total_approved ?? topProps.length) === 1 ? "" : "s"}{" "}
              <span className="display-italic text-ochre">scored & rendered.</span>
            </h1>
            <p className="mt-4 max-w-md text-ivory/85">
              Pick the ones you want to send postcards to. We handle the print + USPS.
            </p>
            <Link
              href={`/batches/${batch.id}`}
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-ivory px-6 py-3 text-sm font-medium text-ink transition-colors hover:bg-ochre"
            >
              Review properties <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="hidden gap-3 lg:flex">
            {topProps.slice(0, 3).map((p, i) => (
              <div
                key={p.id}
                className="overflow-hidden rounded-2xl border border-ivory/15 bg-ivory/5 shadow-editorial"
                style={{ transform: `rotate(${(i - 1) * 2}deg)` }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={p.render_url ?? p.satellite_url ?? ""}
                  alt=""
                  className="h-32 w-44 object-cover"
                />
                <div className="px-2 py-1 text-[10px] num uppercase tracking-[0.18em] text-ivory/85">
                  Score {p.upgrade_score ?? "—"}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Reveal>
  );
}

function MailedHero({ count, lastBatchId }: { count: number; lastBatchId: string }) {
  return (
    <Reveal>
      <div className="overflow-hidden rounded-3xl border border-line bg-ivory-50 p-8 md:p-10">
        <div className="flex items-start justify-between gap-8">
          <div>
            <p className="num text-[10px] uppercase tracking-[0.22em] text-ink-muted">In the mail</p>
            <h1 className="mt-3 display text-display-md font-medium leading-[1.05] tracking-tight">
              {count} postcard{count === 1 ? "" : "s"} {" "}
              <span className="display-italic text-emerald">in flight.</span>
            </h1>
            <p className="mt-3 max-w-md text-base text-ink-soft">
              USPS first class · 3–5 business days. Track replies in your CRM as homeowners scan the QR.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href={`/crm`}
                className="inline-flex items-center gap-2 rounded-full bg-ink px-6 py-3 text-sm font-medium text-ivory transition-colors hover:bg-emerald"
              >
                Track in CRM <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href={`/batches/${lastBatchId}`}
                className="inline-flex items-center gap-2 rounded-full border border-line px-6 py-3 text-sm font-medium text-ink transition-colors hover:bg-paper"
              >
                View batch
              </Link>
            </div>
          </div>
          <div className="hidden h-24 w-24 shrink-0 place-items-center rounded-full bg-emerald/10 lg:grid">
            <Mail className="h-9 w-9 text-emerald" />
          </div>
        </div>
      </div>
    </Reveal>
  );
}

function RepliesHero({ count }: { count: number }) {
  return (
    <Reveal>
      <div className="overflow-hidden rounded-3xl bg-ochre p-8 text-ink md:p-10">
        <div className="flex items-start justify-between gap-8">
          <div>
            <p className="num text-[10px] uppercase tracking-[0.22em] text-ink/60">Hot leads</p>
            <h1 className="mt-3 display text-display-md font-medium leading-[1.05] tracking-tight">
              {count} homeowner{count === 1 ? "" : "s"}{" "}
              <span className="display-italic">replied.</span>
            </h1>
            <p className="mt-3 max-w-md text-base text-ink/75">
              Don&apos;t leave them hanging. Move fast — fresh leads close ~3× more often.
            </p>
            <Link
              href="/crm?filter=hot"
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-ink px-6 py-3 text-sm font-medium text-ivory transition-colors hover:bg-emerald"
            >
              Open hot leads <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="hidden h-24 w-24 shrink-0 place-items-center rounded-full bg-ink/10 lg:grid">
            <Inbox className="h-9 w-9 text-ink" />
          </div>
        </div>
      </div>
    </Reveal>
  );
}
