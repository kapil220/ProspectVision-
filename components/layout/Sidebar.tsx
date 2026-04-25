"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
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
    <aside className="fixed left-0 top-0 z-30 flex h-screen w-[256px] flex-col border-r border-ink-2 bg-ink">
      <div className="flex h-16 items-center gap-2 border-b border-ivory/10 px-5">
        <span className="grid h-7 w-7 place-items-center rounded-full bg-ivory text-ink">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /><path d="M12 3v18M3 12h18" /></svg>
        </span>
        <span className="font-display text-[17px] font-semibold tracking-tight text-ivory">
          ProspectVision
        </span>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-5">
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

      <div className="border-t border-ivory/10 p-4">
        <Link
          href="/credits"
          className="mb-3 flex items-center justify-between rounded-full bg-ochre/15 px-3.5 py-2 text-xs font-medium text-ochre transition-colors hover:bg-ochre/25"
        >
          <span className="num">{creditBalance.toLocaleString()} credits</span>
          <Zap className="h-3.5 w-3.5" strokeWidth={2} />
        </Link>

        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald text-xs font-semibold text-ivory">
            {initials}
          </div>
          <span className="flex-1 truncate text-[11px] text-ivory/60">
            {userEmail}
          </span>
          <button
            type="button"
            aria-label="Sign out"
            className="text-ivory/40 transition-colors hover:text-crimson"
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
    <div className="num mb-2 px-3 text-[10px] font-medium uppercase tracking-[0.22em] text-ivory/40">
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
          "relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13.5px] font-medium transition-colors duration-150",
          isActive
            ? "bg-ivory text-ink"
            : "text-ivory/60 hover:bg-ivory/5 hover:text-ivory",
        )}
      >
        {isActive && (
          <motion.span
            layoutId="sidebar-active"
            className="absolute inset-0 -z-10 rounded-lg bg-ivory"
            transition={{ type: "spring", stiffness: 380, damping: 32 }}
          />
        )}
        <Icon className="h-[18px] w-[18px]" strokeWidth={1.6} />
        <span className="relative">{item.label}</span>
      </Link>
    </li>
  );
}
