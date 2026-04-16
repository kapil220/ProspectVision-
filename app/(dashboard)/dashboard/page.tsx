import { BarChart2, Layers, ScanLine, Zap } from "lucide-react";
import { PageContainer } from "@/components/ui/PageContainer";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatCard } from "@/components/ui/StatCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function DashboardPage() {
  return (
    <PageContainer>
      <PageHeader
        title="Dashboard"
        subtitle="Your prospecting pipeline at a glance."
        action={
          <Button asChild className="bg-brand hover:bg-brand-dark">
            <Link href="/scan">
              <ScanLine className="mr-2 h-4 w-4" strokeWidth={1.75} />
              New Scan
            </Link>
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Credits"
          value="0"
          icon={Zap}
          iconBg="bg-brand-light"
          iconColor="text-brand"
        />
        <StatCard
          label="Active Batches"
          value="0"
          icon={Layers}
          iconBg="bg-amber-50"
          iconColor="text-amber-600"
        />
        <StatCard
          label="Postcards Mailed"
          value="0"
          icon={ScanLine}
          iconBg="bg-emerald-50"
          iconColor="text-emerald-600"
        />
        <StatCard
          label="Response Rate"
          value="0%"
          icon={BarChart2}
          iconBg="bg-violet-50"
          iconColor="text-violet-600"
        />
      </div>

      <div className="mt-10">
        <EmptyState
          icon={ScanLine}
          title="No scans yet"
          description="Start your first satellite scan to discover properties in your target area."
          action={
            <Button asChild className="bg-brand hover:bg-brand-dark">
              <Link href="/scan">Run your first scan</Link>
            </Button>
          }
        />
      </div>
    </PageContainer>
  );
}
