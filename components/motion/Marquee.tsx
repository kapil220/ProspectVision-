"use client";

import { type ReactNode } from "react";

export function Marquee({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={`relative overflow-hidden ${className ?? ""}`}>
      <div className="flex w-max animate-marquee gap-16 whitespace-nowrap will-change-transform">
        <div className="flex shrink-0 items-center gap-16">{children}</div>
        <div className="flex shrink-0 items-center gap-16" aria-hidden>
          {children}
        </div>
      </div>
    </div>
  );
}
