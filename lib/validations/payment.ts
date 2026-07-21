import { z } from "zod";

export const createRazorpayOrderSchema = z.object({
  orderId: z.string().uuid("Invalid order id"),
});

export const verifyRazorpayPaymentSchema = z.object({
  orderId: z.string().uuid("Invalid order id"),
  razorpay_order_id: z.string().min(1, "Missing Razorpay order id"),
  razorpay_payment_id: z.string().min(1, "Missing Razorpay payment id"),
  razorpay_signature: z.string().min(1, "Missing Razorpay signature"),
});

export const failRazorpayPaymentSchema = z.object({
  orderId: z.string().uuid("Invalid order id"),
});
