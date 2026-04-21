"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { LossReason } from "@/types";

type WonProps = {
  open: boolean;
  onClose: () => void;
  onConfirm: (dealValue: number) => Promise<void>;
};

export function WonModal({ open, onClose, onConfirm }: WonProps) {
  const [value, setValue] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit() {
    const n = Number(value);
    if (!n || n <= 0) return;
    setSaving(true);
    try {
      await onConfirm(n);
      setValue("");
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>🎉 Mark deal as won</DialogTitle>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="deal_value">Deal value (USD)</Label>
          <Input
            id="deal_value"
            type="number"
            min={0}
            placeholder="e.g. 12500"
            value={value}
            onChange={(e) => setValue(e.target.value)}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={saving || !value}>
            {saving ? "Saving..." : "Confirm won"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

const LOSS_OPTIONS: { value: LossReason; label: string }[] = [
  { value: "price", label: "Price" },
  { value: "timing", label: "Timing" },
  { value: "competitor", label: "Went with competitor" },
  { value: "no_response", label: "No response" },
  { value: "not_interested", label: "Not interested" },
  { value: "other", label: "Other" },
];

type LostProps = {
  open: boolean;
  onClose: () => void;
  onConfirm: (reason: LossReason) => Promise<void>;
};

export function LostModal({ open, onClose, onConfirm }: LostProps) {
  const [reason, setReason] = useState<LossReason>("price");
  const [saving, setSaving] = useState(false);

  async function submit() {
    setSaving(true);
    try {
      await onConfirm(reason);
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Mark deal as lost</DialogTitle>
        </DialogHeader>
        <div className="space-y-2">
          <Label>Loss reason</Label>
          <select
            value={reason}
            onChange={(e) => setReason(e.target.value as LossReason)}
            className="h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-sm"
          >
            {LOSS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={saving}>
            {saving ? "Saving..." : "Confirm lost"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
