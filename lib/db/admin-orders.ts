import { createServerClient } from "@/lib/supabase/server";
import type {
  AuditLog,
  Customer,
  Order,
  OrderItem,
  OrderStatus,
  ShippingAddress,
} from "@/types";

export { ORDER_STATUSES, isOrderStatus } from "@/lib/orders/status";

/** Base columns present without the notes/audit migration. */
const ORDER_SELECT_LIST =
  "id, customer_id, status, subtotal, shipping_fee, total, payment_status, payment_provider, payment_reference, shipping_address, inventory_reserved, created_at, customers(id, full_name, phone)";

const ORDER_SELECT_DETAIL = `${ORDER_SELECT_LIST}, order_items(id, order_id, product_id, variant_id, product_name_snapshot, size_snapshot, color_snapshot, sku_snapshot, unit_price, quantity)`;

function isMissingColumnError(message: string, column: string): boolean {
  return message.toLowerCase().includes(column.toLowerCase());
}

function isMissingRelationError(message: string, relation: string): boolean {
  const lower = message.toLowerCase();
  return (
    lower.includes(relation.toLowerCase()) &&
    (lower.includes("does not exist") || lower.includes("schema cache"))
  );
}

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
  /** YYYY-MM-DD inclusive start (Asia/Kolkata calendar day) */
  fromDate?: string;
  /** YYYY-MM-DD inclusive end (Asia/Kolkata calendar day) */
  toDate?: string;
}

export interface AdminOrderAuditEntry extends AuditLog {
  actor_email: string | null;
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

  return { supabase, user };
}

function sanitizeSearch(value: string): string {
  return value.trim().replace(/[%_,]/g, " ").replace(/\s+/g, " ");
}

function isYmd(value: string | undefined): value is string {
  return Boolean(value && /^\d{4}-\d{2}-\d{2}$/.test(value));
}

function startOfDayIso(ymd: string): string {
  return new Date(`${ymd}T00:00:00+05:30`).toISOString();
}

function endOfDayExclusiveIso(ymd: string): string {
  const date = new Date(`${ymd}T00:00:00+05:30`);
  date.setUTCDate(date.getUTCDate() + 1);
  return date.toISOString();
}

function normalizeCustomer(
  value: AdminOrderCustomer | AdminOrderCustomer[] | null | undefined
): AdminOrderCustomer | null {
  if (!value) {
    return null;
  }
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

async function writeAuditLog(
  supabase: Awaited<ReturnType<typeof assertAdmin>>["supabase"],
  input: {
    entityType: string;
    entityId: string;
    action: string;
    actorAuthUserId: string;
    previousValues?: Record<string, unknown> | null;
    newValues?: Record<string, unknown> | null;
    metadata?: Record<string, unknown> | null;
  }
) {
  const { error } = await supabase.from("audit_logs").insert({
    entity_type: input.entityType,
    entity_id: input.entityId,
    action: input.action,
    actor_auth_user_id: input.actorAuthUserId,
    previous_values: input.previousValues ?? null,
    new_values: input.newValues ?? null,
    metadata: input.metadata ?? null,
  });

  if (error) {
    console.error("Failed to write audit log:", error.message);
    // Status/notes updates still succeed if audit_logs isn't migrated yet.
    if (isMissingRelationError(error.message, "audit_logs")) {
      return;
    }
    throw new Error("Failed to write audit log.");
  }
}

export async function getAdminOrders(
  options: AdminOrderListOptions = {}
): Promise<AdminOrderListItem[]> {
  const { supabase } = await assertAdmin();
  const status =
    options.status && options.status !== "all" ? options.status : null;
  const search = options.search ? sanitizeSearch(options.search) : "";
  const fromDate = isYmd(options.fromDate) ? options.fromDate : null;
  const toDate = isYmd(options.toDate) ? options.toDate : null;

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
    .select(ORDER_SELECT_LIST)
    .order("created_at", { ascending: false });

  if (status) {
    query = query.eq("status", status);
  }

  if (customerIds) {
    query = query.in("customer_id", customerIds);
  }

  if (fromDate) {
    query = query.gte("created_at", startOfDayIso(fromDate));
  }

  if (toDate) {
    query = query.lt("created_at", endOfDayExclusiveIso(toDate));
  }

  const { data, error } = await query;

  if (error) {
    console.error("Failed to fetch admin orders:", error.message);
    throw new Error("Failed to load orders.");
  }

  return ((data ?? []) as unknown as AdminOrderListItem[]).map((order) => ({
    ...order,
    internal_notes: "",
    customers: normalizeCustomer(order.customers),
  }));
}

async function fetchInternalNotes(
  supabase: Awaited<ReturnType<typeof assertAdmin>>["supabase"],
  orderId: string
): Promise<string> {
  const { data, error } = await supabase
    .from("orders")
    .select("internal_notes")
    .eq("id", orderId)
    .maybeSingle();

  if (error) {
    if (isMissingColumnError(error.message, "internal_notes")) {
      return "";
    }
    console.error("Failed to load order notes:", error.message);
    return "";
  }

  const notes = (data as { internal_notes?: string | null } | null)
    ?.internal_notes;
  return notes ?? "";
}

export async function getAdminOrderById(
  id: string
): Promise<AdminOrderDetail | null> {
  const { supabase } = await assertAdmin();

  const { data, error } = await supabase
    .from("orders")
    .select(ORDER_SELECT_DETAIL)
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
  const internalNotes = await fetchInternalNotes(supabase, id);

  return {
    ...order,
    internal_notes: internalNotes,
    customers: normalizeCustomer(order.customers),
    order_items: [...(order.order_items ?? [])],
  };
}

export async function getAdminOrderAuditLogs(
  orderId: string
): Promise<AdminOrderAuditEntry[]> {
  const { supabase } = await assertAdmin();

  const { data, error } = await supabase
    .from("audit_logs")
    .select("*")
    .eq("entity_type", "order")
    .eq("entity_id", orderId)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    console.error("Failed to load order audit logs:", error.message);
    if (isMissingRelationError(error.message, "audit_logs")) {
      return [];
    }
    throw new Error("Failed to load order history.");
  }

  const logs = (data ?? []) as AuditLog[];

  return logs.map((log) => ({
    ...log,
    actor_email:
      typeof log.metadata?.actor_email === "string"
        ? log.metadata.actor_email
        : null,
  }));
}

export async function updateAdminOrderStatus(
  orderId: string,
  status: OrderStatus
): Promise<{
  order: AdminOrderDetail;
  previousStatus: OrderStatus;
}> {
  const { supabase, user } = await assertAdmin();

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

  await writeAuditLog(supabase, {
    entityType: "order",
    entityId: orderId,
    action: "status_changed",
    actorAuthUserId: user.id,
    previousValues: { status: previousStatus },
    newValues: { status },
    metadata: {
      actor_email: user.email ?? null,
    },
  });

  const updated = await getAdminOrderById(orderId);
  if (!updated) {
    throw new Error("Order not found after update.");
  }

  return { order: updated, previousStatus };
}

export async function updateAdminOrderInternalNotes(
  orderId: string,
  internalNotes: string
): Promise<AdminOrderDetail> {
  const { supabase, user } = await assertAdmin();

  const existing = await getAdminOrderById(orderId);
  if (!existing) {
    throw new Error("Order not found.");
  }

  const nextNotes = internalNotes.trim();
  const previousNotes = existing.internal_notes ?? "";

  if (previousNotes === nextNotes) {
    return existing;
  }

  const { error } = await supabase
    .from("orders")
    .update({ internal_notes: nextNotes })
    .eq("id", orderId);

  if (error) {
    console.error("Failed to update order notes:", error.message);
    if (isMissingColumnError(error.message, "internal_notes")) {
      throw new Error(
        "Internal notes require migration 20260722094000_order_notes_and_audit_logs.sql."
      );
    }
    throw new Error("Failed to update internal notes.");
  }

  await writeAuditLog(supabase, {
    entityType: "order",
    entityId: orderId,
    action: "notes_updated",
    actorAuthUserId: user.id,
    previousValues: { internal_notes: previousNotes },
    newValues: { internal_notes: nextNotes },
    metadata: {
      actor_email: user.email ?? null,
    },
  });

  const updated = await getAdminOrderById(orderId);
  if (!updated) {
    throw new Error("Order not found after notes update.");
  }

  return updated;
}

export type { Customer, ShippingAddress };
