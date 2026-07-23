import { NextResponse } from "next/server";
import {
  getOrderForPayment,
  requireOrderOwnerOrAdmin,
  reserveOrderInventory,
  setOrderPaymentReferenceIfEmpty,
} from "@/lib/db/orders";
import { logger } from "@/lib/logger";
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

    let order = access.order!;

    if (order.payment_status === "paid") {
      return NextResponse.json(
        { error: "This order has already been paid." },
        { status: 400 }
      );
    }

    if (order.status === "cancelled") {
      return NextResponse.json(
        { error: "This order was cancelled and cannot be paid." },
        { status: 400 }
      );
    }

    if (!["pending", "failed"].includes(order.payment_status)) {
      return NextResponse.json(
        { error: "This order cannot be paid at this time." },
        { status: 400 }
      );
    }

    if (!order.inventory_reserved) {
      const reserved = await reserveOrderInventory(orderId);
      if (!reserved.ok) {
        return NextResponse.json(
          {
            error:
              reserved.error ||
              "Stock is no longer available for this order.",
          },
          { status: 409 }
        );
      }
      const refreshed = await getOrderForPayment(orderId);
      if (refreshed) {
        order = refreshed;
      }
    }

    // Reuse existing Razorpay order when payment_reference is still the order id
    if (
      order.payment_reference &&
      order.payment_reference.startsWith("order_")
    ) {
      const amountInPaise = rupeesToPaise(order.total);
      return NextResponse.json({
        keyId: await getRazorpayKeyId(),
        razorpayOrderId: order.payment_reference,
        amount: amountInPaise,
        currency: "INR",
        orderTotal: order.total,
      });
    }

    const razorpay = await getRazorpayClient();
    const amountInPaise = rupeesToPaise(order.total);

    const razorpayOrder = await razorpay.orders.create({
      amount: amountInPaise,
      currency: "INR",
      receipt: orderId.slice(0, 40),
      notes: {
        supabase_order_id: orderId,
      },
    });

    const linkResult = await setOrderPaymentReferenceIfEmpty(
      orderId,
      razorpayOrder.id
    );

    if (linkResult === "failed") {
      return NextResponse.json(
        { error: "Failed to link Razorpay order." },
        { status: 500 }
      );
    }

    let razorpayOrderId = razorpayOrder.id;
    if (linkResult === "already_set") {
      const latest = await getOrderForPayment(orderId);
      if (latest?.payment_reference?.startsWith("order_")) {
        razorpayOrderId = latest.payment_reference;
      } else {
        return NextResponse.json(
          { error: "Failed to link Razorpay order." },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      keyId: await getRazorpayKeyId(),
      razorpayOrderId,
      amount: amountInPaise,
      currency: "INR",
      orderTotal: order.total,
    });
  } catch (error) {
    logger.error("Razorpay create-order failed", {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      { error: "Failed to create Razorpay order." },
      { status: 500 }
    );
  }
}
