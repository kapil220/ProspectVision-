import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ScanWizard } from "@/components/scan/ScanWizard";
import type { NicheId } from "@/types";

export const dynamic = "force-dynamic";

export default async function ScanPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("niche, service_area_zips, credit_balance")
    .eq("id", user.id)
    .maybeSingle();

  return (
    <ScanWizard
      initialNiche={(profile?.niche as NicheId | "") || ""}
      initialZips={(profile?.service_area_zips as string[] | null) ?? []}
      creditBalance={profile?.credit_balance ?? 0}
    />
  );
}
