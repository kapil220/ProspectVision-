import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CRMClient } from "@/components/crm/CRMClient";
import type { Lead, Property } from "@/types";

export const dynamic = "force-dynamic";

export type LeadWithProperty = Lead & { property: Property };

export default async function CRMPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data } = await supabase
    .from("leads")
    .select("*, property:properties(*)")
    .eq("profile_id", user.id)
    .order("updated_at", { ascending: false });

  const leads = (data ?? []) as LeadWithProperty[];

  return <CRMClient leads={leads} />;
}
