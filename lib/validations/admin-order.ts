import { z } from "zod";

export const updateOrderStatusSchema = z.object({
  orderId: z.string().uuid("Invalid order id"),
  status: z.enum([
    "pending",
    "confirmed",
    "shipped",
    "delivered",
    "cancelled",
  ]),
});

export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>;

export const updateOrderNotesSchema = z.object({
  orderId: z.string().uuid("Invalid order id"),
  internalNotes: z.string().max(5000, "Notes must be 5000 characters or fewer"),
});

export type UpdateOrderNotesInput = z.infer<typeof updateOrderNotesSchema>;

export const refundAdminOrderSchema = z.object({
  orderId: z.string().uuid("Invalid order id"),
  reason: z
    .string()
    .max(500, "Reason must be 500 characters or fewer")
    .optional(),
});

export type RefundAdminOrderInput = z.infer<typeof refundAdminOrderSchema>;
