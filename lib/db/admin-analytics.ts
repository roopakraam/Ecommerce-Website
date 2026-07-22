import {
  ANALYTICS_CUSTOMER_MONTHS,
  ANALYTICS_DEAD_STOCK_DAYS,
  ANALYTICS_INVENTORY_DAYS,
  ANALYTICS_SALES_DAYS,
} from "@/lib/admin/analytics";
import { createServerClient } from "@/lib/supabase/server";

const TIME_ZONE = "Asia/Kolkata";

export interface AnalyticsRevenuePoint {
  day: string;
  revenue: number;
  orders: number;
}

export interface AnalyticsTopProduct {
  product_key: string;
  product_id: string | null;
  name: string;
  units: number;
  revenue: number;
}

export interface AnalyticsSalesData {
  revenueTotal: number;
  ordersCount: number;
  aov: number;
  revenueTrend: AnalyticsRevenuePoint[];
  topProducts: AnalyticsTopProduct[];
}

export interface AnalyticsTurnoverRow {
  variant_id: string;
  sku: string;
  product_name: string;
  size: string;
  color: string;
  stock: number;
  units_sold: number;
  turnover_ratio: number;
}

export interface AnalyticsDeadStockRow {
  variant_id: string;
  sku: string;
  product_name: string;
  size: string;
  color: string;
  stock: number;
  last_sold_at: string | null;
}

export interface AnalyticsInventoryData {
  turnover: AnalyticsTurnoverRow[];
  deadStock: AnalyticsDeadStockRow[];
}

export interface AnalyticsNewVsReturningPoint {
  period: string;
  new: number;
  returning: number;
}

export interface AnalyticsCohortRow {
  cohort_month: string;
  customers: number;
  repeat_customers: number;
  repeat_rate: number;
}

export interface AnalyticsCustomersData {
  customersWithOrders: number;
  customersWithRepeat: number;
  repeatPurchaseRate: number;
  newVsReturning: AnalyticsNewVsReturningPoint[];
  cohorts: AnalyticsCohortRow[];
}

export interface AdminAnalyticsData {
  sales: AnalyticsSalesData;
  inventory: AnalyticsInventoryData;
  customers: AnalyticsCustomersData;
}

type SupabaseClient = Awaited<ReturnType<typeof createServerClient>>;

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

function isMissingRpcError(message: string): boolean {
  const lower = message.toLowerCase();
  return (
    lower.includes("could not find the function") ||
    lower.includes("schema cache") ||
    (lower.includes("function") && lower.includes("does not exist"))
  );
}

function ymdInTimeZone(date: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function yearMonthInTimeZone(date: Date): string {
  return ymdInTimeZone(date).slice(0, 7);
}

function startOfDayIso(ymd: string): string {
  return new Date(`${ymd}T00:00:00+05:30`).toISOString();
}

function addCalendarDays(ymd: string, days: number): string {
  const date = new Date(`${ymd}T12:00:00+05:30`);
  date.setUTCDate(date.getUTCDate() + days);
  return ymdInTimeZone(date);
}

function addMonths(yearMonth: string, delta: number): string {
  const [year, month] = yearMonth.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1 + delta, 1));
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

function buildEmptyRevenueTrend(
  startYmd: string,
  endYmd: string
): AnalyticsRevenuePoint[] {
  const points: AnalyticsRevenuePoint[] = [];
  let cursor = startYmd;
  while (cursor <= endYmd) {
    points.push({ day: cursor, revenue: 0, orders: 0 });
    cursor = addCalendarDays(cursor, 1);
  }
  return points;
}

function normalizeProductName(
  products:
    | { name: string }
    | Array<{ name: string }>
    | null
    | undefined
): string {
  if (!products) return "Unknown product";
  const row = Array.isArray(products) ? products[0] : products;
  return row?.name ?? "Unknown product";
}

function parseSalesRpc(raw: unknown): AnalyticsSalesData | null {
  if (!raw || typeof raw !== "object") return null;
  const data = raw as Record<string, unknown>;
  const trend = Array.isArray(data.revenue_trend) ? data.revenue_trend : [];
  const top = Array.isArray(data.top_products) ? data.top_products : [];

  return {
    revenueTotal: toNumber(data.revenue_total as number | string),
    ordersCount: toNumber(data.orders_count as number | string),
    aov: toNumber(data.aov as number | string),
    revenueTrend: trend.map((row) => {
      const point = row as Record<string, unknown>;
      return {
        day: String(point.day ?? ""),
        revenue: toNumber(point.revenue as number | string),
        orders: toNumber(point.orders as number | string),
      };
    }),
    topProducts: top.map((row) => {
      const product = row as Record<string, unknown>;
      return {
        product_key: String(product.product_key ?? product.name ?? ""),
        product_id:
          product.product_id == null ? null : String(product.product_id),
        name: String(product.name ?? "Unknown"),
        units: toNumber(product.units as number | string),
        revenue: toNumber(product.revenue as number | string),
      };
    }),
  };
}

function parseInventoryRpc(raw: unknown): AnalyticsInventoryData | null {
  if (!raw || typeof raw !== "object") return null;
  const data = raw as Record<string, unknown>;
  const turnover = Array.isArray(data.turnover) ? data.turnover : [];
  const deadStock = Array.isArray(data.dead_stock) ? data.dead_stock : [];

  return {
    turnover: turnover.map((row) => {
      const item = row as Record<string, unknown>;
      return {
        variant_id: String(item.variant_id ?? ""),
        sku: String(item.sku ?? ""),
        product_name: String(item.product_name ?? ""),
        size: String(item.size ?? ""),
        color: String(item.color ?? ""),
        stock: toNumber(item.stock as number | string),
        units_sold: toNumber(item.units_sold as number | string),
        turnover_ratio: toNumber(item.turnover_ratio as number | string),
      };
    }),
    deadStock: deadStock.map((row) => {
      const item = row as Record<string, unknown>;
      return {
        variant_id: String(item.variant_id ?? ""),
        sku: String(item.sku ?? ""),
        product_name: String(item.product_name ?? ""),
        size: String(item.size ?? ""),
        color: String(item.color ?? ""),
        stock: toNumber(item.stock as number | string),
        last_sold_at:
          item.last_sold_at == null ? null : String(item.last_sold_at),
      };
    }),
  };
}

function parseCustomersRpc(raw: unknown): AnalyticsCustomersData | null {
  if (!raw || typeof raw !== "object") return null;
  const data = raw as Record<string, unknown>;
  const newVsReturning = Array.isArray(data.new_vs_returning)
    ? data.new_vs_returning
    : [];
  const cohorts = Array.isArray(data.cohorts) ? data.cohorts : [];

  return {
    customersWithOrders: toNumber(
      data.customers_with_orders as number | string
    ),
    customersWithRepeat: toNumber(
      data.customers_with_repeat as number | string
    ),
    repeatPurchaseRate: toNumber(data.repeat_purchase_rate as number | string),
    newVsReturning: newVsReturning.map((row) => {
      const point = row as Record<string, unknown>;
      return {
        period: String(point.period ?? ""),
        new: toNumber(point.new as number | string),
        returning: toNumber(point.returning as number | string),
      };
    }),
    cohorts: cohorts.map((row) => {
      const cohort = row as Record<string, unknown>;
      return {
        cohort_month: String(cohort.cohort_month ?? ""),
        customers: toNumber(cohort.customers as number | string),
        repeat_customers: toNumber(cohort.repeat_customers as number | string),
        repeat_rate: toNumber(cohort.repeat_rate as number | string),
      };
    }),
  };
}

async function getSalesViaQueries(
  supabase: SupabaseClient
): Promise<AnalyticsSalesData> {
  const todayYmd = ymdInTimeZone(new Date());
  const rangeStartYmd = addCalendarDays(todayYmd, -(ANALYTICS_SALES_DAYS - 1));
  const rangeStartIso = startOfDayIso(rangeStartYmd);

  const [ordersResult, itemsResult] = await Promise.all([
    supabase
      .from("orders")
      .select("id, total, created_at")
      .eq("payment_status", "paid")
      .gte("created_at", rangeStartIso)
      .order("created_at", { ascending: true }),
    supabase
      .from("order_items")
      .select(
        "product_id, product_name_snapshot, quantity, unit_price, orders!inner(payment_status, created_at)"
      )
      .eq("orders.payment_status", "paid")
      .gte("orders.created_at", rangeStartIso),
  ]);

  if (ordersResult.error) {
    throw new Error(ordersResult.error.message);
  }
  if (itemsResult.error) {
    throw new Error(itemsResult.error.message);
  }

  const orders = ordersResult.data ?? [];
  const revenueTotal = orders.reduce(
    (sum, row) => sum + toNumber(row.total),
    0
  );
  const ordersCount = orders.length;
  const aov = ordersCount > 0 ? revenueTotal / ordersCount : 0;

  const byDay = new Map(
    buildEmptyRevenueTrend(rangeStartYmd, todayYmd).map((point) => [
      point.day,
      { ...point },
    ])
  );

  for (const order of orders) {
    const day = ymdInTimeZone(new Date(order.created_at));
    const point = byDay.get(day);
    if (!point) continue;
    point.revenue += toNumber(order.total);
    point.orders += 1;
  }

  const productMap = new Map<
    string,
    AnalyticsTopProduct
  >();

  for (const item of itemsResult.data ?? []) {
    const key = item.product_id
      ? String(item.product_id)
      : item.product_name_snapshot;
    const existing = productMap.get(key) ?? {
      product_key: key,
      product_id: item.product_id,
      name: item.product_name_snapshot,
      units: 0,
      revenue: 0,
    };
    existing.units += toNumber(item.quantity);
    existing.revenue += toNumber(item.unit_price) * toNumber(item.quantity);
    productMap.set(key, existing);
  }

  const topProducts = Array.from(productMap.values())
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 8);

  return {
    revenueTotal,
    ordersCount,
    aov,
    revenueTrend: Array.from(byDay.values()),
    topProducts,
  };
}

async function getInventoryViaQueries(
  supabase: SupabaseClient
): Promise<AnalyticsInventoryData> {
  const todayYmd = ymdInTimeZone(new Date());
  const rangeStartYmd = addCalendarDays(
    todayYmd,
    -(ANALYTICS_INVENTORY_DAYS - 1)
  );
  const rangeStartIso = startOfDayIso(rangeStartYmd);
  const deadCutoffIso = new Date(
    Date.now() - ANALYTICS_DEAD_STOCK_DAYS * 24 * 60 * 60 * 1000
  ).toISOString();

  const [variantsResult, soldResult] = await Promise.all([
    supabase
      .from("product_variants")
      .select(
        "id, sku, size, color, stock_quantity, is_active, products(name)"
      )
      .eq("is_active", true),
    supabase
      .from("order_items")
      .select(
        "variant_id, quantity, orders!inner(payment_status, created_at)"
      )
      .eq("orders.payment_status", "paid")
      .not("variant_id", "is", null),
  ]);

  if (variantsResult.error) {
    throw new Error(variantsResult.error.message);
  }
  if (soldResult.error) {
    throw new Error(soldResult.error.message);
  }

  const soldInWindow = new Map<string, number>();
  const lastSoldAt = new Map<string, string>();

  for (const item of soldResult.data ?? []) {
    const variantId = item.variant_id;
    if (!variantId) continue;
    const orderMeta = item.orders as
      | { payment_status: string; created_at: string }
      | Array<{ payment_status: string; created_at: string }>
      | null;
    const order = Array.isArray(orderMeta) ? orderMeta[0] : orderMeta;
    if (!order) continue;

    if (order.created_at >= rangeStartIso) {
      soldInWindow.set(
        variantId,
        (soldInWindow.get(variantId) ?? 0) + toNumber(item.quantity)
      );
    }

    const previous = lastSoldAt.get(variantId);
    if (!previous || order.created_at > previous) {
      lastSoldAt.set(variantId, order.created_at);
    }
  }

  const turnover: AnalyticsTurnoverRow[] = (variantsResult.data ?? [])
    .map((variant) => {
      const unitsSold = soldInWindow.get(variant.id) ?? 0;
      const stock = toNumber(variant.stock_quantity);
      return {
        variant_id: variant.id,
        sku: variant.sku,
        product_name: normalizeProductName(variant.products),
        size: variant.size,
        color: variant.color,
        stock,
        units_sold: unitsSold,
        turnover_ratio:
          Math.round((unitsSold / Math.max(stock, 1)) * 100) / 100,
      };
    })
    .sort(
      (a, b) =>
        b.turnover_ratio - a.turnover_ratio || b.units_sold - a.units_sold
    )
    .slice(0, 12);

  const deadStock: AnalyticsDeadStockRow[] = (variantsResult.data ?? [])
    .filter((variant) => toNumber(variant.stock_quantity) > 0)
    .map((variant) => {
      const last = lastSoldAt.get(variant.id) ?? null;
      return {
        variant_id: variant.id,
        sku: variant.sku,
        product_name: normalizeProductName(variant.products),
        size: variant.size,
        color: variant.color,
        stock: toNumber(variant.stock_quantity),
        last_sold_at: last,
      };
    })
    .filter(
      (row) => !row.last_sold_at || row.last_sold_at < deadCutoffIso
    )
    .sort((a, b) => b.stock - a.stock)
    .slice(0, 20);

  return { turnover, deadStock };
}

async function getCustomersViaQueries(
  supabase: SupabaseClient
): Promise<AnalyticsCustomersData> {
  const { data, error } = await supabase
    .from("orders")
    .select("customer_id, created_at")
    .eq("payment_status", "paid")
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  const orders = data ?? [];
  const firstOrderByCustomer = new Map<string, string>();
  const orderCountByCustomer = new Map<string, number>();

  for (const order of orders) {
    orderCountByCustomer.set(
      order.customer_id,
      (orderCountByCustomer.get(order.customer_id) ?? 0) + 1
    );
    if (!firstOrderByCustomer.has(order.customer_id)) {
      firstOrderByCustomer.set(
        order.customer_id,
        ymdInTimeZone(new Date(order.created_at))
      );
    }
  }

  const customersWithOrders = orderCountByCustomer.size;
  let customersWithRepeat = 0;
  Array.from(orderCountByCustomer.values()).forEach((count) => {
    if (count >= 2) customersWithRepeat += 1;
  });

  const repeatPurchaseRate =
    customersWithOrders === 0
      ? 0
      : Math.round((customersWithRepeat / customersWithOrders) * 10000) /
        10000;

  const currentMonth = yearMonthInTimeZone(new Date());
  const startMonth = addMonths(currentMonth, -(ANALYTICS_CUSTOMER_MONTHS - 1));
  const periods: string[] = [];
  for (let i = 0; i < ANALYTICS_CUSTOMER_MONTHS; i += 1) {
    periods.push(addMonths(startMonth, i));
  }

  const periodCustomers = new Map<
    string,
    { newIds: Set<string>; returningIds: Set<string> }
  >();
  for (const period of periods) {
    periodCustomers.set(period, {
      newIds: new Set(),
      returningIds: new Set(),
    });
  }

  for (const order of orders) {
    const period = yearMonthInTimeZone(new Date(order.created_at));
    const bucket = periodCustomers.get(period);
    if (!bucket) continue;
    const firstYmd = firstOrderByCustomer.get(order.customer_id);
    const firstPeriod = firstYmd?.slice(0, 7);
    if (firstPeriod === period) {
      bucket.newIds.add(order.customer_id);
    } else {
      bucket.returningIds.add(order.customer_id);
    }
  }

  const newVsReturning: AnalyticsNewVsReturningPoint[] = periods.map(
    (period) => {
      const bucket = periodCustomers.get(period)!;
      return {
        period,
        new: bucket.newIds.size,
        returning: bucket.returningIds.size,
      };
    }
  );

  const cohortCustomers = new Map<string, Set<string>>();
  Array.from(firstOrderByCustomer.entries()).forEach(([customerId, firstYmd]) => {
    const cohortMonth = firstYmd.slice(0, 7);
    if (cohortMonth < startMonth) return;
    const set = cohortCustomers.get(cohortMonth) ?? new Set();
    set.add(customerId);
    cohortCustomers.set(cohortMonth, set);
  });

  const cohorts: AnalyticsCohortRow[] = periods
    .map((cohortMonth) => {
      const customers = cohortCustomers.get(cohortMonth) ?? new Set();
      let repeatCustomers = 0;
      Array.from(customers).forEach((customerId) => {
        const laterOrder = orders.some((order) => {
          if (order.customer_id !== customerId) return false;
          return yearMonthInTimeZone(new Date(order.created_at)) > cohortMonth;
        });
        if (laterOrder) repeatCustomers += 1;
      });
      const size = customers.size;
      return {
        cohort_month: cohortMonth,
        customers: size,
        repeat_customers: repeatCustomers,
        repeat_rate:
          size === 0
            ? 0
            : Math.round((repeatCustomers / size) * 10000) / 10000,
      };
    })
    .filter((row) => row.customers > 0);

  return {
    customersWithOrders,
    customersWithRepeat,
    repeatPurchaseRate,
    newVsReturning,
    cohorts,
  };
}

async function getSalesAnalytics(
  supabase: SupabaseClient
): Promise<AnalyticsSalesData> {
  const { data, error } = await supabase.rpc("admin_analytics_sales", {
    p_days: ANALYTICS_SALES_DAYS,
  });

  if (!error) {
    const parsed = parseSalesRpc(data);
    if (parsed) return parsed;
  }

  if (error && !isMissingRpcError(error.message)) {
    console.error("admin_analytics_sales failed:", error.message);
  }

  return getSalesViaQueries(supabase);
}

async function getInventoryAnalytics(
  supabase: SupabaseClient
): Promise<AnalyticsInventoryData> {
  const { data, error } = await supabase.rpc("admin_analytics_inventory", {
    p_days: ANALYTICS_INVENTORY_DAYS,
  });

  if (!error) {
    const parsed = parseInventoryRpc(data);
    if (parsed) return parsed;
  }

  if (error && !isMissingRpcError(error.message)) {
    console.error("admin_analytics_inventory failed:", error.message);
  }

  return getInventoryViaQueries(supabase);
}

async function getCustomersAnalytics(
  supabase: SupabaseClient
): Promise<AnalyticsCustomersData> {
  const { data, error } = await supabase.rpc("admin_analytics_customers", {
    p_months: ANALYTICS_CUSTOMER_MONTHS,
  });

  if (!error) {
    const parsed = parseCustomersRpc(data);
    if (parsed) return parsed;
  }

  if (error && !isMissingRpcError(error.message)) {
    console.error("admin_analytics_customers failed:", error.message);
  }

  return getCustomersViaQueries(supabase);
}

export async function getAdminAnalyticsData(): Promise<AdminAnalyticsData> {
  const supabase = await assertAdmin();

  const [sales, inventory, customers] = await Promise.all([
    getSalesAnalytics(supabase),
    getInventoryAnalytics(supabase),
    getCustomersAnalytics(supabase),
  ]);

  return { sales, inventory, customers };
}
