import { NextResponse } from "next/server";
import { describeCouponDiscount } from "@/lib/checkout/coupons";
import { ensureCustomerProfile } from "@/lib/db/customers";
import { resolveCouponForCheckout } from "@/lib/db/coupons";
import { createServerClient } from "@/lib/supabase/server";
import { validateCouponRequestSchema } from "@/lib/validations/checkout";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = validateCouponRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid payload." },
        { status: 400 }
      );
    }

    if (!parsed.data.code) {
      return NextResponse.json(
        { error: "Enter a coupon code." },
        { status: 400 }
      );
    }

    const supabase = await createServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Please sign in to apply a coupon." },
        { status: 401 }
      );
    }

    const customerResult = await ensureCustomerProfile({
      authUserId: user.id,
      fullName: null,
      phone: null,
    });

    if ("error" in customerResult) {
      return NextResponse.json({ error: customerResult.error }, { status: 500 });
    }

    const resolved = await resolveCouponForCheckout({
      code: parsed.data.code,
      customerId: customerResult.customer.id,
      subtotal: parsed.data.subtotal,
    });

    if (!resolved.ok) {
      return NextResponse.json({ error: resolved.error }, { status: 400 });
    }

    if (!resolved.applied) {
      return NextResponse.json(
        { error: "Enter a coupon code." },
        { status: 400 }
      );
    }

    const { coupon, discountAmount } = resolved.applied;

    return NextResponse.json({
      code: coupon.code,
      discountAmount,
      discountType: coupon.discount_type,
      discountValue: Number(coupon.discount_value),
      description: describeCouponDiscount(
        coupon.discount_type,
        Number(coupon.discount_value)
      ),
    });
  } catch (error) {
    console.error("Coupon validate API failed:", error);
    return NextResponse.json(
      { error: "Unexpected server error while validating coupon." },
      { status: 500 }
    );
  }
}
