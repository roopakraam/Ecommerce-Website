import Link from "next/link";
import type { DashboardRecentOrder } from "@/lib/db/admin-dashboard";
import { formatPrice } from "@/lib/utils/format-price";
import { EmptyState } from "@/components/ui/empty-state";
import type { OrderStatus, PaymentStatus } from "@/types";

interface DashboardRecentOrdersTableProps {
  orders: DashboardRecentOrder[];
}

const ORDER_STATUS_CLASS: Record<OrderStatus, string> = {
  pending: "border-amber-700 bg-amber-950 text-amber-300",
  confirmed: "border-emerald-700 bg-emerald-950 text-emerald-300",
  shipped: "border-blue-700 bg-blue-950 text-blue-300",
  delivered: "border-lime-700 bg-lime-950 text-lime-300",
  cancelled: "border-red-800 bg-red-950 text-red-300",
};

const PAYMENT_STATUS_CLASS: Record<PaymentStatus, string> = {
  pending: "text-amber-300",
  paid: "text-emerald-300",
  failed: "text-red-300",
  refunded: "text-neutral-400",
};

function formatDate(value: string): string {
  return new Date(value).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function DashboardRecentOrdersTable({
  orders,
}: DashboardRecentOrdersTableProps) {
  return (
    <section className="rounded-xl border border-border bg-card">
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <div>
          <h2 className="text-sm font-semibold text-foreground">
            Recent orders
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Latest 10 orders · click a row for details
          </p>
        </div>
        <Link
          href="/admin/orders"
          className="text-xs font-semibold text-muted-foreground transition hover:text-primary"
        >
          View all
        </Link>
      </div>

      {orders.length === 0 ? (
        <div className="p-5">
          <EmptyState
            tone="dark"
            title="No orders yet"
            description="When customers complete checkout, their orders will show up here."
            actionHref="/admin/products"
            actionLabel="Manage products"
          />
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-border text-left text-sm">
            <thead className="bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-5 py-3 font-semibold">Order</th>
                <th className="px-5 py-3 font-semibold">Customer</th>
                <th className="px-5 py-3 font-semibold">Total</th>
                <th className="px-5 py-3 font-semibold">Payment</th>
                <th className="px-5 py-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {orders.map((order) => (
                <tr
                  key={order.id}
                  className="transition-colors hover:bg-muted/30"
                >
                  <td className="px-5 py-3">
                    <Link
                      href={`/admin/orders/${order.id}`}
                      className="block"
                    >
                      <p className="font-mono text-xs text-foreground hover:text-primary">
                        {order.id.slice(0, 8)}…
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {formatDate(order.created_at)}
                      </p>
                    </Link>
                  </td>
                  <td className="px-5 py-3">
                    <Link
                      href={`/admin/orders/${order.id}`}
                      className="block"
                    >
                      <p className="font-medium text-foreground">
                        {order.customer_name || "Guest"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {order.customer_phone || "—"}
                      </p>
                    </Link>
                  </td>
                  <td className="px-5 py-3">
                    <Link
                      href={`/admin/orders/${order.id}`}
                      className="block text-foreground"
                    >
                      {formatPrice(order.total)}
                    </Link>
                  </td>
                  <td className="px-5 py-3">
                    <Link
                      href={`/admin/orders/${order.id}`}
                      className="block"
                    >
                      <span
                        className={`text-xs font-semibold capitalize ${PAYMENT_STATUS_CLASS[order.payment_status]}`}
                      >
                        {order.payment_status}
                      </span>
                    </Link>
                  </td>
                  <td className="px-5 py-3">
                    <Link
                      href={`/admin/orders/${order.id}`}
                      className="block"
                    >
                      <span
                        className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold capitalize ${ORDER_STATUS_CLASS[order.status]}`}
                      >
                        {order.status}
                      </span>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
