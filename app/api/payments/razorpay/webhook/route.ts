import { NextResponse } from "next/server";
import {
  confirmOrderPaymentPaid,
  getOrderByPaymentReference,
  getOrderForPayment,
} from "@/lib/db/orders";
import { logger } from "@/lib/logger";
import { notifyOrderPaid } from "@/lib/notifications/order-confirmation";
import { validateRazorpayPaymentAgainstOrder } from "@/lib/payments/validate-razorpay-payment";
import { getRazorpayWebhookSecret } from "@/lib/razorpay/client";
import { verifyRazorpayWebhookSignature } from "@/lib/razorpay/verify-signature";

interface RazorpayPaymentEntity {
  id?: string;
  order_id?: string;
  amount?: number | string;
  currency?: string;
  status?: string;
  notes?: Record<string, string> | null;
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
    const secret = await getRazorpayWebhookSecret();
    if (!secret) {
      logger.error("Razorpay webhook secret is not configured (DB or env)");
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

    if (!razorpayPaymentId || !razorpayOrderId || !payment) {
      return NextResponse.json(
        { error: "Missing payment identifiers." },
        { status: 400 }
      );
    }

    let order = await getOrderByPaymentReference(razorpayOrderId);

    // Fallback: notes from Razorpay order create
    if (!order) {
      const supabaseOrderId = payment.notes?.supabase_order_id;
      if (supabaseOrderId) {
        order = await getOrderForPayment(supabaseOrderId);
      }
    }

    // Already paid: payment_reference may already be the payment id
    if (!order) {
      order = await getOrderByPaymentReference(razorpayPaymentId);
    }

    if (!order) {
      logger.error("Webhook payment.captured: order not found", {
        razorpayOrderId,
      });
      // Acknowledge so Razorpay does not hammer retries forever; ops must reconcile.
      return NextResponse.json({
        received: true,
        error: "Order not found.",
      });
    }

    if (order.payment_status === "paid") {
      return NextResponse.json({ received: true, alreadyPaid: true });
    }

    if (order.status === "cancelled") {
      logger.warn("Webhook payment.captured for cancelled order", {
        orderId: order.id,
        razorpayPaymentId,
      });
      return NextResponse.json({
        received: true,
        error: "Order cancelled; manual refund may be required.",
      });
    }

    // confirmOrderPaymentPaid requires payment_reference === razorpay order id
    if (
      !order.payment_reference ||
      order.payment_reference !== razorpayOrderId
    ) {
      logger.warn("Webhook payment reference mismatch", {
        orderId: order.id,
        razorpayOrderId,
        paymentReference: order.payment_reference,
      });
      return NextResponse.json({
        received: true,
        error: "Razorpay order does not match this checkout.",
      });
    }

    const amountCheck = validateRazorpayPaymentAgainstOrder({
      payment,
      expectedOrderTotalRupees: order.total,
      expectedRazorpayOrderId: razorpayOrderId,
      requireCaptured: true,
    });

    if (!amountCheck.ok) {
      logger.error("Webhook payment amount mismatch", {
        orderId: order.id,
        error: amountCheck.error,
      });
      return NextResponse.json({
        received: true,
        error: amountCheck.error,
      });
    }

    const result = await confirmOrderPaymentPaid({
      orderId: order.id,
      razorpayPaymentId,
      razorpayOrderId,
    });

    if (!result.ok) {
      logger.error("Webhook confirm paid failed", {
        orderId: order.id,
        error: result.error,
      });
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    if (!result.alreadyPaid) {
      await notifyOrderPaid(order.id);
    }

    return NextResponse.json({ received: true, orderId: order.id });
  } catch (error) {
    logger.error("Razorpay webhook failed", {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      { error: "Webhook processing failed." },
      { status: 500 }
    );
  }
}
