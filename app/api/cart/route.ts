import { NextResponse } from "next/server";
import {
  clearCartItems,
  getCartItemsForCustomer,
  mergeAndReplaceCartItems,
  replaceCartItems,
} from "@/lib/db/cart";
import { ensureCustomerProfile } from "@/lib/db/customers";
import { createServerClient } from "@/lib/supabase/server";
import {
  cartMergeSchema,
  cartReplaceSchema,
} from "@/lib/validations/cart";

async function requireCustomerId(): Promise<
  { customerId: string } | { error: string; status: number }
> {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Please sign in first.", status: 401 };
  }

  const result = await ensureCustomerProfile({
    authUserId: user.id,
    fullName: (user.user_metadata?.full_name as string | undefined) ?? null,
    phone: (user.user_metadata?.phone as string | undefined) ?? null,
  });

  if ("error" in result) {
    return { error: result.error, status: 500 };
  }

  return { customerId: result.customer.id };
}

export async function GET() {
  try {
    const auth = await requireCustomerId();
    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const items = await getCartItemsForCustomer(auth.customerId);
    return NextResponse.json({ items });
  } catch (error) {
    console.error("GET /api/cart failed:", error);
    return NextResponse.json(
      { error: "Failed to load cart." },
      { status: 500 }
    );
  }
}

/** Replace the full server cart (debounced sync while logged in). */
export async function PUT(request: Request) {
  try {
    const auth = await requireCustomerId();
    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const body = await request.json();
    const parsed = cartReplaceSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid cart payload." },
        { status: 400 }
      );
    }

    const items = await replaceCartItems(auth.customerId, parsed.data.items);
    return NextResponse.json({ items });
  } catch (error) {
    console.error("PUT /api/cart failed:", error);
    return NextResponse.json(
      { error: "Failed to update cart." },
      { status: 500 }
    );
  }
}

/**
 * Merge guest/local lines into the server cart (login), then return enriched items.
 * Uses POST so PUT remains a pure replace for ongoing sync.
 */
export async function POST(request: Request) {
  try {
    const auth = await requireCustomerId();
    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const body = await request.json();
    const parsed = cartMergeSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid cart payload." },
        { status: 400 }
      );
    }

    const items = await mergeAndReplaceCartItems(
      auth.customerId,
      parsed.data.items
    );
    return NextResponse.json({ items });
  } catch (error) {
    console.error("POST /api/cart failed:", error);
    return NextResponse.json(
      { error: "Failed to merge cart." },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  try {
    const auth = await requireCustomerId();
    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    await clearCartItems(auth.customerId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/cart failed:", error);
    return NextResponse.json(
      { error: "Failed to clear cart." },
      { status: 500 }
    );
  }
}
