import { createServerClient } from "@/lib/supabase/server";
import type { OrderStatus, PaymentStatus } from "@/types";

const TIME_ZONE = "Asia/Kolkata";

export interface DashboardRecentOrder {
  id: string;
  status: OrderStatus;
  payment_status: PaymentStatus;
  total: number;
  created_at: string;
  customer_name: string | null;
}

export interface DashboardLowStockProduct {
  id: string;
  productId: string;
  name: string;
  size: string;
  color: string;
  sku: string;
  stock_quantity: number;
  is_active: boolean;
}

export interface AdminDashboardStats {
  ordersToday: number;
  ordersThisWeek: number;
  revenueThisWeek: number;
  lowStockProducts: DashboardLowStockProduct[];
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

function ymdInTimeZone(date: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function weekdayShortInTimeZone(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: TIME_ZONE,
    weekday: "short",
  }).format(date);
}

function getDashboardDateRanges(): { todayStartIso: string; weekStartIso: string } {
  const now = new Date();
  const todayYmd = ymdInTimeZone(now);
  const todayStart = new Date(`${todayYmd}T00:00:00+05:30`);

  const weekday = weekdayShortInTimeZone(todayStart);
  const dayIndex = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(
    weekday
  );
  const daysFromMonday = dayIndex === 0 ? 6 : Math.max(dayIndex - 1, 0);
  const weekStart = new Date(
    todayStart.getTime() - daysFromMonday * 24 * 60 * 60 * 1000
  );

  return {
    todayStartIso: todayStart.toISOString(),
    weekStartIso: weekStart.toISOString(),
  };
}

function normalizeCustomerName(
  customers:
    | { full_name: string | null }
    | Array<{ full_name: string | null }>
    | null
    | undefined
): string | null {
  if (!customers) {
    return null;
  }
  const row = Array.isArray(customers) ? customers[0] : customers;
  return row?.full_name ?? null;
}

export async function getAdminDashboardStats(): Promise<AdminDashboardStats> {
  const supabase = await assertAdmin();
  const { todayStartIso, weekStartIso } = getDashboardDateRanges();

  const [
    ordersTodayResult,
    ordersWeekResult,
    revenueWeekResult,
    lowStockResult,
    recentOrdersResult,
  ] = await Promise.all([
    supabase
      .from("orders")
      .select("id", { count: "exact", head: true })
      .gte("created_at", todayStartIso),
    supabase
      .from("orders")
      .select("id", { count: "exact", head: true })
      .gte("created_at", weekStartIso),
    supabase
      .from("orders")
      .select("total")
      .eq("payment_status", "paid")
      .gte("created_at", weekStartIso),
    supabase
      .from("product_variants")
      .select(
        "id, size, color, sku, stock_quantity, is_active, product_id, products(id, name, is_active)"
      )
      .lt("stock_quantity", 5)
      .order("stock_quantity", { ascending: true })
      .limit(15),
    supabase
      .from("orders")
      .select(
        "id, status, payment_status, total, created_at, customers(full_name)"
      )
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  if (ordersTodayResult.error) {
    console.error("Failed to count today's orders:", ordersTodayResult.error.message);
    throw new Error("Failed to load dashboard stats.");
  }

  if (ordersWeekResult.error) {
    console.error("Failed to count week's orders:", ordersWeekResult.error.message);
    throw new Error("Failed to load dashboard stats.");
  }

  if (revenueWeekResult.error) {
    console.error("Failed to sum weekly revenue:", revenueWeekResult.error.message);
    throw new Error("Failed to load dashboard stats.");
  }

  if (lowStockResult.error) {
    console.error("Failed to load low-stock variants:", lowStockResult.error.message);
    throw new Error("Failed to load dashboard stats.");
  }

  if (recentOrdersResult.error) {
    console.error("Failed to load recent orders:", recentOrdersResult.error.message);
    throw new Error("Failed to load dashboard stats.");
  }

  const revenueThisWeek = (
    (revenueWeekResult.data ?? []) as Array<{ total: number | string }>
  ).reduce((sum, row) => sum + Number(row.total), 0);

  const lowStockProducts = (
    (lowStockResult.data ?? []) as Array<{
      id: string;
      product_id: string;
      size: string;
      color: string;
      sku: string;
      stock_quantity: number;
      is_active: boolean;
      products:
        | { id: string; name: string; is_active: boolean }
        | Array<{ id: string; name: string; is_active: boolean }>
        | null;
    }>
  ).map((variant) => {
    const product = Array.isArray(variant.products)
      ? variant.products[0]
      : variant.products;
    return {
      id: variant.id,
      productId: variant.product_id,
      name: product?.name ?? "Unknown product",
      size: variant.size,
      color: variant.color,
      sku: variant.sku,
      stock_quantity: variant.stock_quantity,
      is_active: variant.is_active && (product?.is_active ?? false),
    };
  });

  const recentOrders = (
    (recentOrdersResult.data ?? []) as Array<{
      id: string;
      status: OrderStatus;
      payment_status: PaymentStatus;
      total: number | string;
      created_at: string;
      customers:
        | { full_name: string | null }
        | Array<{ full_name: string | null }>
        | null;
    }>
  ).map((order) => ({
    id: order.id,
    status: order.status,
    payment_status: order.payment_status,
    total: Number(order.total),
    created_at: order.created_at,
    customer_name: normalizeCustomerName(order.customers),
  }));

  return {
    ordersToday: ordersTodayResult.count ?? 0,
    ordersThisWeek: ordersWeekResult.count ?? 0,
    revenueThisWeek,
    lowStockProducts,
    recentOrders,
  };
}
