import Link from "next/link";
import { Check, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";

type Props = { userId: string };

type LeadRow = {
  id: string;
  follow_up_date: string | null;
  properties: {
    address: string | null;
    owner_first: string | null;
    owner_last: string | null;
  } | null;
};

export async function FollowUpsDue({ userId }: Props) {
  const supabase = createClient();
  const today = new Date().toISOString().slice(0, 10);

  const { data } = await supabase
    .from("leads")
    .select(
      "id, follow_up_date, properties(address, owner_first, owner_last)",
    )
    .eq("profile_id", userId)
    .lte("follow_up_date", today)
    .not("current_stage", "in", "(closed_won,closed_lost)")
    .order("follow_up_date", { ascending: true })
    .limit(8);

  const leads = (data ?? []) as unknown as LeadRow[];

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-card">
      <div className="mb-5 flex items-center justify-between">
        <h2 className="font-display text-base font-semibold text-slate-900">
          Follow-ups Due
        </h2>
        {leads.length > 0 ? (
          <span className="inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-50 px-2 text-xs font-semibold text-red-600">
            {leads.length}
          </span>
        ) : null}
      </div>

      {leads.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <Check className="mb-2 h-8 w-8 text-slate-300" strokeWidth={1.75} />
          <p className="text-sm text-slate-400">All caught up!</p>
        </div>
      ) : (
        <div className="space-y-2">
          {leads.map((l) => {
            const owner =
              [l.properties?.owner_first, l.properties?.owner_last]
                .filter(Boolean)
                .join(" ") || "Homeowner";
            return (
              <div
                key={l.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-slate-100 p-3 hover:bg-slate-50"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-900">
                    {owner}
                  </p>
                  <p className="truncate text-xs text-slate-500">
                    {l.properties?.address ?? "—"}
                  </p>
                </div>
                <Button
                  asChild
                  size="sm"
                  variant="outline"
                  className="shrink-0"
                >
                  <Link href={`/crm/${l.id}`}>
                    <Phone className="mr-1 h-3.5 w-3.5" strokeWidth={1.75} />
                    Call
                  </Link>
                </Button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
