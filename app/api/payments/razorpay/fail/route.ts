import { NextResponse } from "next/server";
import {
  markOrderPaymentFailed,
  requireOrderOwnerOrAdmin,
} from "@/lib/db/orders";
import { failRazorpayPaymentSchema } from "@/lib/validations/payment";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = failRazorpayPaymentSchema.safeParse(body);

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
      return NextResponse.json({ success: true, alreadyPaid: true });
    }

    const updated = await markOrderPaymentFailed(orderId);
    if (!updated) {
      return NextResponse.json(
        { error: "Failed to update payment status." },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Razorpay fail handler error:", error);
    return NextResponse.json(
      { error: "Failed to record payment failure." },
      { status: 500 }
    );
  }
}
