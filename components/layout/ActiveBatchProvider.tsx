"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { createClient } from "@/lib/supabase/client";
import type { BatchStatus, ScanBatch } from "@/types";

const NON_TERMINAL: BatchStatus[] = ["queued", "scanning", "scoring", "rendering", "enriching"];

type Ctx = {
  batch: ScanBatch | null;
};

const ActiveBatchCtx = createContext<Ctx>({ batch: null });

export function useActiveBatch() {
  return useContext(ActiveBatchCtx);
}

export function ActiveBatchProvider({ children }: { children: ReactNode }) {
  const [batch, setBatch] = useState<ScanBatch | null>(null);

  // 1) Initial load: find newest non-terminal batch.
  // 2) Then poll /api/scan/[id]/status every 3s while non-terminal.
  // 3) When the active batch goes terminal, look for a newer non-terminal one
  //    (covers the case where user starts a second scan).
  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;
    const supabase = createClient();

    async function findActive(): Promise<ScanBatch | null> {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      const { data } = await supabase
        .from("scan_batches")
        .select("*")
        .eq("profile_id", user.id)
        .in("status", NON_TERMINAL)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      return (data as ScanBatch | null) ?? null;
    }

    async function pollOne(id: string): Promise<ScanBatch | null> {
      try {
        const res = await fetch(`/api/scan/${id}/status`, { cache: "no-store" });
        if (!res.ok) return null;
        return (await res.json()) as ScanBatch;
      } catch {
        return null;
      }
    }

    async function tick() {
      if (cancelled) return;

      let next: ScanBatch | null = batch ? await pollOne(batch.id) : null;
      const stillActive = next && NON_TERMINAL.includes(next.status as BatchStatus);

      if (!stillActive) {
        next = await findActive();
      }

      if (cancelled) return;
      setBatch(next);

      // Schedule next tick. Slow poll (15s) when nothing active to detect new
      // scans cheaply; fast poll (3s) while a batch is processing.
      const delay = next ? 3000 : 15000;
      timer = setTimeout(tick, delay);
    }

    // Kick off
    tick();

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <ActiveBatchCtx.Provider value={{ batch }}>
      {children}
    </ActiveBatchCtx.Provider>
  );
}
