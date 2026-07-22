import Link from "next/link";
import { CsvExportButton } from "@/components/admin/csv-export-button";
import { OrdersFilters } from "@/components/admin/orders-filters";
import { OrdersTable } from "@/components/admin/orders-table";
import { Button } from "@/components/ui/button";
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
    from?: string;
    to?: string;
  };
}

function isYmd(value: string | undefined): value is string {
  return Boolean(value && /^\d{4}-\d{2}-\d{2}$/.test(value));
}

export default async function AdminOrdersPage({
  searchParams,
}: OrdersPageProps) {
  const statusFilter: OrderStatus | "all" =
    searchParams.status && isOrderStatus(searchParams.status)
      ? searchParams.status
      : "all";

  const search = searchParams.q?.trim() ?? "";
  const fromDate = isYmd(searchParams.from) ? searchParams.from : "";
  const toDate = isYmd(searchParams.to) ? searchParams.to : "";

  const options: AdminOrderListOptions = {
    status: statusFilter,
    search: search || undefined,
    fromDate: fromDate || undefined,
    toDate: toDate || undefined,
  };

  const orders = await getAdminOrders(options);
  const hasActiveFilters =
    statusFilter !== "all" ||
    Boolean(search) ||
    Boolean(fromDate) ||
    Boolean(toDate);

  const exportParams = new URLSearchParams();
  if (statusFilter !== "all") exportParams.set("status", statusFilter);
  if (search) exportParams.set("q", search);
  if (fromDate) exportParams.set("from", fromDate);
  if (toDate) exportParams.set("to", toDate);
  const exportHref = `/api/admin/orders/export${
    exportParams.size > 0 ? `?${exportParams.toString()}` : ""
  }`;

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Orders
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Filter by status and date range. Open an order for fulfillment
            details.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <CsvExportButton href={exportHref} />
          <Button variant="outline" asChild>
            <Link href="/admin/dashboard">Dashboard</Link>
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        <OrdersFilters
          filters={{
            status: statusFilter,
            search,
            fromDate,
            toDate,
          }}
        />
        <OrdersTable orders={orders} hasActiveFilters={hasActiveFilters} />
      </div>
    </main>
  );
}
