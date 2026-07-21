import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createServerClient } from "@/lib/supabase/server";
import { checkoutRequestSchema } from "@/lib/validations/checkout";
import type { Database } from "@/types";

type DbProduct = Database["public"]["Tables"]["products"]["Row"];
type DbCustomer = Database["public"]["Tables"]["customers"]["Row"];

function buildPaymentRedirect(orderId: string) {
  return `/checkout/payment?orderId=${orderId}`;
}

async function resolveAuthUserId(payload: {
  isGuest: boolean;
  email: string | null;
  phone: string | null;
  fullName: string | null;
}): Promise<{ authUserId: string } | { error: string }> {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    return { authUserId: user.id };
  }

  if (!payload.isGuest) {
    return { error: "Please sign in to continue checkout." };
  }

  const admin = createAdminClient();
  const randomPassword = `Guest#${crypto.randomUUID()}`;
  const { data, error } = await admin.auth.admin.createUser({
    email: payload.email ?? undefined,
    phone: payload.phone ?? undefined,
    email_confirm: false,
    phone_confirm: false,
    password: randomPassword,
    user_metadata: {
      guest_checkout: true,
      full_name: payload.fullName,
    },
  });

  if (error || !data.user) {
    return {
      error:
        "Guest checkout could not be initialized. If this email already exists, please sign in and continue.",
    };
  }

  return { authUserId: data.user.id };
}

async function getOrCreateCustomer(params: {
  authUserId: string;
  fullName: string | null;
  phone: string | null;
}): Promise<{ customer: DbCustomer } | { error: string }> {
  const admin = createAdminClient();

  const { data: existing, error: existingError } = await admin
    .from("customers")
    .select("*")
    .eq("auth_user_id", params.authUserId)
    .maybeSingle();

  if (existingError) {
    return { error: "Failed to fetch customer profile." };
  }

  if (existing) {
    if (params.fullName || params.phone) {
      await admin
        .from("customers")
        .update({
          full_name: params.fullName ?? existing.full_name,
          phone: params.phone ?? existing.phone,
        })
        .eq("id", existing.id);
    }
    return { customer: existing };
  }

  const { data: created, error: createError } = await admin
    .from("customers")
    .insert({
      auth_user_id: params.authUserId,
      full_name: params.fullName,
      phone: params.phone,
    })
    .select("*")
    .single();

  if (createError || !created) {
    return { error: "Failed to create customer profile." };
  }

  return { customer: created };
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
    const authResult = await resolveAuthUserId({
      isGuest: payload.isGuest,
      email: payload.email ?? null,
      phone: payload.phone ?? null,
      fullName: payload.fullName ?? null,
    });

    if ("error" in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: 401 });
    }

    const customerResult = await getOrCreateCustomer({
      authUserId: authResult.authUserId,
      fullName: payload.fullName ?? null,
      phone: payload.phone ?? null,
    });

    if ("error" in customerResult) {
      return NextResponse.json({ error: customerResult.error }, { status: 500 });
    }

    const admin = createAdminClient();
    const productIds = Array.from(
      new Set(payload.items.map((item) => item.productId))
    );
    const { data: products, error: productsError } = await admin
      .from("products")
      .select("id, name, price, stock_quantity, is_active")
      .in("id", productIds);

    if (productsError || !products) {
      return NextResponse.json(
        { error: "Failed to validate products in cart." },
        { status: 500 }
      );
    }

    const productMap = new Map<string, DbProduct>(
      products.map((product) => [product.id, product as DbProduct])
    );

    const orderItemsPayload: Database["public"]["Tables"]["order_items"]["Insert"][] = [];
    let subtotal = 0;

    for (const item of payload.items) {
      const product = productMap.get(item.productId);
      if (!product || !product.is_active) {
        return NextResponse.json(
          { error: "One or more products are unavailable." },
          { status: 400 }
        );
      }

      if (product.stock_quantity < item.quantity) {
        return NextResponse.json(
          { error: `Insufficient stock for ${product.name}.` },
          { status: 400 }
        );
      }

      subtotal += product.price * item.quantity;
      orderItemsPayload.push({
        product_id: product.id,
        product_name_snapshot: product.name,
        unit_price: product.price,
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
      })
      .select("id")
      .single();

    if (orderError || !order) {
      return NextResponse.json({ error: "Failed to create order." }, { status: 500 });
    }

    const orderId = order.id;
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
