import { createServerClient } from "@/lib/supabase/server";
import { releaseOrderInventory } from "@/lib/db/orders";
import { createRazorpayRefund } from "@/lib/razorpay/client";
import type {
  AuditLog,
  Customer,
  Order,
  OrderItem,
  OrderStatus,
  PaymentStatus,
  ShippingAddress,
} from "@/types";

export { ORDER_STATUSES, isOrderStatus } from "@/lib/orders/status";

/** Base columns present without the notes/audit migration. */
const ORDER_SELECT_LIST =
  "id, customer_id, status, subtotal, shipping_fee, discount_amount, coupon_id, coupon_code, total, payment_status, payment_provider, payment_reference, shipping_address, inventory_reserved, created_at, customers(id, full_name, phone)";

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

  // Unpaid/pending reservations: release stock on cancel so checkout abandons
  // do not lock inventory forever. Paid+cancelled: do NOT auto-release —
  // refund-to-shelf is an explicit ops/refund decision, not implied by cancel.
  if (
    status === "cancelled" &&
    existing.inventory_reserved &&
    (existing.payment_status === "pending" ||
      existing.payment_status === "failed")
  ) {
    const released = await releaseOrderInventory(orderId);
    if (!released) {
      console.error(
        "Failed to release inventory after admin cancel for order:",
        orderId
      );
    }
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

export type RefundAdminOrderResult = {
  order: AdminOrderDetail;
  alreadyRefunded: boolean;
  previousPaymentStatus: PaymentStatus;
  previousStatus: OrderStatus;
  statusChanged: boolean;
  inventoryReleased: boolean;
  razorpayRefundId: string | null;
};

/**
 * Admin-triggered full Razorpay refund for a paid order.
 *
 * - Always sets payment_status to refunded on success.
 * - Sets order status to cancelled only when current status is pending or confirmed
 *   (does not auto-cancel shipped/delivered).
 * - Releases reserved inventory (restores stock) when inventory_reserved is still true.
 */
export async function refundAdminOrder(
  orderId: string,
  options: { reason?: string } = {}
): Promise<RefundAdminOrderResult> {
  const { supabase, user } = await assertAdmin();

  const existing = await getAdminOrderById(orderId);
  if (!existing) {
    throw new Error("Order not found.");
  }

  const previousPaymentStatus = existing.payment_status;
  const previousStatus = existing.status;

  if (previousPaymentStatus === "refunded") {
    return {
      order: existing,
      alreadyRefunded: true,
      previousPaymentStatus,
      previousStatus,
      statusChanged: false,
      inventoryReleased: false,
      razorpayRefundId: null,
    };
  }

  if (previousPaymentStatus !== "paid") {
    throw new Error("Only paid orders can be refunded.");
  }

  const paymentId = existing.payment_reference?.trim() ?? "";
  if (!paymentId.startsWith("pay_")) {
    throw new Error(
      "Order is missing a Razorpay payment id. Cannot issue a refund."
    );
  }

  if (existing.payment_provider && existing.payment_provider !== "razorpay") {
    throw new Error(
      `Refunds are only supported for Razorpay (got ${existing.payment_provider}).`
    );
  }

  const reason = options.reason?.trim() || undefined;
  const shouldCancel =
    previousStatus === "pending" || previousStatus === "confirmed";
  const nextStatus: OrderStatus = shouldCancel ? "cancelled" : previousStatus;

  // Claim the refund in DB first to prevent double Razorpay refunds on concurrent clicks.
  const claimPayload: {
    payment_status: PaymentStatus;
    status?: OrderStatus;
  } = {
    payment_status: "refunded",
  };
  if (shouldCancel) {
    claimPayload.status = "cancelled";
  }

  const { data: claimedRows, error: claimError } = await supabase
    .from("orders")
    .update(claimPayload)
    .eq("id", orderId)
    .eq("payment_status", "paid")
    .select("id");

  if (claimError) {
    console.error("Failed to claim refund lock:", orderId, claimError.message);
    throw new Error("Failed to update order for refund.");
  }

  if (!Array.isArray(claimedRows) || claimedRows.length === 0) {
    const again = await getAdminOrderById(orderId);
    if (again?.payment_status === "refunded") {
      return {
        order: again,
        alreadyRefunded: true,
        previousPaymentStatus,
        previousStatus,
        statusChanged: false,
        inventoryReleased: false,
        razorpayRefundId: null,
      };
    }
    throw new Error("Only paid orders can be refunded.");
  }

  let razorpayRefundId: string;
  try {
    const refund = await createRazorpayRefund({
      paymentId,
      // Full refund of the captured payment (avoids paise rounding drift vs order.total).
      receipt: orderId.replace(/-/g, "").slice(0, 40),
      notes: {
        order_id: orderId,
        ...(reason ? { reason } : {}),
        actor_email: user.email ?? "admin",
      },
    });
    razorpayRefundId = refund.id;
  } catch (error) {
    // Revert claim so the order can be retried.
    const revertPayload: {
      payment_status: PaymentStatus;
      status?: OrderStatus;
    } = {
      payment_status: "paid",
    };
    if (shouldCancel) {
      revertPayload.status = previousStatus;
    }
    await supabase
      .from("orders")
      .update(revertPayload)
      .eq("id", orderId)
      .eq("payment_status", "refunded");

    const message =
      error instanceof Error ? error.message : "Razorpay refund failed.";
    console.error("Razorpay refund failed for order:", orderId, message);
    throw new Error(
      message.toLowerCase().includes("razorpay")
        ? message
        : `Razorpay refund failed: ${message}`
    );
  }

  let inventoryReleased = false;
  if (existing.inventory_reserved) {
    inventoryReleased = await releaseOrderInventory(orderId);
    if (!inventoryReleased) {
      console.error(
        "Refund recorded but inventory release failed for order:",
        orderId
      );
    }
  }

  await writeAuditLog(supabase, {
    entityType: "order",
    entityId: orderId,
    action: "payment_refunded",
    actorAuthUserId: user.id,
    previousValues: {
      payment_status: previousPaymentStatus,
      status: previousStatus,
      inventory_reserved: existing.inventory_reserved,
    },
    newValues: {
      payment_status: "refunded",
      status: nextStatus,
      inventory_reserved: inventoryReleased
        ? false
        : existing.inventory_reserved,
    },
    metadata: {
      actor_email: user.email ?? null,
      razorpay_refund_id: razorpayRefundId,
      razorpay_payment_id: paymentId,
      reason: reason ?? null,
      inventory_released: inventoryReleased,
    },
  });

  const updated = await getAdminOrderById(orderId);
  if (!updated) {
    throw new Error("Order not found after refund.");
  }

  return {
    order: updated,
    alreadyRefunded: false,
    previousPaymentStatus,
    previousStatus,
    statusChanged: shouldCancel,
    inventoryReleased,
    razorpayRefundId,
  };
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
