import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CheckCircle } from "lucide-react";
import { createServiceClient } from "@/lib/supabase/service";
import { getNicheOrThrow } from "@/lib/niches";
import { formatCurrency } from "@/lib/utils";
import { BeforeAfter } from "@/components/landing/BeforeAfter";
import { OptOutButton } from "@/components/landing/OptOutButton";
import { headers } from "next/headers";
import crypto from "node:crypto";
import type { NicheId, Profile, Property } from "@/types";

export const dynamic = "force-dynamic";

type PageProps = { params: { slug: string } };

type LeadRow = { id: string; current_stage: string; profile_id: string };
type PropertyWithLeads = Property & { leads?: LeadRow[] };

async function loadData(slug: string) {
  const service = createServiceClient();

  // Prefer the new postcards table; fall back to legacy properties.landing_slug.
  const { data: postcard } = await service
    .from("postcards")
    .select("id, property_id, landing_page_views, first_viewed_at")
    .eq("landing_page_slug", slug)
    .maybeSingle();

  let propertyQuery = service
    .from("properties")
    .select("*, leads(id,current_stage,profile_id)");

  if (postcard?.property_id) {
    propertyQuery = propertyQuery.eq("id", postcard.property_id);
  } else {
    propertyQuery = propertyQuery.eq("landing_slug", slug);
  }

  const { data: property } = await propertyQuery.maybeSingle();
  if (!property) return null;

  const { data: contractor } = await service
    .from("profiles")
    .select("company_name, phone, website, return_city, return_state, niche, email")
    .eq("id", property.profile_id)
    .single();

  return {
    property: property as PropertyWithLeads,
    contractor: contractor as Pick<
      Profile,
      "company_name" | "phone" | "website" | "return_city" | "return_state" | "niche" | "email"
    >,
    postcard: postcard
      ? {
          id: postcard.id as string,
          views: (postcard.landing_page_views as number | null) ?? 0,
          first_viewed_at: postcard.first_viewed_at as string | null,
        }
      : null,
  };
}

function hashIp(ip: string | null): string | null {
  if (!ip) return null;
  const salt = process.env.LANDING_IP_SALT ?? "prospectvision";
  return crypto.createHash("sha256").update(`${salt}:${ip}`).digest("hex").slice(0, 32);
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const data = await loadData(params.slug);
  if (!data) return { title: "Not found", robots: "noindex" };
  const niche = getNicheOrThrow(data.contractor.niche || "landscaping");
  return {
    title: `Your ${niche.label} Preview | ${data.contractor.company_name}`,
    description: niche.landing_hero,
    openGraph: {
      images: data.property.render_url ? [{ url: data.property.render_url }] : undefined,
    },
    robots: "noindex",
  };
}

export default async function LandingPage({ params }: PageProps) {
  const data = await loadData(params.slug);
  if (!data) notFound();

  const { property, contractor, postcard } = data;
  const niche = getNicheOrThrow((contractor.niche || "landscaping") as NicheId);
  const service = createServiceClient();

  const hdrs = headers();
  const ip =
    hdrs.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    hdrs.get("x-real-ip") ??
    null;
  const ua = hdrs.get("user-agent");
  const ref = hdrs.get("referer");
  const now = new Date().toISOString();

  // Increment legacy properties counter (for existing Kanban UI).
  service
    .from("properties")
    .update({ page_views: (property.page_views ?? 0) + 1 })
    .eq("id", property.id)
    .then(
      () => {},
      () => {},
    );

  // Postcard-level view tracking (new).
  if (postcard) {
    service
      .from("postcards")
      .update({
        landing_page_views: postcard.views + 1,
        first_viewed_at: postcard.first_viewed_at ?? now,
        last_viewed_at: now,
      })
      .eq("id", postcard.id)
      .then(
        () => {},
        () => {},
      );
    service
      .from("landing_page_views")
      .insert({
        postcard_id: postcard.id,
        ip_hash: hashIp(ip),
        user_agent: ua,
        referrer: ref,
      })
      .then(
        () => {},
        () => {},
      );
  }

  // Auto-advance lead: postcard_sent | delivered → page_viewed
  const lead = property.leads?.[0];
  if (lead && ["postcard_sent", "delivered"].includes(lead.current_stage)) {
    await Promise.all([
      service.from("leads").update({ current_stage: "page_viewed" }).eq("id", lead.id),
      service.from("lead_activities").insert({
        lead_id: lead.id,
        activity_type: "stage_change",
        description: "Homeowner scanned QR code and viewed landing page",
        metadata: { from_stage: lead.current_stage, to_stage: "page_viewed" },
      }),
      service.from("conversion_events").insert({
        property_id: property.id,
        profile_id: property.profile_id,
        from_stage: lead.current_stage,
        to_stage: "page_viewed",
      }),
    ]);
  }

  const headline = property.owner_first
    ? `Hi ${property.owner_first}, here's what your home could look like`
    : `Here's what this property could look like with professional ${niche.label.toLowerCase()}`;

  const hero = property.satellite_url ?? property.streetview_url ?? "";

  return (
    <div className="min-h-screen bg-ivory text-ink">
      <header className="sticky top-0 z-20 border-b border-line/60 bg-ivory/85 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-5">
          <div className="flex items-center gap-2">
            <span className="grid h-7 w-7 place-items-center rounded-full bg-ink text-ivory">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /><path d="M12 3v18M3 12h18" /></svg>
            </span>
            <span className="font-display text-sm font-semibold">ProspectVision</span>
          </div>
          <span className="max-w-[180px] truncate text-xs font-medium uppercase tracking-[0.18em] text-ink-soft">
            {contractor.company_name}
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-5 pb-20">
        <section className="pb-2 pt-12">
          <p className="num text-[11px] uppercase tracking-[0.22em] text-ink-muted">
            A preview for {property.address}
          </p>
          <h1 className="mt-4 display text-display-md font-medium leading-[1.05] tracking-tight">
            {headline}
            <span className="display-italic text-emerald">.</span>
          </h1>
          <p className="mt-4 max-w-xl text-base leading-relaxed text-ink-soft">
            {niche.landing_hero}
          </p>
        </section>

        <section className="mt-10">
          <div className="overflow-hidden rounded-3xl bg-paper shadow-editorial">
            <BeforeAfter before={hero} after={property.render_url} />
          </div>
          <div className="mt-3 flex items-center justify-between text-[11px] uppercase tracking-[0.18em] text-ink-muted">
            <span className="num">Drag to compare</span>
            <span className="num">AI rendering · for illustration</span>
          </div>
          <p className="mt-1 text-[10px] text-ink-muted">Base imagery © Google · Map data © Google</p>
        </section>

        {property.roi_estimate_low !== null && property.roi_estimate_high !== null ? (
          <section className="mt-12 overflow-hidden rounded-3xl bg-ink p-8 text-ivory shadow-editorial">
            <p className="num text-[11px] uppercase tracking-[0.22em] text-ivory/70">
              Estimated value lift on your home
            </p>
            <p className="mt-4 num display text-display-md font-medium leading-none text-ochre">
              {formatCurrency(property.roi_estimate_low, true)}
              <span className="mx-2 text-ivory/40">–</span>
              {formatCurrency(property.roi_estimate_high, true)}
            </p>
            <p className="mt-4 max-w-xl text-sm text-ivory/80">{niche.roi_note}</p>
            <p className="mt-6 border-t border-ivory/15 pt-4 text-[11px] leading-relaxed text-ivory/55">
              Estimated values based on national averages. Actual results may vary based on
              property condition, market, and project scope selected.
            </p>
          </section>
        ) : null}

        <section className="mt-12">
          <h2 className="display text-3xl font-medium tracking-tight">
            Ready to <span className="display-italic text-emerald">get started?</span>
          </h2>
          <p className="mt-2 text-sm text-ink-soft">
            Free consultation · No commitment · Licensed & insured
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            {contractor.phone ? (
              <a
                href={`tel:${contractor.phone}`}
                className="flex h-14 flex-1 items-center justify-center rounded-full bg-ink text-base font-medium text-ivory transition-colors hover:bg-emerald active:scale-[0.99]"
              >
                Call {contractor.company_name}
              </a>
            ) : null}
            <a
              href={
                contractor.email
                  ? `mailto:${contractor.email}?subject=Quote%20request%20for%20${encodeURIComponent(property.address)}`
                  : "#"
              }
              className="flex h-14 flex-1 items-center justify-center rounded-full border border-ink bg-ivory text-base font-medium text-ink transition-colors hover:bg-paper active:scale-[0.99]"
            >
              Request a quote
            </a>
          </div>
          <p className="mt-3 text-center text-[11px] text-ink-muted">
            {contractor.company_name} serves{" "}
            {contractor.return_city && contractor.return_state
              ? `${contractor.return_city}, ${contractor.return_state}`
              : "your area"}
          </p>
        </section>

        <section className="mt-14">
          <p className="num text-[11px] uppercase tracking-[0.22em] text-ink-muted">
            Why {niche.label.toLowerCase()}, why now
          </p>
          <ul className="mt-5 grid gap-3 sm:grid-cols-3">
            {niche.landing_benefits.slice(0, 3).map((b) => (
              <li key={b} className="rounded-2xl border border-line bg-ivory-50 p-5">
                <span className="grid h-8 w-8 place-items-center rounded-full bg-emerald/10 text-emerald">
                  <CheckCircle className="h-4 w-4" strokeWidth={2.2} />
                </span>
                <p className="mt-3 text-sm leading-snug text-ink">{b}</p>
              </li>
            ))}
          </ul>
        </section>

        <footer className="mt-14 border-t border-line pt-8">
          <p className="text-xs leading-relaxed text-ink-muted">
            You received this postcard because your property address is publicly available
            in county property records. This mailing was sent by{" "}
            <strong className="font-medium text-ink-soft">{contractor.company_name}</strong>{" "}
            using ProspectVision, a direct mail platform. Your address was sourced only from
            public property records — no private or financial data was used.
          </p>
          <OptOutButton slug={params.slug} company={contractor.company_name} />
          <p className="mt-6 num text-[10px] uppercase tracking-[0.22em] text-ink-muted">
            Powered by ProspectVision
          </p>
        </footer>
      </main>
    </div>
  );
}
