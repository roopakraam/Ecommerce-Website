"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { DashboardRevenuePoint } from "@/lib/db/admin-dashboard";
import { formatPrice } from "@/lib/utils/format-price";

interface RevenueTrendChartProps {
  data: DashboardRevenuePoint[];
}

function formatAxisDay(value: string): string {
  const date = new Date(`${value}T00:00:00+05:30`);
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
  });
}

function formatTooltipLabel(value: string): string {
  const date = new Date(`${value}T00:00:00+05:30`);
  return date.toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function RevenueTrendChart({ data }: RevenueTrendChartProps) {
  const hasRevenue = data.some((point) => point.revenue > 0);

  return (
    <section className="rounded-xl border border-border bg-card">
      <div className="flex flex-wrap items-end justify-between gap-2 border-b border-border px-5 py-4">
        <div>
          <h2 className="text-sm font-semibold text-foreground">
            Revenue trend
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Paid order totals · last 30 days (Asia/Kolkata)
          </p>
        </div>
        {!hasRevenue ? (
          <p className="text-xs text-muted-foreground">No paid revenue yet</p>
        ) : null}
      </div>

      <div className="h-72 w-full px-2 pb-2 pt-4 sm:px-4">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 8, right: 12, left: 4, bottom: 0 }}
          >
            <defs>
              <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(75 95% 55%)" stopOpacity={0.35} />
                <stop offset="100%" stopColor="hsl(75 95% 55%)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              stroke="hsl(0 0% 16%)"
              strokeDasharray="3 3"
              vertical={false}
            />
            <XAxis
              dataKey="day"
              tickFormatter={formatAxisDay}
              tick={{ fill: "hsl(0 0% 64%)", fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              minTickGap={28}
            />
            <YAxis
              tickFormatter={(value: number) =>
                value >= 1000 ? `₹${Math.round(value / 1000)}k` : `₹${value}`
              }
              tick={{ fill: "hsl(0 0% 64%)", fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              width={48}
            />
            <Tooltip
              cursor={{ stroke: "hsl(0 0% 30%)", strokeDasharray: "4 4" }}
              contentStyle={{
                background: "hsl(0 0% 7%)",
                border: "1px solid hsl(0 0% 16%)",
                borderRadius: 8,
                fontSize: 12,
              }}
              labelStyle={{ color: "hsl(0 0% 98%)" }}
              itemStyle={{ color: "hsl(75 95% 55%)" }}
              labelFormatter={(label) => formatTooltipLabel(String(label))}
              formatter={(value) => [
                formatPrice(Number(value ?? 0)),
                "Revenue",
              ]}
            />
            <Area
              type="monotone"
              dataKey="revenue"
              stroke="hsl(75 95% 55%)"
              strokeWidth={2}
              fill="url(#revenueFill)"
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
