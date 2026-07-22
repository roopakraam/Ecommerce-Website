import { createServerClient } from "@/lib/supabase/server";
import type {
  Customer,
  Order,
  OrderItem,
  OrderStatus,
  ShippingAddress,
} from "@/types";

export { ORDER_STATUSES, isOrderStatus } from "@/lib/orders/status";

export interface AdminOrderCustomer {
  id: string;
  full_name: string | null;
  phone: string | null;
}

export interface AdminOrderListItem extends Order {
  customers: AdminOrderCustomer | null;
}

export interface AdminOrderDetail extends Order {
  customers: AdminOrderCustomer | null;
  order_items: OrderItem[];
}

export interface AdminOrderListOptions {
  status?: OrderStatus | "all";
  search?: string;
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

function sanitizeSearch(value: string): string {
  return value.trim().replace(/[%_,]/g, " ").replace(/\s+/g, " ");
}

function normalizeCustomer(
  value: AdminOrderCustomer | AdminOrderCustomer[] | null | undefined
): AdminOrderCustomer | null {
  if (!value) {
    return null;
  }
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

export async function getAdminOrders(
  options: AdminOrderListOptions = {}
): Promise<AdminOrderListItem[]> {
  const supabase = await assertAdmin();
  const status = options.status && options.status !== "all" ? options.status : null;
  const search = options.search ? sanitizeSearch(options.search) : "";

  let customerIds: string[] | null = null;

  if (search) {
    const { data: customers, error: customersError } = await supabase
      .from("customers")
      .select("id")
      .or(`full_name.ilike.%${search}%,phone.ilike.%${search}%`);

    if (customersError) {
      console.error("Failed to search customers:", customersError.message);
      throw new Error("Failed to search orders.");
    }

    customerIds = ((customers ?? []) as Array<{ id: string }>).map(
      (row) => row.id
    );

    if (customerIds.length === 0) {
      return [];
    }
  }

  let query = supabase
    .from("orders")
    .select(
      "id, customer_id, status, subtotal, shipping_fee, total, payment_status, payment_provider, payment_reference, shipping_address, created_at, customers(id, full_name, phone)"
    )
    .order("created_at", { ascending: false });

  if (status) {
    query = query.eq("status", status);
  }

  if (customerIds) {
    query = query.in("customer_id", customerIds);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Failed to fetch admin orders:", error.message);
    throw new Error("Failed to load orders.");
  }

  return ((data ?? []) as unknown as AdminOrderListItem[]).map((order) => ({
    ...order,
    customers: normalizeCustomer(order.customers),
  }));
}

export async function getAdminOrderById(
  id: string
): Promise<AdminOrderDetail | null> {
  const supabase = await assertAdmin();

  const { data, error } = await supabase
    .from("orders")
    .select(
      "id, customer_id, status, subtotal, shipping_fee, total, payment_status, payment_provider, payment_reference, shipping_address, created_at, customers(id, full_name, phone), order_items(id, order_id, product_id, variant_id, product_name_snapshot, size_snapshot, color_snapshot, sku_snapshot, unit_price, quantity)"
    )
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("Failed to fetch admin order:", error.message);
    throw new Error("Failed to load order.");
  }

  if (!data) {
    return null;
  }

  const order = data as unknown as AdminOrderDetail;
  return {
    ...order,
    customers: normalizeCustomer(order.customers),
    order_items: [...(order.order_items ?? [])],
  };
}

export async function updateAdminOrderStatus(
  orderId: string,
  status: OrderStatus
): Promise<{
  order: AdminOrderDetail;
  previousStatus: OrderStatus;
}> {
  const supabase = await assertAdmin();

  const existing = await getAdminOrderById(orderId);
  if (!existing) {
    throw new Error("Order not found.");
  }

  const previousStatus = existing.status;

  if (previousStatus === status) {
    return { order: existing, previousStatus };
  }

  const { error } = await supabase
    .from("orders")
    .update({ status })
    .eq("id", orderId);

  if (error) {
    console.error("Failed to update order status:", error.message);
    throw new Error("Failed to update order status.");
  }

  const updated = await getAdminOrderById(orderId);
  if (!updated) {
    throw new Error("Order not found after update.");
  }

  return { order: updated, previousStatus };
}

export type { Customer, ShippingAddress };
