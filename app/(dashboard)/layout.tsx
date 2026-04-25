import { redirect } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, email")
    .eq("id", user.id)
    .maybeSingle();

  const displayName =
    (profile?.full_name as string | null | undefined) ??
    (user.user_metadata?.full_name as string | undefined) ??
    null;
  const email = (profile?.email as string | undefined) ?? user.email ?? "";

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden pl-[256px]">
        <Topbar userEmail={email} userName={displayName} />
        <main className="flex-1 overflow-y-auto bg-ivory">{children}</main>
      </div>
    </div>
  );
}
