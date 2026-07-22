import { NextResponse } from "next/server";
import { ensureCustomerProfile } from "@/lib/db/customers";
import { reserveOrderInventory } from "@/lib/db/orders";
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

    if (payload.isGuest) {
      return NextResponse.json(
        { error: "Please sign in to continue checkout." },
        { status: 401 }
      );
    }

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

    const admin = createAdminClient();
    const variantIds = Array.from(
      new Set(payload.items.map((item) => item.variantId))
    );

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

    for (const item of payload.items) {
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

    const shippingFee = 0;
    const total = subtotal + shippingFee;

    const { data: order, error: orderError } = await admin
      .from("orders")
      .insert({
        customer_id: customerResult.customer.id,
        status: "pending",
        payment_status: "pending",
        payment_provider: "razorpay",
        subtotal,
        shipping_fee: shippingFee,
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
      await admin.from("orders").delete().eq("id", orderId);
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

    if (payload.saveAddress) {
      await admin.from("addresses").insert({
        customer_id: customerResult.customer.id,
        line1: payload.address.line1,
        line2: payload.address.line2,
        city: payload.address.city,
        state: payload.address.state,
        pincode: payload.address.pincode,
        is_default: false,
      });
    }

    return NextResponse.json({
      orderId,
      redirectTo: buildPaymentRedirect(orderId),
    });
  } catch (error) {
    console.error("Order create API failed:", error);
    return NextResponse.json(
      { error: "Unexpected server error while creating order." },
      { status: 500 }
    );
  }
}
