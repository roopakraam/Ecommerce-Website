import type { OrderStatus } from "@/types";

export interface OrderStatusNotificationPayload {
  orderId: string;
  previousStatus: OrderStatus;
  nextStatus: OrderStatus;
  customerName: string | null;
  customerPhone: string | null;
}

/**
 * Stub for customer/admin notifications (email + WhatsApp).
 * Replace with real providers later without changing call sites.
 */
export async function notifyOrderStatusChange(
  payload: OrderStatusNotificationPayload
): Promise<void> {
  console.info("[notification:stub] order status change", {
    channel: ["email", "whatsapp"],
    ...payload,
  });
}
