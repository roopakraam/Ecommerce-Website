"use server";

import { revalidatePath } from "next/cache";
import { updateAdminOrderStatus } from "@/lib/db/admin-orders";
import { notifyOrderStatusChange } from "@/lib/notifications/order-status";
import { updateOrderStatusSchema } from "@/lib/validations/admin-order";
import type { OrderStatus } from "@/types";

export type UpdateOrderStatusResult =
  | { success: true; status: OrderStatus }
  | { success: false; error: string };

export async function updateOrderStatusAction(input: {
  orderId: string;
  status: string;
}): Promise<UpdateOrderStatusResult> {
  const parsed = updateOrderStatusSchema.safeParse(input);

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Invalid status update.",
    };
  }

  try {
    const { order, previousStatus } = await updateAdminOrderStatus(
      parsed.data.orderId,
      parsed.data.status
    );

    if (previousStatus !== order.status) {
      await notifyOrderStatusChange({
        orderId: order.id,
        previousStatus,
        nextStatus: order.status,
        customerName: order.customers?.full_name ?? null,
        customerPhone: order.customers?.phone ?? null,
      });
    }

    revalidatePath("/admin/dashboard/orders");
    revalidatePath(`/admin/dashboard/orders/${order.id}`);

    return { success: true, status: order.status };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to update order status.",
    };
  }
}
