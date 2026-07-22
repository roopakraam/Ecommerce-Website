import { NextResponse } from "next/server";
import {
  requireOrderOwnerOrAdmin,
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
    const access = await requireOrderOwnerOrAdmin(orderId);

    if (!access.ok) {
      return NextResponse.json(
        { error: access.error },
        { status: access.status }
      );
    }

    const order = access.order!;

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

    // Reuse existing Razorpay order when payment_reference is still the order id
    if (
      order.payment_reference &&
      order.payment_reference.startsWith("order_")
    ) {
      const amountInPaise = rupeesToPaise(order.total);
      return NextResponse.json({
        keyId: getRazorpayKeyId(),
        razorpayOrderId: order.payment_reference,
        amount: amountInPaise,
        currency: "INR",
        orderTotal: order.total,
      });
    }

    const razorpay = getRazorpayClient();
    const amountInPaise = rupeesToPaise(order.total);

    const razorpayOrder = await razorpay.orders.create({
      amount: amountInPaise,
      currency: "INR",
      receipt: orderId.slice(0, 40),
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
