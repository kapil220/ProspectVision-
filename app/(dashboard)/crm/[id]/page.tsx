import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LeadDetailClient } from "@/components/crm/LeadDetailClient";
import type { Lead, LeadActivity, Property } from "@/types";

export const dynamic = "force-dynamic";

type PageProps = { params: { id: string } };

export default async function LeadDetailPage({ params }: PageProps) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: lead } = await supabase
    .from("leads")
    .select("*, property:properties(*)")
    .eq("id", params.id)
    .eq("profile_id", user.id)
    .maybeSingle();

  if (!lead) notFound();

  const { data: activities } = await supabase
    .from("lead_activities")
    .select("*")
    .eq("lead_id", params.id)
    .order("created_at", { ascending: false });

  return (
    <LeadDetailClient
      lead={lead as Lead & { property: Property }}
      activities={(activities ?? []) as LeadActivity[]}
    />
  );
}
