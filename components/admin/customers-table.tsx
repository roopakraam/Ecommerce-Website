import Link from "next/link";
import type { AdminCustomerListItem } from "@/lib/db/admin-customers";
import { ADMIN_CUSTOMERS_PATH } from "@/lib/admin/customers";
import { formatPrice } from "@/lib/utils/format-price";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";

interface CustomersTableProps {
  customers: AdminCustomerListItem[];
  hasActiveSearch?: boolean;
}

function formatJoined(value: string): string {
  return new Date(value).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function CustomersTable({
  customers,
  hasActiveSearch = false,
}: CustomersTableProps) {
  if (customers.length === 0) {
    return (
      <EmptyState
        tone="dark"
        title={hasActiveSearch ? "No customers match your search" : "No customers yet"}
        description={
          hasActiveSearch
            ? "Try a different name or phone number."
            : "Customer profiles appear here after signup or checkout."
        }
        actionHref={hasActiveSearch ? ADMIN_CUSTOMERS_PATH : undefined}
        actionLabel={hasActiveSearch ? "Clear search" : undefined}
      />
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <table className="min-w-full divide-y divide-border text-left text-sm">
        <thead className="bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
          <tr>
            <th className="px-4 py-3 font-semibold">Customer</th>
            <th className="px-4 py-3 font-semibold">Phone</th>
            <th className="px-4 py-3 font-semibold">Orders</th>
            <th className="px-4 py-3 font-semibold">Total spend</th>
            <th className="px-4 py-3 font-semibold">Joined</th>
            <th className="px-4 py-3 text-right font-semibold">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border bg-background">
          {customers.map((customer) => (
            <tr key={customer.id} className="hover:bg-muted/20">
              <td className="px-4 py-3">
                <p className="font-medium text-foreground">
                  {customer.full_name || "Unnamed customer"}
                </p>
                <p className="mt-0.5 font-mono text-[11px] text-muted-foreground">
                  {customer.id.slice(0, 8)}…
                </p>
              </td>
              <td className="px-4 py-3 text-muted-foreground">
                {customer.phone || "—"}
              </td>
              <td className="px-4 py-3 text-foreground">{customer.order_count}</td>
              <td className="px-4 py-3 text-foreground">
                {formatPrice(customer.total_spend)}
              </td>
              <td className="px-4 py-3 text-muted-foreground">
                {formatJoined(customer.created_at)}
              </td>
              <td className="px-4 py-3 text-right">
                <Button variant="outline" size="sm" asChild>
                  <Link href={`${ADMIN_CUSTOMERS_PATH}/${customer.id}`}>
                    View
                  </Link>
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
