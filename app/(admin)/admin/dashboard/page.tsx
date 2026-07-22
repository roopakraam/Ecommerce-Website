import Link from "next/link";
import {
  AlertTriangle,
  IndianRupee,
  Package,
  ShoppingBag,
} from "lucide-react";
import { getAdminDashboardStats } from "@/lib/db/admin-dashboard";
import { formatPrice } from "@/lib/utils/format-price";
import type { OrderStatus, PaymentStatus } from "@/types";

export const dynamic = "force-dynamic";

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

export default async function AdminDashboardPage() {
  const stats = await getAdminDashboardStats();

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Admin Dashboard</h1>
          <p className="mt-2 text-sm text-neutral-400">
            Orders, revenue, and stock at a glance for BOOK MY TEES.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/admin/dashboard/orders"
            className="rounded-full border border-neutral-700 px-4 py-2 text-sm font-semibold text-neutral-200 hover:border-neutral-500"
          >
            Orders
          </Link>
          <Link
            href="/admin/dashboard/products"
            className="rounded-full bg-lime-400 px-4 py-2 text-sm font-semibold text-neutral-950 hover:bg-lime-300"
          >
            Products
          </Link>
        </div>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-5">
          <div className="flex items-center gap-2 text-neutral-400">
            <ShoppingBag className="h-4 w-4" />
            <p className="text-xs font-semibold uppercase tracking-wide">
              Orders today
            </p>
          </div>
          <p className="mt-3 text-3xl font-bold text-white">
            {stats.ordersToday}
          </p>
        </div>

        <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-5">
          <div className="flex items-center gap-2 text-neutral-400">
            <Package className="h-4 w-4" />
            <p className="text-xs font-semibold uppercase tracking-wide">
              Orders this week
            </p>
          </div>
          <p className="mt-3 text-3xl font-bold text-white">
            {stats.ordersThisWeek}
          </p>
        </div>

        <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-5">
          <div className="flex items-center gap-2 text-neutral-400">
            <IndianRupee className="h-4 w-4" />
            <p className="text-xs font-semibold uppercase tracking-wide">
              Revenue this week
            </p>
          </div>
          <p className="mt-3 text-3xl font-bold text-white">
            {formatPrice(stats.revenueThisWeek)}
          </p>
          <p className="mt-1 text-xs text-neutral-500">Paid orders only</p>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-neutral-800 bg-neutral-900">
          <div className="flex items-center justify-between border-b border-neutral-800 px-5 py-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-400" />
              <h2 className="text-sm font-semibold text-white">
                Low stock
              </h2>
            </div>
            <Link
              href="/admin/dashboard/products"
              className="text-xs font-semibold text-neutral-400 hover:text-lime-300"
            >
              Manage
            </Link>
          </div>

          {stats.lowStockProducts.length === 0 ? (
            <p className="px-5 py-10 text-center text-sm text-neutral-500">
              No variants below 5 units.
            </p>
          ) : (
            <ul className="divide-y divide-neutral-800">
              {stats.lowStockProducts.map((variant) => (
                <li
                  key={variant.id}
                  className="flex items-center justify-between gap-3 px-5 py-3.5"
                >
                  <div>
                    <Link
                      href={`/admin/dashboard/products/${variant.productId}/edit`}
                      className="text-sm font-medium text-white hover:text-lime-300"
                    >
                      {variant.name}
                    </Link>
                    <p className="mt-0.5 text-xs text-neutral-500">
                      {variant.size} / {variant.color}
                      {variant.is_active ? "" : " · Inactive"}
                    </p>
                  </div>
                  <span
                    className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${
                      variant.stock_quantity === 0
                        ? "border-red-800 bg-red-950 text-red-300"
                        : "border-amber-700 bg-amber-950 text-amber-300"
                    }`}
                  >
                    {variant.stock_quantity} left
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-2xl border border-neutral-800 bg-neutral-900">
          <div className="flex items-center justify-between border-b border-neutral-800 px-5 py-4">
            <h2 className="text-sm font-semibold text-white">
              Recent orders
            </h2>
            <Link
              href="/admin/dashboard/orders"
              className="text-xs font-semibold text-neutral-400 hover:text-lime-300"
            >
              View all
            </Link>
          </div>

          {stats.recentOrders.length === 0 ? (
            <p className="px-5 py-10 text-center text-sm text-neutral-500">
              No orders yet.
            </p>
          ) : (
            <ul className="divide-y divide-neutral-800">
              {stats.recentOrders.map((order) => (
                <li key={order.id} className="px-5 py-3.5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <Link
                        href={`/admin/dashboard/orders/${order.id}`}
                        className="font-mono text-xs text-neutral-300 hover:text-lime-300"
                      >
                        {order.id.slice(0, 8)}…
                      </Link>
                      <p className="mt-1 text-sm text-white">
                        {order.customer_name || "Guest"}
                      </p>
                      <p className="mt-0.5 text-xs text-neutral-500">
                        {formatDate(order.created_at)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-white">
                        {formatPrice(order.total)}
                      </p>
                      <div className="mt-2 flex flex-col items-end gap-1">
                        <span
                          className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold capitalize ${ORDER_STATUS_CLASS[order.status]}`}
                        >
                          {order.status}
                        </span>
                        <span
                          className={`text-[10px] font-semibold capitalize ${PAYMENT_STATUS_CLASS[order.payment_status]}`}
                        >
                          {order.payment_status}
                        </span>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}
