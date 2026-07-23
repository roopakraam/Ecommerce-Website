import { NextResponse } from "next/server";
import {
  confirmOrderPaymentPaid,
  requireOrderOwnerOrAdmin,
} from "@/lib/db/orders";
import { logger } from "@/lib/logger";
import { notifyOrderPaid } from "@/lib/notifications/order-confirmation";
import { validateRazorpayPaymentAgainstOrder } from "@/lib/payments/validate-razorpay-payment";
import {
  getRazorpayClient,
  getRazorpayKeySecret,
} from "@/lib/razorpay/client";
import { verifyRazorpayPaymentSignature } from "@/lib/razorpay/verify-signature";
import { verifyRazorpayPaymentSchema } from "@/lib/validations/payment";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = verifyRazorpayPaymentSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid payload." },
        { status: 400 }
      );
    }

    const {
      orderId,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = parsed.data;

    const access = await requireOrderOwnerOrAdmin(orderId);
    if (!access.ok) {
      return NextResponse.json(
        { error: access.error },
        { status: access.status }
      );
    }

    const order = access.order!;

    let secret: string;
    try {
      secret = await getRazorpayKeySecret();
    } catch {
      return NextResponse.json(
        { error: "Payment verification is not configured." },
        { status: 500 }
      );
    }

    const isValid = verifyRazorpayPaymentSignature({
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
      razorpaySignature: razorpay_signature,
      secret,
    });

    if (!isValid) {
      return NextResponse.json(
        { error: "Payment signature verification failed." },
        { status: 400 }
      );
    }

    if (order.payment_status === "paid") {
      return NextResponse.json({
        success: true,
        orderId,
        redirectTo: `/order-confirmation/${orderId}`,
      });
    }

    if (order.status === "cancelled") {
      return NextResponse.json(
        { error: "This order was cancelled and cannot be paid." },
        { status: 400 }
      );
    }

    if (
      !order.payment_reference ||
      order.payment_reference !== razorpay_order_id
    ) {
      return NextResponse.json(
        { error: "Razorpay order does not match this checkout." },
        { status: 400 }
      );
    }

    try {
      const razorpay = await getRazorpayClient();
      const payment = (await razorpay.payments.fetch(
        razorpay_payment_id
      )) as {
        id?: string;
        order_id?: string;
        amount?: number | string;
        currency?: string;
        status?: string;
      };

      const amountCheck = validateRazorpayPaymentAgainstOrder({
        payment,
        expectedOrderTotalRupees: order.total,
        expectedRazorpayOrderId: razorpay_order_id,
        requireCaptured: true,
      });

      if (!amountCheck.ok) {
        logger.warn("Razorpay verify amount mismatch", {
          orderId,
          error: amountCheck.error,
        });
        return NextResponse.json({ error: amountCheck.error }, { status: 400 });
      }
    } catch (fetchError) {
      logger.error("Failed to fetch Razorpay payment for verify", {
        orderId,
        error:
          fetchError instanceof Error ? fetchError.message : String(fetchError),
      });
      return NextResponse.json(
        { error: "Unable to verify payment with Razorpay." },
        { status: 502 }
      );
    }

    const updated = await confirmOrderPaymentPaid({
      orderId,
      razorpayPaymentId: razorpay_payment_id,
      razorpayOrderId: razorpay_order_id,
    });

    if (!updated.ok) {
      return NextResponse.json({ error: updated.error }, { status: 500 });
    }

    if (!updated.alreadyPaid) {
      // Safe: notifyOrderPaid swallows provider errors so payment success is preserved.
      await notifyOrderPaid(orderId);
    }

    return NextResponse.json({
      success: true,
      orderId,
      redirectTo: `/order-confirmation/${orderId}`,
    });
  } catch (error) {
    logger.error("Razorpay verify failed", {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      { error: "Payment verification failed." },
      { status: 500 }
    );
  }
}
