import Link from "next/link";
import { ScanLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getNiche } from "@/lib/niches";
import type { Profile } from "@/types";

type Props = { profile: Profile };

function greeting(hour: number) {
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export function DashboardHeader({ profile }: Props) {
  const first =
    profile.full_name?.split(" ")[0] ??
    profile.email.split("@")[0];
  const niche = profile.niche ? getNiche(profile.niche) : undefined;
  const nicheLabel = niche?.label ?? "No niche set";
  const subtitleParts = [
    profile.company_name || "Your business",
    nicheLabel,
    `⚡ ${profile.credit_balance} credits`,
  ];

  return (
    <div className="mb-8 flex items-start justify-between gap-6">
      <div>
        <h1 className="font-display text-[26px] font-semibold text-slate-900">
          {greeting(new Date().getHours())}, {first}
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          {subtitleParts.join(" · ")}
        </p>
      </div>
      <Button asChild className="bg-brand hover:bg-brand-dark">
        <Link href="/scan">
          <ScanLine className="mr-2 h-4 w-4" strokeWidth={1.75} />
          New Scan
        </Link>
      </Button>
    </div>
  );
}
