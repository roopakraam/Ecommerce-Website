"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateOrderNotesAction } from "@/lib/actions/admin-orders";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

interface OrderInternalNotesProps {
  orderId: string;
  initialNotes: string;
}

export function OrderInternalNotes({
  orderId,
  initialNotes,
}: OrderInternalNotesProps) {
  const router = useRouter();
  const [notes, setNotes] = useState(initialNotes);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const dirty = notes.trim() !== initialNotes.trim();

  function onSave() {
    setMessage(null);
    setError(null);

    startTransition(async () => {
      const result = await updateOrderNotesAction({
        orderId,
        internalNotes: notes,
      });

      if (!result.success) {
        setError(result.error);
        return;
      }

      setMessage("Internal notes saved.");
      router.refresh();
    });
  }

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-foreground">
            Internal notes
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Staff-only. Not visible to customers.
          </p>
        </div>
        <Button
          type="button"
          size="sm"
          disabled={isPending || !dirty}
          onClick={onSave}
        >
          {isPending ? "Saving..." : "Save notes"}
        </Button>
      </div>

      <div className="mt-4 space-y-2">
        <Label htmlFor="internal-notes" className="sr-only">
          Internal notes
        </Label>
        <textarea
          id="internal-notes"
          rows={5}
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          placeholder="Packing instructions, customer callbacks, fraud flags…"
          className="flex min-h-[120px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm text-foreground outline-none ring-ring placeholder:text-muted-foreground focus-visible:ring-2"
        />
      </div>

      {message ? (
        <p className="mt-3 rounded-lg border border-emerald-800 bg-emerald-950/40 px-3 py-2 text-sm text-emerald-200">
          {message}
        </p>
      ) : null}
      {error ? (
        <p className="mt-3 rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive-foreground">
          {error}
        </p>
      ) : null}
    </div>
  );
}
