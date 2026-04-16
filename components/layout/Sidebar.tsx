"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart2,
  Kanban,
  Layers,
  LayoutDashboard,
  LogOut,
  ScanLine,
  Settings2,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

const WORKSPACE_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/scan", label: "New Scan", icon: ScanLine },
  { href: "/batches", label: "Batches", icon: Layers },
  { href: "/crm", label: "CRM", icon: Kanban },
  { href: "/analytics", label: "Analytics", icon: BarChart2 },
];

const ACCOUNT_ITEMS: NavItem[] = [
  { href: "/credits", label: "Credits", icon: Zap },
  { href: "/settings", label: "Settings", icon: Settings2 },
];

type SidebarProps = {
  creditBalance?: number;
  userEmail?: string;
};

export function Sidebar({
  creditBalance = 0,
  userEmail = "user@prospectvision.app",
}: SidebarProps) {
  const pathname = usePathname();
  const initials = userEmail.slice(0, 2).toUpperCase();

  return (
    <aside className="fixed left-0 top-0 z-30 flex h-screen w-[256px] flex-col border-r border-slate-800 bg-sidebar">
      <div className="flex h-16 items-center gap-2 border-b border-slate-800 px-6">
        <Zap className="h-[18px] w-[18px] text-brand" strokeWidth={2} />
        <span className="font-display text-[17px] font-semibold text-white">
          ProspectVision
        </span>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <SectionLabel>Workspace</SectionLabel>
        <ul className="mb-6 space-y-0.5">
          {WORKSPACE_ITEMS.map((item) => (
            <NavLink key={item.href} item={item} pathname={pathname} />
          ))}
        </ul>

        <SectionLabel>Account</SectionLabel>
        <ul className="space-y-0.5">
          {ACCOUNT_ITEMS.map((item) => (
            <NavLink key={item.href} item={item} pathname={pathname} />
          ))}
        </ul>
      </nav>

      <div className="border-t border-slate-800 p-4">
        <Link
          href="/credits"
          className="mb-3 block w-full rounded-full bg-brand/20 px-3 py-1.5 text-center text-xs font-semibold text-brand transition-colors hover:bg-brand/30"
        >
          <span className="font-mono">⚡ {creditBalance} credits</span>
        </Link>

        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand text-xs font-semibold text-white">
            {initials}
          </div>
          <span className="flex-1 truncate text-[11px] text-slate-400">
            {userEmail}
          </span>
          <button
            type="button"
            aria-label="Sign out"
            className="text-slate-500 transition-colors hover:text-red-400"
          >
            <LogOut className="h-[15px] w-[15px]" strokeWidth={1.75} />
          </button>
        </div>
      </div>
    </aside>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-widest text-slate-500">
      {children}
    </div>
  );
}

function NavLink({
  item,
  pathname,
}: {
  item: NavItem;
  pathname: string | null;
}) {
  const isActive =
    pathname === item.href ||
    (item.href !== "/dashboard" && pathname?.startsWith(item.href));
  const Icon = item.icon;

  return (
    <li>
      <Link
        href={item.href}
        className={cn(
          "flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13.5px] font-medium transition-all duration-150",
          isActive
            ? "bg-brand text-white shadow-glow"
            : "text-slate-400 hover:bg-slate-800 hover:text-slate-200",
        )}
      >
        <Icon className="h-[18px] w-[18px]" strokeWidth={1.5} />
        <span>{item.label}</span>
      </Link>
    </li>
  );
}
