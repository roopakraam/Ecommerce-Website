import { NextResponse } from "next/server";
import {
  confirmOrderPaymentPaid,
  getOrderByPaymentReference,
  getOrderForPayment,
} from "@/lib/db/orders";
import { notifyOrderPaid } from "@/lib/notifications/order-confirmation";
import { verifyRazorpayWebhookSignature } from "@/lib/razorpay/verify-signature";

interface RazorpayPaymentEntity {
  id?: string;
  order_id?: string;
  notes?: Record<string, string> | null;
  status?: string;
}

interface RazorpayWebhookPayload {
  event?: string;
  payload?: {
    payment?: {
      entity?: RazorpayPaymentEntity;
    };
  };
}

export async function POST(request: Request) {
  try {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!secret) {
      console.error("RAZORPAY_WEBHOOK_SECRET is not configured.");
      return NextResponse.json(
        { error: "Webhook is not configured." },
        { status: 500 }
      );
    }

    const rawBody = await request.text();
    const signature = request.headers.get("x-razorpay-signature");

    if (!signature) {
      return NextResponse.json(
        { error: "Missing webhook signature." },
        { status: 400 }
      );
    }

    const isValid = verifyRazorpayWebhookSignature({
      rawBody,
      signature,
      secret,
    });

    if (!isValid) {
      return NextResponse.json(
        { error: "Invalid webhook signature." },
        { status: 400 }
      );
    }

    let payload: RazorpayWebhookPayload;
    try {
      payload = JSON.parse(rawBody) as RazorpayWebhookPayload;
    } catch {
      return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
    }

    if (payload.event !== "payment.captured") {
      return NextResponse.json({ received: true, ignored: true });
    }

    const payment = payload.payload?.payment?.entity;
    const razorpayPaymentId = payment?.id;
    const razorpayOrderId = payment?.order_id;

    if (!razorpayPaymentId || !razorpayOrderId) {
      return NextResponse.json(
        { error: "Missing payment identifiers." },
        { status: 400 }
      );
    }

    let order = await getOrderByPaymentReference(razorpayOrderId);

    // Fallback: notes from Razorpay order create
    if (!order) {
      const supabaseOrderId = payment?.notes?.supabase_order_id;
      if (supabaseOrderId) {
        order = await getOrderForPayment(supabaseOrderId);
      }
    }

    // Already paid: payment_reference may already be the payment id
    if (!order) {
      order = await getOrderByPaymentReference(razorpayPaymentId);
    }

    if (!order) {
      console.error(
        "Webhook payment.captured: order not found for",
        razorpayOrderId
      );
      return NextResponse.json({ error: "Order not found." }, { status: 404 });
    }

    if (order.payment_status === "paid") {
      return NextResponse.json({ received: true, alreadyPaid: true });
    }

    // confirmOrderPaymentPaid requires payment_reference === razorpay order id
    if (
      !order.payment_reference ||
      order.payment_reference !== razorpayOrderId
    ) {
      return NextResponse.json(
        { error: "Razorpay order does not match this checkout." },
        { status: 400 }
      );
    }

    const result = await confirmOrderPaymentPaid({
      orderId: order.id,
      razorpayPaymentId,
      razorpayOrderId,
    });

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    if (!result.alreadyPaid) {
      await notifyOrderPaid(order.id);
    }

    return NextResponse.json({ received: true, orderId: order.id });
  } catch (error) {
    console.error("Razorpay webhook failed:", error);
    return NextResponse.json(
      { error: "Webhook processing failed." },
      { status: 500 }
    );
  }
}
