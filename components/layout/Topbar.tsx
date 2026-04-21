"use client";

import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { Bell, LogOut, Loader2 } from "lucide-react";
import { useState } from "react";
import {
  Avatar,
  AvatarFallback,
} from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { createClient } from "@/lib/supabase/client";

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

function initialsFor(name: string | null, email: string): string {
  if (name) {
    const parts = name.trim().split(/\s+/);
    const first = parts[0]?.[0] ?? "";
    const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
    const initials = (first + last).toUpperCase();
    if (initials) return initials;
  }
  return email.slice(0, 2).toUpperCase() || "PV";
}

type TopbarProps = {
  userEmail?: string;
  userName?: string | null;
};

export function Topbar({ userEmail = "", userName = null }: TopbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const title = titleFor(pathname);
  const initials = initialsFor(userName, userEmail);
  const [signingOut, setSigningOut] = useState(false);

  const handleSignOut = async () => {
    if (signingOut) return;
    setSigningOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace("/login");
    router.refresh();
  };

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
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="flex flex-col gap-0.5">
              <span className="text-sm font-semibold text-slate-900">
                {userName || userEmail.split("@")[0] || "Account"}
              </span>
              {userEmail && (
                <span className="text-xs font-normal text-slate-500">
                  {userEmail}
                </span>
              )}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/settings">Profile</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/settings">Settings</Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onSelect={(e) => {
                e.preventDefault();
                handleSignOut();
              }}
              disabled={signingOut}
              className="text-red-600 focus:text-red-700"
            >
              {signingOut ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <LogOut className="mr-2 h-4 w-4" />
              )}
              {signingOut ? "Signing out..." : "Sign out"}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
