import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CheckCircle } from "lucide-react";
import { createServiceClient } from "@/lib/supabase/service";
import { getNicheOrThrow } from "@/lib/niches";
import { formatCurrency } from "@/lib/utils";
import { BeforeAfter } from "@/components/landing/BeforeAfter";
import { OptOutButton } from "@/components/landing/OptOutButton";
import type { NicheId, Profile, Property } from "@/types";

export const dynamic = "force-dynamic";

type PageProps = { params: { slug: string } };

type LeadRow = { id: string; current_stage: string; profile_id: string };
type PropertyWithLeads = Property & { leads?: LeadRow[] };

async function loadData(slug: string) {
  const service = createServiceClient();
  const { data: property } = await service
    .from("properties")
    .select("*, leads(id,current_stage,profile_id)")
    .eq("landing_slug", slug)
    .maybeSingle();

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
  };
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

  const { property, contractor } = data;
  const niche = getNicheOrThrow((contractor.niche || "landscaping") as NicheId);
  const service = createServiceClient();

  // Fire-and-forget view increment.
  service
    .from("properties")
    .update({ page_views: (property.page_views ?? 0) + 1 })
    .eq("id", property.id)
    .then(() => {}, () => {});

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
    <div className="min-h-screen bg-slate-50 pb-16">
      {/* ── Sticky header ── */}
      <header className="sticky top-0 z-10 flex h-14 items-center justify-between border-b border-slate-200 bg-white/95 px-5 shadow-sm backdrop-blur-sm">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand text-xs font-bold tracking-wide text-white shadow-sm">
            PV
          </div>
          <span className="font-display text-sm font-semibold text-slate-900">
            ProspectVision
          </span>
        </div>
        <span className="max-w-[160px] truncate text-sm font-medium text-slate-600">
          {contractor.company_name}
        </span>
      </header>

      <main className="mx-auto max-w-2xl">
        {/* ── Hero headline ── */}
        <section className="px-5 pb-1 pt-9">
          <h1 className="font-display text-[28px] font-bold leading-[1.2] tracking-tight text-slate-900">
            {headline}
          </h1>
          <p className="mt-2.5 text-[15px] leading-relaxed text-slate-500">
            {niche.landing_hero}
          </p>
        </section>

        {/* ── Before / After slider ── */}
        <section className="mt-6 px-0 sm:px-5">
          <BeforeAfter before={hero} after={property.render_url} />
          <p className="mt-2.5 px-5 text-center text-xs leading-snug text-slate-400">
            📷 AI-generated rendering for illustration only — not a photo of completed work
          </p>
          <p className="mt-1 px-5 text-center text-[10px] text-slate-300">
            Base imagery © Google · Map data © Google
          </p>
        </section>

        {/* ── ROI card ── */}
        {property.roi_estimate_low !== null && property.roi_estimate_high !== null ? (
          <section className="mx-5 mt-6 rounded-2xl border border-brand/20 bg-white p-6 shadow-card">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-brand/70">
              Estimated value this adds to your home
            </p>
            <p className="mt-2 font-display text-4xl font-bold leading-none text-brand">
              {formatCurrency(property.roi_estimate_low, true)}
              <span className="mx-1 text-slate-400">–</span>
              {formatCurrency(property.roi_estimate_high, true)}
            </p>
            <p className="mt-2 text-sm text-slate-600">{niche.roi_note}</p>
            <p className="mt-4 border-t border-slate-100 pt-3 text-[11px] leading-relaxed text-slate-400">
              Estimated values based on national averages. Actual results may vary based on
              property condition, market, and project scope selected.
            </p>
          </section>
        ) : null}

        {/* ── CTA section ── */}
        <section className="mx-5 mt-8">
          <h2 className="font-display text-xl font-bold text-slate-900">
            Ready to get started?
          </h2>
          <p className="mt-1.5 text-sm text-slate-500">
            Free consultation &middot; No commitment &middot; Licensed &amp; insured
          </p>
          <div className="mt-5 flex flex-col gap-3">
            {contractor.phone ? (
              <a
                href={`tel:${contractor.phone}`}
                className="flex h-13 w-full items-center justify-center rounded-xl bg-brand text-[15px] font-semibold text-white shadow-card transition-all hover:bg-brand-dark hover:shadow-hover active:scale-[0.98]"
              >
                📞 Call {contractor.company_name}
              </a>
            ) : null}
            <a
              href={
                contractor.email
                  ? `mailto:${contractor.email}?subject=Quote%20request%20for%20${encodeURIComponent(
                      property.address,
                    )}`
                  : "#"
              }
              className="flex h-13 w-full items-center justify-center rounded-xl border-2 border-brand bg-white text-[15px] font-semibold text-brand transition-all hover:bg-brand-light hover:shadow-hover active:scale-[0.98]"
            >
              ✉️ Request a Quote
            </a>
          </div>
          {/* Trust micro-copy */}
          <p className="mt-3 text-center text-[11px] text-slate-400">
            {contractor.company_name} serves{" "}
            {contractor.return_city && contractor.return_state
              ? `${contractor.return_city}, ${contractor.return_state}`
              : "your area"}
          </p>
        </section>

        {/* ── Benefits list ── */}
        <section className="mx-5 mt-9">
          <h3 className="font-display text-lg font-bold text-slate-900">
            Why {niche.label.toLowerCase()} makes sense right now
          </h3>
          <ul className="mt-4 space-y-3.5">
            {niche.landing_benefits.slice(0, 3).map((b) => (
              <li key={b} className="flex items-start gap-3 rounded-xl bg-white p-4 shadow-card">
                <CheckCircle
                  className="mt-0.5 h-5 w-5 shrink-0 text-brand"
                  strokeWidth={2}
                />
                <span className="text-sm leading-snug text-slate-700">{b}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* ── Footer / opt-out ── */}
        <footer className="mx-5 mt-12 border-t border-slate-200 pt-6">
          <p className="text-xs leading-relaxed text-slate-400">
            You received this postcard because your property address is publicly available
            in county property records. This mailing was sent by{" "}
            <strong className="font-medium text-slate-500">{contractor.company_name}</strong>{" "}
            using ProspectVision, a direct mail platform. Your address was sourced only from
            public property records — no private or financial data was used.
          </p>
          <OptOutButton
            slug={params.slug}
            company={contractor.company_name}
          />
          <p className="mt-5 text-[10px] text-slate-300">Powered by ProspectVision</p>
        </footer>
      </main>
    </div>
  );
}
