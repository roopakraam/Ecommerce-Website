import Link from "next/link";
import { DashboardKpiCards } from "@/components/admin/dashboard-kpi-cards";
import { DashboardRecentOrdersTable } from "@/components/admin/dashboard-recent-orders-table";
import { RevenueTrendChart } from "@/components/admin/revenue-trend-chart";
import { getAdminDashboardData } from "@/lib/db/admin-dashboard";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const { metrics, revenueTrend, recentOrders } =
    await getAdminDashboardData();

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Dashboard
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Revenue, orders, and stock at a glance for BOOK MY TEES.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" asChild>
            <Link href="/admin/orders">Orders</Link>
          </Button>
          <Button asChild>
            <Link href="/admin/products">Products</Link>
          </Button>
        </div>
      </div>

      <div className="mt-8 space-y-6">
        <DashboardKpiCards metrics={metrics} />
        <RevenueTrendChart data={revenueTrend} />
        <DashboardRecentOrdersTable orders={recentOrders} />
      </div>
    </main>
  );
}
