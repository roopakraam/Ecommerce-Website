"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateCustomerNotesAction } from "@/lib/actions/admin-customers";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

interface CustomerAdminNotesProps {
  customerId: string;
  initialNotes: string;
}

export function CustomerAdminNotes({
  customerId,
  initialNotes,
}: CustomerAdminNotesProps) {
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
      const result = await updateCustomerNotesAction({
        customerId,
        adminNotes: notes,
      });

      if (!result.success) {
        setError(result.error);
        return;
      }

      setMessage("Admin notes saved.");
      router.refresh();
    });
  }

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-foreground">Admin notes</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Staff-only. Not visible to the customer.
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
        <Label htmlFor="admin-notes" className="sr-only">
          Admin notes
        </Label>
        <textarea
          id="admin-notes"
          rows={5}
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          placeholder="VIP flags, support history, delivery preferences…"
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
