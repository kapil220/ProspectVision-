"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { Bell } from "lucide-react";
import {
  Avatar,
  AvatarFallback,
} from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const TITLES: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/scan": "New Scan",
  "/batches": "Batches",
  "/crm": "CRM",
  "/analytics": "Analytics",
  "/credits": "Credits",
  "/settings": "Settings",
};

function titleFor(pathname: string | null): string {
  if (!pathname) return "ProspectVision";
  if (TITLES[pathname]) return TITLES[pathname];
  const base = "/" + pathname.split("/").filter(Boolean)[0];
  return TITLES[base] ?? "ProspectVision";
}

type TopbarProps = {
  userEmail?: string;
};

export function Topbar({ userEmail = "user@prospectvision.app" }: TopbarProps) {
  const pathname = usePathname();
  const title = titleFor(pathname);
  const initials = userEmail.slice(0, 2).toUpperCase();

  return (
    <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-8">
      <h1 className="font-display text-[18px] font-semibold text-slate-900">
        {title}
      </h1>

      <div className="flex items-center gap-4">
        <button
          type="button"
          aria-label="Notifications"
          className="relative rounded-full p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
        >
          <Bell className="h-[18px] w-[18px]" strokeWidth={1.75} />
        </button>

        <DropdownMenu>
          <DropdownMenuTrigger
            aria-label="Account menu"
            className="rounded-full outline-none ring-offset-2 transition-shadow focus-visible:ring-2 focus-visible:ring-brand"
          >
            <Avatar className="h-9 w-9">
              <AvatarFallback className="bg-brand text-xs font-semibold text-white">
                {initials}
              </AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem asChild>
              <Link href="/settings">Profile</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/settings">Settings</Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-red-600 focus:text-red-700">
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
