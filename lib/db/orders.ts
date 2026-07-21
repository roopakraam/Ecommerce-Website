import { createAdminClient } from "@/lib/supabase/admin";
import type { Order, OrderItem, OrderStatus, PaymentStatus, ShippingAddress } from "@/types";

export interface OrderForPayment {
  id: string;
  total: number;
  payment_status: PaymentStatus;
  status: Order["status"];
  payment_reference: string | null;
}

export interface OrderConfirmation {
  id: string;
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

export async function getOrderConfirmation(
  orderId: string
): Promise<OrderConfirmation | null> {
  const admin = createAdminClient();

  const { data, error } = await admin
    .from("orders")
    .select(
      "id, status, subtotal, shipping_fee, total, payment_status, payment_provider, payment_reference, shipping_address, created_at, order_items(id, order_id, product_id, product_name_snapshot, unit_price, quantity)"
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
    .select("id, total, payment_status, status, payment_reference")
    .eq("id", orderId)
    .maybeSingle();

  if (error) {
    console.error("Failed to fetch order:", error.message);
    return null;
  }

  return data as OrderForPayment | null;
}

export async function setOrderPaymentReference(
  orderId: string,
  razorpayOrderId: string
): Promise<boolean> {
  const admin = createAdminClient();

  const { error } = await admin
    .from("orders")
    .update({ payment_reference: razorpayOrderId })
    .eq("id", orderId);

  if (error) {
    console.error("Failed to update payment reference:", error.message);
    return false;
  }

  return true;
}

export async function markOrderPaymentPaid(params: {
  orderId: string;
  razorpayPaymentId: string;
  razorpayOrderId: string;
}): Promise<boolean> {
  const admin = createAdminClient();

  const { error } = await admin
    .from("orders")
    .update({
      payment_status: "paid",
      status: "confirmed",
      payment_reference: params.razorpayPaymentId,
      payment_provider: "razorpay",
    })
    .eq("id", params.orderId)
    .in("payment_status", ["pending", "failed"]);

  if (error) {
    console.error("Failed to mark order paid:", error.message);
    return false;
  }

  return true;
}

export async function markOrderPaymentFailed(
  orderId: string
): Promise<boolean> {
  const admin = createAdminClient();

  const { error } = await admin
    .from("orders")
    .update({ payment_status: "failed" })
    .eq("id", orderId)
    .in("payment_status", ["pending", "failed"]);

  if (error) {
    console.error("Failed to mark order payment failed:", error.message);
    return false;
  }

  return true;
}
