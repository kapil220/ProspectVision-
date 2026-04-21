import { Suspense } from "react";
import { redirect } from "next/navigation";
import { PageContainer } from "@/components/ui/PageContainer";
import { createClient } from "@/lib/supabase/server";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { StatsRow } from "@/components/dashboard/StatsRow";
import { PipelineOverview } from "@/components/dashboard/PipelineOverview";
import { FollowUpsDue } from "@/components/dashboard/FollowUpsDue";
import { RecentBatches } from "@/components/dashboard/RecentBatches";
import { PlatformBenchmarks } from "@/components/dashboard/PlatformBenchmarks";
import { StatsRowSkeleton } from "@/components/skeletons/StatsRowSkeleton";
import { PipelineOverviewSkeleton } from "@/components/skeletons/PipelineOverviewSkeleton";
import { FollowUpsDueSkeleton } from "@/components/skeletons/FollowUpsDueSkeleton";
import { RecentBatchesSkeleton } from "@/components/skeletons/RecentBatchesSkeleton";
import { PlatformBenchmarksSkeleton } from "@/components/skeletons/PlatformBenchmarksSkeleton";
import type { Profile } from "@/types";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profileData } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  const profile: Profile =
    (profileData as Profile | null) ?? {
      id: user.id,
      email: user.email ?? "",
      full_name: (user.user_metadata?.full_name as string | undefined) ?? null,
      company_name: "",
      phone: null,
      website: null,
      niche: "",
      return_address: "",
      return_city: "",
      return_state: "",
      return_zip: "",
      credit_balance: 0,
      stripe_customer_id: null,
      service_area_zips: [],
      onboarded_at: null,
      created_at: new Date().toISOString(),
    };

  return (
    <PageContainer>
      <DashboardHeader profile={profile} />

      <Suspense fallback={<StatsRowSkeleton />}>
        <StatsRow userId={user.id} niche={profile.niche} />
      </Suspense>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Suspense fallback={<PipelineOverviewSkeleton />}>
            <PipelineOverview userId={user.id} />
          </Suspense>
        </div>
        <div className="lg:col-span-1">
          <Suspense fallback={<FollowUpsDueSkeleton />}>
            <FollowUpsDue userId={user.id} />
          </Suspense>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Suspense fallback={<RecentBatchesSkeleton />}>
            <RecentBatches userId={user.id} />
          </Suspense>
        </div>
        <div className="lg:col-span-1">
          <Suspense fallback={<PlatformBenchmarksSkeleton />}>
            <PlatformBenchmarks userId={user.id} niche={profile.niche} />
          </Suspense>
        </div>
      </div>
    </PageContainer>
  );
}
