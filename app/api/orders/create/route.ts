import { NextResponse } from "next/server";
import { computeOrderTotals } from "@/lib/checkout/order-totals";
import { ensureCustomerProfile } from "@/lib/db/customers";
import { resolveCouponForCheckout } from "@/lib/db/coupons";
import { reserveOrderInventory } from "@/lib/db/orders";
import { getPublicStoreCommerceSettings } from "@/lib/db/store-settings";
import { logger } from "@/lib/logger";
import { createAdminClient } from "@/lib/supabase/admin";
import { createServerClient } from "@/lib/supabase/server";
import { checkoutRequestSchema } from "@/lib/validations/checkout";
import type { Database, Product, ProductVariant } from "@/types";

type VariantRow = ProductVariant & {
  products:
    | Pick<Product, "id" | "name" | "price" | "is_active">
    | Pick<Product, "id" | "name" | "price" | "is_active">[]
    | null;
};

function unwrapProduct(
  products: VariantRow["products"]
): Pick<Product, "id" | "name" | "price" | "is_active"> | null {
  if (!products) return null;
  return Array.isArray(products) ? products[0] ?? null : products;
}

function buildPaymentRedirect(orderId: string) {
  return `/checkout/payment?orderId=${orderId}`;
}

function effectiveUnitPrice(
  product: Pick<Product, "price">,
  variant: Pick<ProductVariant, "price_override">
): number {
  return variant.price_override != null
    ? Number(variant.price_override)
    : Number(product.price);
}

/** Collapse duplicate variant lines so stock checks and inserts stay consistent. */
function aggregateCheckoutItems(
  items: { productId: string; variantId: string; quantity: number }[]
) {
  const byVariant = new Map<
    string,
    { productId: string; variantId: string; quantity: number }
  >();

  for (const item of items) {
    const existing = byVariant.get(item.variantId);
    if (existing) {
      if (existing.productId !== item.productId) {
        throw new Error("Conflicting product ids for the same variant.");
      }
      existing.quantity += item.quantity;
    } else {
      byVariant.set(item.variantId, { ...item });
    }
  }

  return Array.from(byVariant.values());
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = checkoutRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid payload." },
        { status: 400 }
      );
    }

    const payload = parsed.data;

    const supabase = await createServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Please sign in to continue checkout." },
        { status: 401 }
      );
    }

    const customerResult = await ensureCustomerProfile({
      authUserId: user.id,
      fullName: payload.fullName ?? null,
      phone: payload.phone ?? null,
    });

    if ("error" in customerResult) {
      return NextResponse.json({ error: customerResult.error }, { status: 500 });
    }

    let admin;
    try {
      admin = createAdminClient();
    } catch (adminError) {
      logger.error("Admin client failed during order create", {
        error:
          adminError instanceof Error ? adminError.message : String(adminError),
      });
      return NextResponse.json(
        {
          error:
            adminError instanceof Error
              ? adminError.message
              : "Server payment configuration error. Check SUPABASE_SERVICE_ROLE_KEY.",
        },
        { status: 500 }
      );
    }

    let aggregatedItems;
    try {
      aggregatedItems = aggregateCheckoutItems(payload.items);
    } catch {
      return NextResponse.json(
        { error: "One or more products are unavailable." },
        { status: 400 }
      );
    }

    for (const item of aggregatedItems) {
      if (item.quantity > 20) {
        return NextResponse.json(
          { error: "Quantity for a single item cannot exceed 20." },
          { status: 400 }
        );
      }
    }

    const variantIds = aggregatedItems.map((item) => item.variantId);

    const { data: variants, error: variantsError } = await admin
      .from("product_variants")
      .select(
        "id, product_id, size, color, sku, stock_quantity, price_override, is_active, products(id, name, price, is_active)"
      )
      .in("id", variantIds);

    if (variantsError || !variants) {
      return NextResponse.json(
        { error: "Failed to validate cart variants." },
        { status: 500 }
      );
    }

    const variantMap = new Map<string, VariantRow>(
      (variants as VariantRow[]).map((variant) => [variant.id, variant])
    );

    const orderItemsPayload: Database["public"]["Tables"]["order_items"]["Insert"][] =
      [];
    let subtotal = 0;

    for (const item of aggregatedItems) {
      const variant = variantMap.get(item.variantId);
      const product = unwrapProduct(variant?.products ?? null);

      if (
        !variant ||
        !product ||
        !variant.is_active ||
        !product.is_active ||
        variant.product_id !== item.productId
      ) {
        return NextResponse.json(
          { error: "One or more products are unavailable." },
          { status: 400 }
        );
      }

      if (variant.stock_quantity < item.quantity) {
        return NextResponse.json(
          {
            error: `Insufficient stock for ${product.name} (${variant.size} / ${variant.color}).`,
          },
          { status: 400 }
        );
      }

      const unitPrice = effectiveUnitPrice(product, variant);
      subtotal += unitPrice * item.quantity;
      orderItemsPayload.push({
        product_id: product.id,
        variant_id: variant.id,
        product_name_snapshot: product.name,
        size_snapshot: variant.size,
        color_snapshot: variant.color,
        sku_snapshot: variant.sku,
        unit_price: unitPrice,
        quantity: item.quantity,
        order_id: "",
      });
    }

    const couponResult = await resolveCouponForCheckout({
      code: payload.couponCode,
      customerId: customerResult.customer.id,
      subtotal,
    });

    if (!couponResult.ok) {
      return NextResponse.json({ error: couponResult.error }, { status: 400 });
    }

    const appliedCoupon = couponResult.applied;
    const discountAmount = appliedCoupon?.discountAmount ?? 0;

    const commerce = await getPublicStoreCommerceSettings();
    const { shippingFee, total } = computeOrderTotals({
      subtotal,
      taxRatePercent: commerce.taxRate,
      zones: commerce.zones,
      state: payload.address.state,
      discountAmount,
    });

    const { data: order, error: orderError } = await admin
      .from("orders")
      .insert({
        customer_id: customerResult.customer.id,
        status: "pending",
        payment_status: "pending",
        payment_provider: "razorpay",
        subtotal,
        shipping_fee: shippingFee,
        discount_amount: discountAmount,
        coupon_id: appliedCoupon?.coupon.id ?? null,
        coupon_code: appliedCoupon?.coupon.code ?? null,
        total,
        shipping_address: payload.address,
        inventory_reserved: false,
      })
      .select("id")
      .single();

    if (orderError || !order) {
      return NextResponse.json({ error: "Failed to create order." }, { status: 500 });
    }

    const orderId = order.id as string;
    const finalOrderItems = orderItemsPayload.map((item) => ({
      ...item,
      order_id: orderId,
    }));

    const { error: orderItemsError } = await admin
      .from("order_items")
      .insert(finalOrderItems);

    if (orderItemsError) {
      const { error: deleteError } = await admin
        .from("orders")
        .delete()
        .eq("id", orderId);
      if (deleteError) {
        logger.error("Failed to clean up order after item insert failure", {
          orderId,
          error: deleteError.message,
        });
      }
      return NextResponse.json(
        { error: "Failed to create order items." },
        { status: 500 }
      );
    }

    const reserved = await reserveOrderInventory(orderId);
    if (!reserved.ok) {
      await admin.from("orders").delete().eq("id", orderId);
      return NextResponse.json({ error: reserved.error }, { status: 400 });
    }

    // Coupon usage is incremented only after payment capture (confirmOrderPaymentPaid).

    if (payload.saveAddress) {
      const { error: addressError } = await admin.from("addresses").insert({
        customer_id: customerResult.customer.id,
        line1: payload.address.line1,
        line2: payload.address.line2,
        city: payload.address.city,
        state: payload.address.state,
        pincode: payload.address.pincode,
        is_default: false,
      });
      if (addressError) {
        logger.warn("Failed to save checkout address", {
          orderId,
          error: addressError.message,
        });
      }
    }

    return NextResponse.json({
      orderId,
      redirectTo: buildPaymentRedirect(orderId),
    });
  } catch (error) {
    logger.error("Order create API failed", {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      { error: "Unexpected server error while creating order." },
      { status: 500 }
    );
  }
}
