"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Sparkles, X } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const CARD_W = 1872;
const CARD_H = 1296;
const DISPLAY_W = 960;
const SCALE = DISPLAY_W / CARD_W;
const DISPLAY_H = Math.round(CARD_H * SCALE);

type Side = "front" | "back";

export function PostcardPreviewModal({
  propertyId,
  address,
  onClose,
}: {
  propertyId: string;
  address: string;
  onClose: () => void;
}) {
  const [side, setSide] = useState<Side>("front");
  const [mounted, setMounted] = useState(false);
  const [iframeKey, setIframeKey] = useState(0);
  const [rendering, setRendering] = useState(false);
  const src = `/api/postcard-preview/${propertyId}?side=${side}&v=${iframeKey}`;

  useEffect(() => {
    setMounted(true);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  async function handleGenerateRender() {
    if (rendering) return;
    setRendering(true);
    const t = toast.loading("Generating AI render…");
    try {
      const res = await fetch(`/api/properties/${propertyId}/render`, { method: "POST" });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) throw new Error(data.error || `Render failed (${res.status})`);
      toast.success("AI render ready", { id: t });
      setIframeKey((k) => k + 1);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Render failed", { id: t });
    } finally {
      setRendering(false);
    }
  }

  if (!mounted) return null;

  const modal = (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/70 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-5xl rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-100 p-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">
              Postcard preview
            </p>
            <p className="mt-0.5 text-sm font-medium text-slate-900">{address}</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleGenerateRender}
              disabled={rendering}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60",
              )}
              title="Re-run the AI render for this property"
            >
              <Sparkles className="h-3.5 w-3.5" />
              {rendering ? "Generating…" : "Generate AI render"}
            </button>
            <div className="flex rounded-lg bg-slate-100 p-1">
              <button
                type="button"
                onClick={() => setSide("front")}
                className={cn(
                  "rounded-md px-3 py-1 text-xs font-semibold transition-colors",
                  side === "front"
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-500 hover:text-slate-700",
                )}
              >
                Front
              </button>
              <button
                type="button"
                onClick={() => setSide("back")}
                className={cn(
                  "rounded-md px-3 py-1 text-xs font-semibold transition-colors",
                  side === "back"
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-500 hover:text-slate-700",
                )}
              >
                Back
              </button>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              aria-label="Close preview"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="flex items-center justify-center bg-slate-50 p-6">
          <div
            className="relative overflow-hidden rounded-lg bg-white shadow-[0_8px_30px_rgba(15,23,42,0.15)]"
            style={{ width: DISPLAY_W, height: DISPLAY_H }}
          >
            <iframe
              key={`${side}-${iframeKey}`}
              title={`Postcard ${side}`}
              src={src}
              sandbox="allow-same-origin"
              style={{
                width: CARD_W,
                height: CARD_H,
                border: 0,
                transform: `scale(${SCALE})`,
                transformOrigin: "top left",
              }}
            />
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3 text-xs text-slate-500">
          <span>
            Actual size: 6&quot; × 9&quot; · 300 DPI · Mailed via Lob USPS First Class
          </span>
          <a
            href={src}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-brand hover:underline"
          >
            Open full size →
          </a>
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
