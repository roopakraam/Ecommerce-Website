import { createServerClient } from "@/lib/supabase/server";
import type { OrderStatus, PaymentStatus } from "@/types";

const TIME_ZONE = "Asia/Kolkata";
const REVENUE_TREND_DAYS = 30;
const RECENT_ORDERS_LIMIT = 10;
const LOW_STOCK_THRESHOLD = 5;

export interface DashboardMetrics {
  revenueToday: number;
  revenue7d: number;
  revenue30d: number;
  ordersToday: number;
  lowStockCount: number;
  newCustomers: number;
}

export interface DashboardRevenuePoint {
  day: string;
  revenue: number;
}

export interface DashboardRecentOrder {
  id: string;
  status: OrderStatus;
  payment_status: PaymentStatus;
  total: number;
  created_at: string;
  customer_name: string | null;
  customer_phone: string | null;
}

export interface AdminDashboardData {
  metrics: DashboardMetrics;
  revenueTrend: DashboardRevenuePoint[];
  recentOrders: DashboardRecentOrder[];
}

async function assertAdmin() {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("You must be signed in.");
  }

  const { data: adminRow, error } = await supabase
    .from("admin_users")
    .select("id")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  if (error || !adminRow) {
    throw new Error("You do not have admin access.");
  }

  return supabase;
}

function toNumber(value: number | string | null | undefined): number {
  return Number(value ?? 0);
}

function ymdInTimeZone(date: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function startOfDayIso(ymd: string): string {
  return new Date(`${ymd}T00:00:00+05:30`).toISOString();
}

function addCalendarDays(ymd: string, days: number): string {
  const date = new Date(`${ymd}T12:00:00+05:30`);
  date.setUTCDate(date.getUTCDate() + days);
  return ymdInTimeZone(date);
}

function getDashboardDateWindows(now = new Date()) {
  const todayYmd = ymdInTimeZone(now);
  const range7dStartYmd = addCalendarDays(todayYmd, -6);
  const range30dStartYmd = addCalendarDays(todayYmd, -(REVENUE_TREND_DAYS - 1));

  return {
    todayYmd,
    todayStartIso: startOfDayIso(todayYmd),
    range7dStartIso: startOfDayIso(range7dStartYmd),
    range30dStartYmd,
    range30dStartIso: startOfDayIso(range30dStartYmd),
  };
}

function buildEmptyRevenueTrend(startYmd: string, endYmd: string): DashboardRevenuePoint[] {
  const points: DashboardRevenuePoint[] = [];
  let cursor = startYmd;

  while (cursor <= endYmd) {
    points.push({ day: cursor, revenue: 0 });
    cursor = addCalendarDays(cursor, 1);
  }

  return points;
}

function normalizeCustomerField(
  customers:
    | { full_name: string | null; phone: string | null }
    | Array<{ full_name: string | null; phone: string | null }>
    | null
    | undefined,
  field: "full_name" | "phone"
): string | null {
  if (!customers) {
    return null;
  }
  const row = Array.isArray(customers) ? customers[0] : customers;
  return row?.[field] ?? null;
}

function sumPaidTotals(
  rows: Array<{ total: number | string }> | null | undefined
): number {
  return (rows ?? []).reduce((sum, row) => sum + toNumber(row.total), 0);
}

export async function getAdminDashboardData(): Promise<AdminDashboardData> {
  const supabase = await assertAdmin();
  const {
    todayYmd,
    todayStartIso,
    range7dStartIso,
    range30dStartYmd,
    range30dStartIso,
  } = getDashboardDateWindows();

  const [
    revenueTodayResult,
    revenue7dResult,
    revenue30dResult,
    ordersTodayResult,
    lowStockResult,
    newCustomersResult,
    trendOrdersResult,
    recentOrdersResult,
  ] = await Promise.all([
    supabase
      .from("orders")
      .select("total")
      .eq("payment_status", "paid")
      .gte("created_at", todayStartIso),
    supabase
      .from("orders")
      .select("total")
      .eq("payment_status", "paid")
      .gte("created_at", range7dStartIso),
    supabase
      .from("orders")
      .select("total")
      .eq("payment_status", "paid")
      .gte("created_at", range30dStartIso),
    supabase
      .from("orders")
      .select("id", { count: "exact", head: true })
      .gte("created_at", todayStartIso),
    supabase
      .from("product_variants")
      .select("id", { count: "exact", head: true })
      .lt("stock_quantity", LOW_STOCK_THRESHOLD),
    supabase
      .from("customers")
      .select("id", { count: "exact", head: true })
      .gte("created_at", todayStartIso),
    supabase
      .from("orders")
      .select("total, created_at")
      .eq("payment_status", "paid")
      .gte("created_at", range30dStartIso)
      .order("created_at", { ascending: true }),
    supabase
      .from("orders")
      .select(
        "id, status, payment_status, total, created_at, customers(full_name, phone)"
      )
      .order("created_at", { ascending: false })
      .limit(RECENT_ORDERS_LIMIT),
  ]);

  const queryErrors = [
    revenueTodayResult.error,
    revenue7dResult.error,
    revenue30dResult.error,
    ordersTodayResult.error,
    lowStockResult.error,
    newCustomersResult.error,
    trendOrdersResult.error,
    recentOrdersResult.error,
  ].filter(Boolean);

  if (queryErrors.length > 0) {
    console.error(
      "Failed to load dashboard stats:",
      queryErrors.map((error) => error?.message).join("; ")
    );
    throw new Error("Failed to load dashboard stats.");
  }

  const metrics: DashboardMetrics = {
    revenueToday: sumPaidTotals(revenueTodayResult.data),
    revenue7d: sumPaidTotals(revenue7dResult.data),
    revenue30d: sumPaidTotals(revenue30dResult.data),
    ordersToday: ordersTodayResult.count ?? 0,
    lowStockCount: lowStockResult.count ?? 0,
    newCustomers: newCustomersResult.count ?? 0,
  };

  const revenueByDay = new Map(
    buildEmptyRevenueTrend(range30dStartYmd, todayYmd).map((point) => [
      point.day,
      point.revenue,
    ])
  );

  for (const row of trendOrdersResult.data ?? []) {
    const day = ymdInTimeZone(new Date(row.created_at));
    revenueByDay.set(day, (revenueByDay.get(day) ?? 0) + toNumber(row.total));
  }

  const revenueTrend: DashboardRevenuePoint[] = Array.from(
    revenueByDay.entries()
  ).map(([day, revenue]) => ({ day, revenue }));

  const recentOrders = (
    (recentOrdersResult.data ?? []) as Array<{
      id: string;
      status: OrderStatus;
      payment_status: PaymentStatus;
      total: number | string;
      created_at: string;
      customers:
        | { full_name: string | null; phone: string | null }
        | Array<{ full_name: string | null; phone: string | null }>
        | null;
    }>
  ).map((order) => ({
    id: order.id,
    status: order.status,
    payment_status: order.payment_status,
    total: toNumber(order.total),
    created_at: order.created_at,
    customer_name: normalizeCustomerField(order.customers, "full_name"),
    customer_phone: normalizeCustomerField(order.customers, "phone"),
  }));

  return {
    metrics,
    revenueTrend,
    recentOrders,
  };
}

export { LOW_STOCK_THRESHOLD, RECENT_ORDERS_LIMIT, REVENUE_TREND_DAYS };
