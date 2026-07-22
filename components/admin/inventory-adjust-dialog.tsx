"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { adjustInventoryAction } from "@/lib/actions/admin-inventory";
import type { AdminInventoryRow } from "@/lib/db/admin-inventory";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface InventoryAdjustDialogProps {
  variant: AdminInventoryRow | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function InventoryAdjustDialog({
  variant,
  open,
  onOpenChange,
}: InventoryAdjustDialogProps) {
  const router = useRouter();
  const [delta, setDelta] = useState("0");
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const parsedDelta = Number(delta);
  const preview =
    variant && Number.isInteger(parsedDelta)
      ? variant.stock_quantity + parsedDelta
      : null;

  function handleOpenChange(next: boolean) {
    if (!next) {
      setDelta("0");
      setReason("");
      setError(null);
    }
    onOpenChange(next);
  }

  function onSubmit() {
    if (!variant) return;
    setError(null);

    startTransition(async () => {
      const result = await adjustInventoryAction({
        variantId: variant.id,
        delta: parsedDelta,
        reason: reason.trim() || undefined,
      });

      if (!result.success) {
        setError(result.error);
        return;
      }

      handleOpenChange(false);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Adjust inventory</DialogTitle>
          <DialogDescription>
            {variant
              ? `${variant.product_name} · ${variant.size} / ${variant.color}`
              : "Select a variant"}
          </DialogDescription>
        </DialogHeader>

        {variant ? (
          <div className="space-y-4">
            <div className="rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm">
              <p className="text-muted-foreground">Current stock</p>
              <p className="mt-1 text-lg font-semibold text-foreground">
                {variant.stock_quantity}
              </p>
              <p className="mt-1 font-mono text-xs text-muted-foreground">
                {variant.sku}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="delta">Adjustment (+/−)</Label>
              <Input
                id="delta"
                type="number"
                step="1"
                value={delta}
                onChange={(event) => setDelta(event.target.value)}
                placeholder="e.g. 10 or -3"
              />
              <p className="text-xs text-muted-foreground">
                Use a positive number to add stock, negative to remove.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reason">Reason (optional)</Label>
              <Input
                id="reason"
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                placeholder="Damaged, restock, count correction…"
              />
            </div>

            {preview != null ? (
              <p className="text-sm text-muted-foreground">
                New stock:{" "}
                <span
                  className={
                    preview < 0
                      ? "font-semibold text-red-300"
                      : "font-semibold text-foreground"
                  }
                >
                  {preview}
                </span>
              </p>
            ) : null}

            {error ? (
              <p className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive-foreground">
                {error}
              </p>
            ) : null}
          </div>
        ) : null}

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            disabled={
              isPending ||
              !variant ||
              !Number.isInteger(parsedDelta) ||
              parsedDelta === 0 ||
              (preview != null && preview < 0)
            }
            onClick={onSubmit}
          >
            {isPending ? "Saving..." : "Save adjustment"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
