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
