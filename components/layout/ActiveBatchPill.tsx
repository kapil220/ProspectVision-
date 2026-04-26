"use client";

import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2 } from "lucide-react";
import { useActiveBatch } from "@/components/layout/ActiveBatchProvider";
import type { BatchStatus } from "@/types";

const PHASE_LABEL: Record<BatchStatus, string> = {
  queued: "Queued",
  scanning: "Scanning",
  scoring: "Scoring",
  rendering: "Rendering",
  enriching: "Enriching",
  ready: "Ready",
  mailed: "Mailed",
  error: "Error",
};

export function ActiveBatchPill() {
  const { batch } = useActiveBatch();

  return (
    <AnimatePresence>
      {batch && (
        <motion.div
          key={batch.id}
          initial={{ opacity: 0, y: -6, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -6, scale: 0.96 }}
          transition={{ duration: 0.4, ease: [0.21, 0.61, 0.35, 1] }}
        >
          <Link
            href={`/batches/${batch.id}`}
            className="group relative flex items-center gap-2.5 rounded-full border border-emerald/30 bg-emerald/5 px-3.5 py-1.5 text-xs font-medium text-emerald transition-colors hover:bg-emerald/10"
          >
            <span className="relative flex h-2 w-2 shrink-0">
              <span className="absolute inset-0 rounded-full bg-emerald opacity-60 motion-safe:animate-ping" />
              <span className="relative h-2 w-2 rounded-full bg-emerald" />
            </span>
            <Loader2 className="h-3 w-3 animate-spin" />
            <span className="num">
              {PHASE_LABEL[batch.status as BatchStatus]} · {Math.round(batch.progress_pct ?? 0)}%
            </span>
            <span className="hidden text-ink-muted sm:inline">
              · {batch.total_scanned ?? 0} home{(batch.total_scanned ?? 0) === 1 ? "" : "s"}
            </span>
            <span className="text-ink-muted transition-colors group-hover:text-ink">→</span>
          </Link>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
