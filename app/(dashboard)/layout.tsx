import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden pl-[256px]">
        <Topbar />
        <main className="flex-1 overflow-y-auto bg-[#F8FAFC]">{children}</main>
      </div>
    </div>
  );
}
