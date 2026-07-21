import Link from "next/link";
import { OrdersFilters } from "@/components/admin/orders-filters";
import { OrdersTable } from "@/components/admin/orders-table";
import {
  getAdminOrders,
  type AdminOrderListOptions,
} from "@/lib/db/admin-orders";
import { isOrderStatus } from "@/lib/orders/status";
import type { OrderStatus } from "@/types";

export const dynamic = "force-dynamic";

interface OrdersPageProps {
  searchParams: {
    status?: string;
    q?: string;
  };
}

export default async function AdminOrdersPage({ searchParams }: OrdersPageProps) {
  const statusFilter: OrderStatus | "all" =
    searchParams.status && isOrderStatus(searchParams.status)
      ? searchParams.status
      : "all";

  const search = searchParams.q?.trim() ?? "";

  const options: AdminOrderListOptions = {
    status: statusFilter,
    search: search || undefined,
  };

  const orders = await getAdminOrders(options);

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-lime-400">
            Fulfillment
          </p>
          <h1 className="mt-1 text-2xl font-bold text-white sm:text-3xl">
            Orders
          </h1>
          <p className="mt-1 text-sm text-neutral-400">
            Filter by status and search customers by name or phone.
          </p>
        </div>
        <Link
          href="/admin/dashboard"
          className="rounded-full border border-neutral-700 px-4 py-2 text-sm font-semibold text-neutral-200 hover:border-neutral-500"
        >
          Dashboard
        </Link>
      </div>

      <div className="space-y-4">
        <OrdersFilters status={statusFilter} search={search} />
        <OrdersTable orders={orders} />
      </div>
    </main>
  );
}
