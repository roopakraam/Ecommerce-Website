import { NextResponse } from "next/server";
import {
  getOrderForPayment,
  setOrderPaymentReference,
} from "@/lib/db/orders";
import {
  getRazorpayClient,
  getRazorpayKeyId,
  rupeesToPaise,
} from "@/lib/razorpay/client";
import { createRazorpayOrderSchema } from "@/lib/validations/payment";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = createRazorpayOrderSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid payload." },
        { status: 400 }
      );
    }

    const { orderId } = parsed.data;
    const order = await getOrderForPayment(orderId);

    if (!order) {
      return NextResponse.json({ error: "Order not found." }, { status: 404 });
    }

    if (order.payment_status === "paid") {
      return NextResponse.json(
        { error: "This order has already been paid." },
        { status: 400 }
      );
    }

    if (!["pending", "failed"].includes(order.payment_status)) {
      return NextResponse.json(
        { error: "This order cannot be paid at this time." },
        { status: 400 }
      );
    }

    const razorpay = getRazorpayClient();
    const amountInPaise = rupeesToPaise(order.total);

    const razorpayOrder = await razorpay.orders.create({
      amount: amountInPaise,
      currency: "INR",
      receipt: orderId,
      notes: {
        supabase_order_id: orderId,
      },
    });

    const saved = await setOrderPaymentReference(orderId, razorpayOrder.id);
    if (!saved) {
      return NextResponse.json(
        { error: "Failed to link Razorpay order." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      keyId: getRazorpayKeyId(),
      razorpayOrderId: razorpayOrder.id,
      amount: amountInPaise,
      currency: "INR",
      orderTotal: order.total,
    });
  } catch (error) {
    console.error("Razorpay create-order failed:", error);
    return NextResponse.json(
      { error: "Failed to create Razorpay order." },
      { status: 500 }
    );
  }
}
