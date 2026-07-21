import { NextResponse } from "next/server";
import {
  getOrderForPayment,
  markOrderPaymentPaid,
} from "@/lib/db/orders";
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

    const secret = process.env.RAZORPAY_KEY_SECRET;
    if (!secret) {
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

    const order = await getOrderForPayment(orderId);
    if (!order) {
      return NextResponse.json({ error: "Order not found." }, { status: 404 });
    }

    if (order.payment_status === "paid") {
      return NextResponse.json({
        success: true,
        orderId,
        redirectTo: `/order-confirmation/${orderId}`,
      });
    }

    if (
      order.payment_reference &&
      order.payment_reference !== razorpay_order_id
    ) {
      return NextResponse.json(
        { error: "Razorpay order does not match this checkout." },
        { status: 400 }
      );
    }

    const updated = await markOrderPaymentPaid({
      orderId,
      razorpayPaymentId: razorpay_payment_id,
      razorpayOrderId: razorpay_order_id,
    });

    if (!updated) {
      return NextResponse.json(
        { error: "Failed to update order payment status." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      orderId,
      redirectTo: `/order-confirmation/${orderId}`,
    });
  } catch (error) {
    console.error("Razorpay verify failed:", error);
    return NextResponse.json(
      { error: "Payment verification failed." },
      { status: 500 }
    );
  }
}
