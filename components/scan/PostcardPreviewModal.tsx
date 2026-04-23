"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

// Lob 6x9 postcard is rendered at 1872x1296 (300 DPI). Scale it to fit the modal.
const CARD_W = 1872;
const CARD_H = 1296;
const DISPLAY_W = 720;
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
  const src = `/api/postcard-preview/${propertyId}?side=${side}`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-3xl rounded-2xl bg-white shadow-2xl"
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
              key={side}
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
}
