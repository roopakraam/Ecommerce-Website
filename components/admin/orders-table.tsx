import Link from "next/link";
import type { AdminOrderListItem } from "@/lib/db/admin-orders";
import { formatPrice } from "@/lib/utils/format-price";
import { EmptyState } from "@/components/ui/empty-state";
import type { OrderStatus, PaymentStatus } from "@/types";

interface OrdersTableProps {
  orders: AdminOrderListItem[];
  hasActiveFilters?: boolean;
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
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function OrdersTable({
  orders,
  hasActiveFilters = false,
}: OrdersTableProps) {
  if (orders.length === 0) {
    if (hasActiveFilters) {
      return (
        <EmptyState
          tone="dark"
          title="No orders match your search"
          description="Try a different status filter or search by another customer name or phone number."
          actionHref="/admin/dashboard/orders"
          actionLabel="Clear filters"
        />
      );
    }

    return (
      <EmptyState
        tone="dark"
        title="No orders yet"
        description="When customers complete checkout, their orders will show up here."
        actionHref="/admin/dashboard"
        actionLabel="Back to dashboard"
      />
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-neutral-800">
      <table className="min-w-full divide-y divide-neutral-800 text-left text-sm">
        <thead className="bg-neutral-900 text-xs uppercase tracking-wide text-neutral-400">
          <tr>
            <th className="px-4 py-3 font-semibold">Order</th>
            <th className="px-4 py-3 font-semibold">Customer</th>
            <th className="px-4 py-3 font-semibold">Total</th>
            <th className="px-4 py-3 font-semibold">Payment</th>
            <th className="px-4 py-3 font-semibold">Status</th>
            <th className="px-4 py-3 font-semibold text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-800 bg-neutral-950">
          {orders.map((order) => (
            <tr key={order.id}>
              <td className="px-4 py-3">
                <p className="font-mono text-xs text-neutral-300">
                  {order.id.slice(0, 8)}…
                </p>
                <p className="mt-1 text-xs text-neutral-500">
                  {formatDate(order.created_at)}
                </p>
              </td>
              <td className="px-4 py-3">
                <p className="font-medium text-white">
                  {order.customers?.full_name || "Guest"}
                </p>
                <p className="text-xs text-neutral-500">
                  {order.customers?.phone || "—"}
                </p>
              </td>
              <td className="px-4 py-3 text-neutral-200">
                {formatPrice(Number(order.total))}
              </td>
              <td className="px-4 py-3">
                <span
                  className={`text-xs font-semibold capitalize ${PAYMENT_STATUS_CLASS[order.payment_status]}`}
                >
                  {order.payment_status}
                </span>
              </td>
              <td className="px-4 py-3">
                <span
                  className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold capitalize ${ORDER_STATUS_CLASS[order.status]}`}
                >
                  {order.status}
                </span>
              </td>
              <td className="px-4 py-3 text-right">
                <Link
                  href={`/admin/dashboard/orders/${order.id}`}
                  className="inline-flex rounded-full border border-neutral-700 px-3 py-1.5 text-xs font-semibold text-neutral-200 transition hover:border-lime-400 hover:text-lime-300"
                >
                  View
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
