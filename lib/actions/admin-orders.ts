"use server";

import { revalidatePath } from "next/cache";
import {
  updateAdminOrderInternalNotes,
  updateAdminOrderStatus,
} from "@/lib/db/admin-orders";
import { ADMIN_ORDERS_PATH } from "@/lib/admin/orders";
import { notifyOrderStatusChange } from "@/lib/notifications/order-status";
import {
  updateOrderNotesSchema,
  updateOrderStatusSchema,
} from "@/lib/validations/admin-order";
import type { OrderStatus } from "@/types";

export type UpdateOrderStatusResult =
  | { success: true; status: OrderStatus }
  | { success: false; error: string };

export type UpdateOrderNotesResult =
  | { success: true }
  | { success: false; error: string };

function revalidateOrderPaths(orderId: string) {
  revalidatePath(ADMIN_ORDERS_PATH);
  revalidatePath(`${ADMIN_ORDERS_PATH}/${orderId}`);
  revalidatePath("/admin/dashboard/orders");
  revalidatePath(`/admin/dashboard/orders/${orderId}`);
  revalidatePath("/admin/dashboard");
}

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

    revalidateOrderPaths(order.id);

    return { success: true, status: order.status };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to update order status.",
    };
  }
}

export async function updateOrderNotesAction(input: {
  orderId: string;
  internalNotes: string;
}): Promise<UpdateOrderNotesResult> {
  const parsed = updateOrderNotesSchema.safeParse(input);

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Invalid notes.",
    };
  }

  try {
    const order = await updateAdminOrderInternalNotes(
      parsed.data.orderId,
      parsed.data.internalNotes
    );
    revalidateOrderPaths(order.id);
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to update internal notes.",
    };
  }
}
