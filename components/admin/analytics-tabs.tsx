"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { usePathname, useRouter } from "next/navigation";
import { useTransition } from "react";
import type {
  AnalyticsCustomersData,
  AnalyticsInventoryData,
  AnalyticsSalesData,
} from "@/lib/db/admin-analytics";
import type { AnalyticsTab } from "@/lib/admin/analytics";
import {
  ANALYTICS_CUSTOMER_MONTHS,
  ANALYTICS_DEAD_STOCK_DAYS,
  ANALYTICS_INVENTORY_DAYS,
  ANALYTICS_SALES_DAYS,
} from "@/lib/admin/analytics";
import { formatPrice } from "@/lib/utils/format-price";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface AnalyticsTabsProps {
  tab: AnalyticsTab;
  sales: AnalyticsSalesData;
  inventory: AnalyticsInventoryData;
  customers: AnalyticsCustomersData;
}

const CHART_STROKE = "hsl(75 95% 55%)";
const CHART_MUTED = "hsl(0 0% 64%)";
const CHART_GRID = "hsl(0 0% 16%)";
const CHART_RETURNING = "hsl(199 89% 48%)";

function formatAxisDay(value: string): string {
  const date = new Date(`${value}T00:00:00+05:30`);
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
  });
}

function formatMonthLabel(value: string): string {
  const [year, month] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, 1));
  return date.toLocaleDateString("en-IN", {
    month: "short",
    year: "2-digit",
    timeZone: "UTC",
  });
}

function formatPercent(rate: number): string {
  return `${(rate * 100).toFixed(1)}%`;
}

function formatShortDate(iso: string | null): string {
  if (!iso) return "Never";
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function KpiCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="mt-3 text-3xl font-bold tracking-tight text-foreground">
        {value}
      </p>
      <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
    </div>
  );
}

function ChartCard({
  title,
  description,
  children,
  empty,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
  empty?: boolean;
}) {
  return (
    <section className="rounded-xl border border-border bg-card">
      <div className="flex flex-wrap items-end justify-between gap-2 border-b border-border px-5 py-4">
        <div>
          <h2 className="text-sm font-semibold text-foreground">{title}</h2>
          <p className="mt-1 text-xs text-muted-foreground">{description}</p>
        </div>
        {empty ? (
          <p className="text-xs text-muted-foreground">No data yet</p>
        ) : null}
      </div>
      <div className="h-72 w-full px-2 pb-2 pt-4 sm:px-4">{children}</div>
    </section>
  );
}

function tooltipStyle() {
  return {
    background: "hsl(0 0% 7%)",
    border: "1px solid hsl(0 0% 16%)",
    borderRadius: 8,
    fontSize: 12,
  } as const;
}

function SalesPanel({ sales }: { sales: AnalyticsSalesData }) {
  const hasRevenue = sales.revenueTrend.some((point) => point.revenue > 0);
  const topChartData = sales.topProducts.map((product) => ({
    name:
      product.name.length > 18
        ? `${product.name.slice(0, 16)}…`
        : product.name,
    fullName: product.name,
    revenue: product.revenue,
    units: product.units,
  }));

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-3">
        <KpiCard
          label="Revenue"
          value={formatPrice(sales.revenueTotal)}
          hint={`Paid totals · last ${ANALYTICS_SALES_DAYS} days`}
        />
        <KpiCard
          label="Orders"
          value={String(sales.ordersCount)}
          hint="Paid orders in period"
        />
        <KpiCard
          label="AOV"
          value={formatPrice(sales.aov)}
          hint="Average order value"
        />
      </div>

      <ChartCard
        title="Revenue trend"
        description={`Daily paid revenue · last ${ANALYTICS_SALES_DAYS} days (Asia/Kolkata)`}
        empty={!hasRevenue}
      >
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={sales.revenueTrend}
            margin={{ top: 8, right: 12, left: 4, bottom: 0 }}
          >
            <defs>
              <linearGradient id="analyticsRevenueFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={CHART_STROKE} stopOpacity={0.35} />
                <stop offset="100%" stopColor={CHART_STROKE} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              stroke={CHART_GRID}
              strokeDasharray="3 3"
              vertical={false}
            />
            <XAxis
              dataKey="day"
              tickFormatter={formatAxisDay}
              tick={{ fill: CHART_MUTED, fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              minTickGap={28}
            />
            <YAxis
              tickFormatter={(value: number) =>
                value >= 1000 ? `₹${Math.round(value / 1000)}k` : `₹${value}`
              }
              tick={{ fill: CHART_MUTED, fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              width={48}
            />
            <Tooltip
              cursor={{ stroke: "hsl(0 0% 30%)", strokeDasharray: "4 4" }}
              contentStyle={tooltipStyle()}
              labelStyle={{ color: "hsl(0 0% 98%)" }}
              formatter={(value, name) => {
                if (name === "revenue") {
                  return [formatPrice(Number(value ?? 0)), "Revenue"];
                }
                return [String(value ?? 0), "Orders"];
              }}
              labelFormatter={(label) => formatAxisDay(String(label))}
            />
            <Area
              type="monotone"
              dataKey="revenue"
              stroke={CHART_STROKE}
              strokeWidth={2}
              fill="url(#analyticsRevenueFill)"
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard
        title="Top products"
        description="By paid revenue in the period"
        empty={topChartData.length === 0}
      >
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={topChartData}
            layout="vertical"
            margin={{ top: 8, right: 16, left: 8, bottom: 0 }}
          >
            <CartesianGrid
              stroke={CHART_GRID}
              strokeDasharray="3 3"
              horizontal={false}
            />
            <XAxis
              type="number"
              tickFormatter={(value: number) =>
                value >= 1000 ? `₹${Math.round(value / 1000)}k` : `₹${value}`
              }
              tick={{ fill: CHART_MUTED, fontSize: 11 }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              type="category"
              dataKey="name"
              width={110}
              tick={{ fill: CHART_MUTED, fontSize: 11 }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              contentStyle={tooltipStyle()}
              labelStyle={{ color: "hsl(0 0% 98%)" }}
              formatter={(value, _name, item) => {
                const units = Number(
                  (item?.payload as { units?: number } | undefined)?.units ?? 0
                );
                return [
                  `${formatPrice(Number(value ?? 0))} · ${units} units`,
                  "Revenue",
                ];
              }}
              labelFormatter={(_label, payload) => {
                const full = (
                  payload?.[0]?.payload as { fullName?: string } | undefined
                )?.fullName;
                return full ?? String(_label);
              }}
            />
            <Bar
              dataKey="revenue"
              fill={CHART_STROKE}
              radius={[0, 4, 4, 0]}
              isAnimationActive={false}
            />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
}

function InventoryPanel({ inventory }: { inventory: AnalyticsInventoryData }) {
  const turnoverChart = inventory.turnover.map((row) => ({
    name: row.sku.length > 14 ? `${row.sku.slice(0, 12)}…` : row.sku,
    fullName: `${row.product_name} · ${row.size}/${row.color}`,
    turnover: row.turnover_ratio,
    units: row.units_sold,
    stock: row.stock,
  }));

  return (
    <div className="space-y-6">
      <ChartCard
        title="Inventory turnover"
        description={`Units sold ÷ stock · last ${ANALYTICS_INVENTORY_DAYS} days`}
        empty={turnoverChart.length === 0}
      >
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={turnoverChart}
            margin={{ top: 8, right: 12, left: 4, bottom: 0 }}
          >
            <CartesianGrid
              stroke={CHART_GRID}
              strokeDasharray="3 3"
              vertical={false}
            />
            <XAxis
              dataKey="name"
              tick={{ fill: CHART_MUTED, fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              interval={0}
              angle={-25}
              textAnchor="end"
              height={56}
            />
            <YAxis
              tick={{ fill: CHART_MUTED, fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              width={36}
            />
            <Tooltip
              contentStyle={tooltipStyle()}
              labelStyle={{ color: "hsl(0 0% 98%)" }}
              formatter={(value, _name, item) => {
                const payload = item?.payload as
                  | { units?: number; stock?: number }
                  | undefined;
                return [
                  `${Number(value ?? 0).toFixed(2)}× · ${payload?.units ?? 0} sold / ${payload?.stock ?? 0} stock`,
                  "Turnover",
                ];
              }}
              labelFormatter={(_label, payload) => {
                const full = (
                  payload?.[0]?.payload as { fullName?: string } | undefined
                )?.fullName;
                return full ?? String(_label);
              }}
            />
            <Bar
              dataKey="turnover"
              fill={CHART_STROKE}
              radius={[4, 4, 0, 0]}
              isAnimationActive={false}
            />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <section className="rounded-xl border border-border bg-card">
        <div className="border-b border-border px-5 py-4">
          <h2 className="text-sm font-semibold text-foreground">Dead stock</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            In-stock variants with no paid sale in{" "}
            {ANALYTICS_DEAD_STOCK_DAYS}+ days (or never sold)
          </p>
        </div>
        {inventory.deadStock.length === 0 ? (
          <p className="px-5 py-8 text-sm text-muted-foreground">
            No dead stock in this window.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-5 py-3 font-semibold">Product</th>
                  <th className="px-5 py-3 font-semibold">SKU</th>
                  <th className="px-5 py-3 font-semibold">Variant</th>
                  <th className="px-5 py-3 font-semibold">Stock</th>
                  <th className="px-5 py-3 font-semibold">Last sold</th>
                </tr>
              </thead>
              <tbody>
                {inventory.deadStock.map((row) => (
                  <tr
                    key={row.variant_id}
                    className="border-b border-border/70 last:border-0"
                  >
                    <td className="px-5 py-3 text-foreground">
                      {row.product_name}
                    </td>
                    <td className="px-5 py-3 font-mono text-xs text-muted-foreground">
                      {row.sku}
                    </td>
                    <td className="px-5 py-3 text-muted-foreground">
                      {row.size} / {row.color}
                    </td>
                    <td className="px-5 py-3 tabular-nums text-foreground">
                      {row.stock}
                    </td>
                    <td className="px-5 py-3 text-muted-foreground">
                      {formatShortDate(row.last_sold_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function CustomersPanel({ customers }: { customers: AnalyticsCustomersData }) {
  const hasSeries = customers.newVsReturning.some(
    (point) => point.new > 0 || point.returning > 0
  );

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-3">
        <KpiCard
          label="Buyers"
          value={String(customers.customersWithOrders)}
          hint="Customers with ≥1 paid order"
        />
        <KpiCard
          label="Repeat buyers"
          value={String(customers.customersWithRepeat)}
          hint="Customers with ≥2 paid orders"
        />
        <KpiCard
          label="Repeat rate"
          value={formatPercent(customers.repeatPurchaseRate)}
          hint="Share of buyers who ordered again"
        />
      </div>

      <ChartCard
        title="New vs returning"
        description={`Distinct paying customers by first-order month · last ${ANALYTICS_CUSTOMER_MONTHS} months`}
        empty={!hasSeries}
      >
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={customers.newVsReturning}
            margin={{ top: 8, right: 12, left: 4, bottom: 0 }}
          >
            <CartesianGrid
              stroke={CHART_GRID}
              strokeDasharray="3 3"
              vertical={false}
            />
            <XAxis
              dataKey="period"
              tickFormatter={formatMonthLabel}
              tick={{ fill: CHART_MUTED, fontSize: 11 }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              allowDecimals={false}
              tick={{ fill: CHART_MUTED, fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              width={36}
            />
            <Tooltip
              contentStyle={tooltipStyle()}
              labelStyle={{ color: "hsl(0 0% 98%)" }}
              labelFormatter={(label) => formatMonthLabel(String(label))}
            />
            <Legend
              wrapperStyle={{ fontSize: 12, color: CHART_MUTED }}
              formatter={(value) =>
                value === "new" ? "New" : "Returning"
              }
            />
            <Bar
              dataKey="new"
              stackId="customers"
              fill={CHART_STROKE}
              radius={[0, 0, 0, 0]}
              isAnimationActive={false}
            />
            <Bar
              dataKey="returning"
              stackId="customers"
              fill={CHART_RETURNING}
              radius={[4, 4, 0, 0]}
              isAnimationActive={false}
            />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <section className="rounded-xl border border-border bg-card">
        <div className="border-b border-border px-5 py-4">
          <h2 className="text-sm font-semibold text-foreground">
            Cohort repeat purchase
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            First-order month cohorts and share who bought again in a later
            month
          </p>
        </div>
        {customers.cohorts.length === 0 ? (
          <p className="px-5 py-8 text-sm text-muted-foreground">
            No cohort data yet.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] text-left text-sm">
              <thead className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-5 py-3 font-semibold">Cohort</th>
                  <th className="px-5 py-3 font-semibold">Customers</th>
                  <th className="px-5 py-3 font-semibold">Repeat</th>
                  <th className="px-5 py-3 font-semibold">Repeat rate</th>
                </tr>
              </thead>
              <tbody>
                {customers.cohorts.map((row) => (
                  <tr
                    key={row.cohort_month}
                    className="border-b border-border/70 last:border-0"
                  >
                    <td className="px-5 py-3 text-foreground">
                      {formatMonthLabel(row.cohort_month)}
                    </td>
                    <td className="px-5 py-3 tabular-nums text-foreground">
                      {row.customers}
                    </td>
                    <td className="px-5 py-3 tabular-nums text-muted-foreground">
                      {row.repeat_customers}
                    </td>
                    <td className="px-5 py-3 tabular-nums text-foreground">
                      {formatPercent(row.repeat_rate)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

export function AnalyticsTabs({
  tab,
  sales,
  inventory,
  customers,
}: AnalyticsTabsProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  function onTabChange(value: string) {
    const params = new URLSearchParams();
    if (value !== "sales") {
      params.set("tab", value);
    }
    const qs = params.toString();
    startTransition(() => {
      router.replace(qs ? `${pathname}?${qs}` : pathname);
    });
  }

  return (
    <Tabs
      value={tab}
      onValueChange={onTabChange}
      className={isPending ? "opacity-80" : undefined}
    >
      <TabsList>
        <TabsTrigger value="sales">Sales</TabsTrigger>
        <TabsTrigger value="inventory">Inventory</TabsTrigger>
        <TabsTrigger value="customers">Customers</TabsTrigger>
      </TabsList>
      <TabsContent value="sales">
        <SalesPanel sales={sales} />
      </TabsContent>
      <TabsContent value="inventory">
        <InventoryPanel inventory={inventory} />
      </TabsContent>
      <TabsContent value="customers">
        <CustomersPanel customers={customers} />
      </TabsContent>
    </Tabs>
  );
}
