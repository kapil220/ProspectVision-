import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { BatchReviewClient } from "@/components/scan/BatchReviewClient";
import type { Property, ScanBatch } from "@/types";

export const dynamic = "force-dynamic";

export default async function BatchReviewPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [batchRes, propsRes, profileRes] = await Promise.all([
    supabase
      .from("scan_batches")
      .select("*")
      .eq("id", params.id)
      .eq("profile_id", user.id)
      .maybeSingle(),
    supabase
      .from("properties")
      .select("*")
      .eq("batch_id", params.id)
      .eq("profile_id", user.id)
      .order("upgrade_score", { ascending: false }),
    supabase
      .from("profiles")
      .select("credit_balance, return_address, return_city, return_state, return_zip")
      .eq("id", user.id)
      .maybeSingle(),
  ]);

  if (!batchRes.data) notFound();

  return (
    <BatchReviewClient
      batch={batchRes.data as ScanBatch}
      properties={(propsRes.data ?? []) as Property[]}
      creditBalance={profileRes.data?.credit_balance ?? 0}
      returnAddress={
        profileRes.data
          ? [
              profileRes.data.return_address,
              profileRes.data.return_city,
              profileRes.data.return_state,
              profileRes.data.return_zip,
            ]
              .filter(Boolean)
              .join(", ")
          : ""
      }
    />
  );
}
