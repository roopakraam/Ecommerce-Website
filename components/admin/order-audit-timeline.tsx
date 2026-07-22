import type { AdminOrderAuditEntry } from "@/lib/db/admin-orders";

interface OrderAuditTimelineProps {
  entries: AdminOrderAuditEntry[];
}

function formatDate(value: string): string {
  return new Date(value).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function describeEntry(entry: AdminOrderAuditEntry): string {
  if (entry.action === "status_changed") {
    const from =
      typeof entry.previous_values?.status === "string"
        ? entry.previous_values.status
        : "?";
    const to =
      typeof entry.new_values?.status === "string"
        ? entry.new_values.status
        : "?";
    return `Status changed from ${from} to ${to}`;
  }

  if (entry.action === "notes_updated") {
    return "Internal notes updated";
  }

  return entry.action.replace(/_/g, " ");
}

export function OrderAuditTimeline({ entries }: OrderAuditTimelineProps) {
  return (
    <section className="rounded-xl border border-border bg-card">
      <div className="border-b border-border px-5 py-4">
        <h2 className="text-sm font-semibold text-foreground">Audit history</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Status and notes changes recorded in audit_logs.
        </p>
      </div>

      {entries.length === 0 ? (
        <p className="px-5 py-8 text-center text-sm text-muted-foreground">
          No audit events yet.
        </p>
      ) : (
        <ul className="divide-y divide-border">
          {entries.map((entry) => (
            <li key={entry.id} className="px-5 py-3.5">
              <p className="text-sm font-medium text-foreground">
                {describeEntry(entry)}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {formatDate(entry.created_at)}
                {entry.actor_email ? ` · ${entry.actor_email}` : ""}
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
