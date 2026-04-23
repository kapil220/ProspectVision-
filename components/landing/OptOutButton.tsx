"use client";

import { useState } from "react";
import { toast } from "sonner";

type Props = { slug: string; company: string };

export function OptOutButton({ slug, company }: Props) {
  const [state, setState] = useState<"idle" | "loading" | "done">("idle");

  async function handle() {
    if (state !== "idle") return;
    setState("loading");
    try {
      const res = await fetch("/api/optout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Failed");
      setState("done");
      toast.success(`You've been opted out. ${company} will not mail you again.`);
    } catch (e) {
      setState("idle");
      toast.error((e as Error).message);
    }
  }

  if (state === "done") {
    return (
      <p className="mt-3 text-xs text-slate-500">
        ✓ You&apos;ve been removed from {company}&apos;s mailing list.
      </p>
    );
  }

  return (
    <button
      type="button"
      onClick={handle}
      disabled={state === "loading"}
      className="mt-3 text-xs text-slate-400 underline hover:text-slate-600 disabled:opacity-60"
    >
      {state === "loading"
        ? "Opting out..."
        : `Stop receiving mail from ${company}`}
    </button>
  );
}
