import { createAdminClient } from "@/lib/supabase/admin";
import { createServerClient } from "@/lib/supabase/server";
import type {
  Order,
  OrderItem,
  OrderStatus,
  PaymentStatus,
  ShippingAddress,
} from "@/types";

export interface OrderForPayment {
  id: string;
  customer_id: string;
  total: number;
  payment_status: PaymentStatus;
  status: Order["status"];
  payment_reference: string | null;
  inventory_reserved: boolean;
}

export interface OrderConfirmation {
  id: string;
  customer_id: string;
  status: OrderStatus;
  subtotal: number;
  shipping_fee: number;
  total: number;
  payment_status: PaymentStatus;
  payment_provider: string | null;
  payment_reference: string | null;
  shipping_address: ShippingAddress;
  created_at: string;
  order_items: OrderItem[];
}

export type OrderAccessResult =
  | { ok: true; isAdmin: boolean; customerId: string | null; authUserId: string }
  | { ok: false; status: 401 | 403; error: string };

/**
 * Requires an authenticated user who owns the order (customer) or is an admin.
 * Used by payment routes and order confirmation to prevent IDOR.
 */
export async function requireOrderOwnerOrAdmin(
  orderId: string
): Promise<OrderAccessResult & { order?: OrderForPayment }> {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, status: 401, error: "Please sign in to continue." };
  }

  const admin = createAdminClient();

  const [{ data: adminRow }, { data: customer }, order] = await Promise.all([
    admin
      .from("admin_users")
      .select("id")
      .eq("auth_user_id", user.id)
      .maybeSingle(),
    admin
      .from("customers")
      .select("id")
      .eq("auth_user_id", user.id)
      .maybeSingle(),
    getOrderForPayment(orderId),
  ]);

  if (!order) {
    return { ok: false, status: 403, error: "Order not found." };
  }

  const isAdmin = Boolean(adminRow);
  const customerId =
    customer && typeof customer === "object" && "id" in customer
      ? (customer.id as string)
      : null;

  if (!isAdmin && order.customer_id !== customerId) {
    return { ok: false, status: 403, error: "You do not have access to this order." };
  }

  return {
    ok: true,
    isAdmin,
    customerId,
    authUserId: user.id,
    order,
  };
}

export async function getOrderConfirmation(
  orderId: string
): Promise<OrderConfirmation | null> {
  const access = await requireOrderOwnerOrAdmin(orderId);
  if (!access.ok) {
    return null;
  }

  const admin = createAdminClient();

  const { data, error } = await admin
    .from("orders")
    .select(
      "id, customer_id, status, subtotal, shipping_fee, total, payment_status, payment_provider, payment_reference, shipping_address, created_at, order_items(id, order_id, product_id, variant_id, product_name_snapshot, size_snapshot, color_snapshot, sku_snapshot, unit_price, quantity)"
    )
    .eq("id", orderId)
    .maybeSingle();

  if (error) {
    console.error("Failed to fetch order confirmation:", error.message);
    return null;
  }

  return data as OrderConfirmation | null;
}

export async function getOrderForPayment(
  orderId: string
): Promise<OrderForPayment | null> {
  const admin = createAdminClient();

  const { data, error } = await admin
    .from("orders")
    .select(
      "id, customer_id, total, payment_status, status, payment_reference, inventory_reserved"
    )
    .eq("id", orderId)
    .maybeSingle();

  if (error) {
    console.error("Failed to fetch order:", error.message);
    return null;
  }

  return data as OrderForPayment | null;
}

export async function getOrderByPaymentReference(
  razorpayOrderId: string
): Promise<OrderForPayment | null> {
  const admin = createAdminClient();

  const { data, error } = await admin
    .from("orders")
    .select(
      "id, customer_id, total, payment_status, status, payment_reference, inventory_reserved"
    )
    .eq("payment_reference", razorpayOrderId)
    .maybeSingle();

  if (error) {
    console.error("Failed to fetch order by payment reference:", error.message);
    return null;
  }

  return data as OrderForPayment | null;
}

export async function setOrderPaymentReference(
  orderId: string,
  razorpayOrderId: string
): Promise<boolean> {
  const admin = createAdminClient();

  const { data, error } = await admin
    .from("orders")
    .update({ payment_reference: razorpayOrderId })
    .eq("id", orderId)
    .in("payment_status", ["pending", "failed"])
    .select("id");

  if (error) {
    console.error("Failed to update payment reference:", error.message);
    return false;
  }

  return Array.isArray(data) && data.length > 0;
}

export async function reserveOrderInventory(orderId: string): Promise<
  { ok: true } | { ok: false; error: string }
> {
  const admin = createAdminClient();

  const { error } = await admin.rpc("reserve_order_inventory", {
    p_order_id: orderId,
  });

  if (error) {
    console.error("Failed to reserve inventory:", error.message);
    return {
      ok: false,
      error: error.message.includes("Insufficient stock")
        ? error.message
        : "Failed to reserve stock for this order.",
    };
  }

  return { ok: true };
}

export async function releaseOrderInventory(orderId: string): Promise<boolean> {
  const admin = createAdminClient();

  const { error } = await admin.rpc("release_order_inventory", {
    p_order_id: orderId,
  });

  if (error) {
    console.error("Failed to release inventory:", error.message);
    return false;
  }

  return true;
}

export type ConfirmPaymentResult =
  | { ok: true; alreadyPaid: boolean }
  | { ok: false; error: string };

/**
 * Idempotent mark-paid used by verify route and Razorpay webhook.
 * Detects 0-row updates and treats already-paid as success.
 */
export async function confirmOrderPaymentPaid(params: {
  orderId: string;
  razorpayPaymentId: string;
  razorpayOrderId: string;
}): Promise<ConfirmPaymentResult> {
  const admin = createAdminClient();

  const existing = await getOrderForPayment(params.orderId);
  if (!existing) {
    return { ok: false, error: "Order not found." };
  }

  if (existing.payment_status === "paid") {
    return { ok: true, alreadyPaid: true };
  }

  if (
    !existing.payment_reference ||
    existing.payment_reference !== params.razorpayOrderId
  ) {
    return {
      ok: false,
      error: "Razorpay order does not match this checkout.",
    };
  }

  const { data, error } = await admin
    .from("orders")
    .update({
      payment_status: "paid",
      status: "confirmed",
      payment_reference: params.razorpayPaymentId,
      payment_provider: "razorpay",
    })
    .eq("id", params.orderId)
    .eq("payment_reference", params.razorpayOrderId)
    .in("payment_status", ["pending", "failed"])
    .select("id");

  if (error) {
    console.error("Failed to mark order paid:", error.message);
    return { ok: false, error: "Failed to update order payment status." };
  }

  if (!Array.isArray(data) || data.length === 0) {
    const again = await getOrderForPayment(params.orderId);
    if (again?.payment_status === "paid") {
      return { ok: true, alreadyPaid: true };
    }
    return { ok: false, error: "Failed to update order payment status." };
  }

  return { ok: true, alreadyPaid: false };
}

/** @deprecated Prefer confirmOrderPaymentPaid for idempotent verify/webhook path. */
export async function markOrderPaymentPaid(params: {
  orderId: string;
  razorpayPaymentId: string;
  razorpayOrderId: string;
}): Promise<boolean> {
  const result = await confirmOrderPaymentPaid(params);
  return result.ok;
}

export async function markOrderPaymentFailed(
  orderId: string
): Promise<boolean> {
  const existing = await getOrderForPayment(orderId);
  if (!existing) {
    return false;
  }

  if (existing.payment_status === "paid") {
    return false;
  }

  if (existing.payment_status === "failed") {
    return true;
  }

  const admin = createAdminClient();

  const { data, error } = await admin
    .from("orders")
    .update({ payment_status: "failed" })
    .eq("id", orderId)
    .eq("payment_status", "pending")
    .select("id");

  if (error) {
    console.error("Failed to mark order payment failed:", error.message);
    return false;
  }

  if (!Array.isArray(data) || data.length === 0) {
    const again = await getOrderForPayment(orderId);
    return again?.payment_status === "failed";
  }

  await releaseOrderInventory(orderId);
  return true;
}
