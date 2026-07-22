import { createServerClient } from "@/lib/supabase/server";
import { ADMIN_LOW_STOCK_THRESHOLD } from "@/lib/admin/products";
import {
  crossedIntoLowStock,
  notifyLowStock,
} from "@/lib/notifications/low-stock";
import type { InventoryAdjustment } from "@/types";

export interface AdminInventoryRow {
  id: string;
  product_id: string;
  product_name: string;
  size: string;
  color: string;
  sku: string;
  stock_quantity: number;
  is_active: boolean;
  is_low_stock: boolean;
}

export interface AdminInventoryListOptions {
  lowStockOnly?: boolean;
  search?: string;
}

async function assertAdmin() {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("You must be signed in.");
  }

  const { data: adminRow, error } = await supabase
    .from("admin_users")
    .select("id")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  if (error || !adminRow) {
    throw new Error("You do not have admin access.");
  }

  return { supabase, user };
}

function sanitizeSearch(value: string): string {
  return value.trim().replace(/[%_,]/g, " ").replace(/\s+/g, " ").slice(0, 80);
}

function isMissingRelationError(message: string, relation: string): boolean {
  const lower = message.toLowerCase();
  return (
    lower.includes(relation.toLowerCase()) &&
    (lower.includes("does not exist") || lower.includes("schema cache"))
  );
}

export async function getAdminInventory(
  options: AdminInventoryListOptions = {}
): Promise<AdminInventoryRow[]> {
  const { supabase } = await assertAdmin();
  const search = options.search ? sanitizeSearch(options.search) : "";

  let query = supabase
    .from("product_variants")
    .select(
      "id, product_id, size, color, sku, stock_quantity, is_active, products(id, name)"
    )
    .order("stock_quantity", { ascending: true });

  if (options.lowStockOnly) {
    query = query.lt("stock_quantity", ADMIN_LOW_STOCK_THRESHOLD);
  }

  if (search) {
    query = query.or(
      `sku.ilike.%${search}%,size.ilike.%${search}%,color.ilike.%${search}%`
    );
  }

  const { data, error } = await query;

  if (error) {
    console.error("Failed to load inventory:", error.message);
    throw new Error("Failed to load inventory.");
  }

  const rows = (
    (data ?? []) as Array<{
      id: string;
      product_id: string;
      size: string;
      color: string;
      sku: string;
      stock_quantity: number;
      is_active: boolean;
      products:
        | { id: string; name: string }
        | Array<{ id: string; name: string }>
        | null;
    }>
  ).map((variant) => {
    const product = Array.isArray(variant.products)
      ? variant.products[0]
      : variant.products;

    return {
      id: variant.id,
      product_id: variant.product_id,
      product_name: product?.name ?? "Unknown product",
      size: variant.size,
      color: variant.color,
      sku: variant.sku,
      stock_quantity: variant.stock_quantity,
      is_active: variant.is_active,
      is_low_stock: variant.stock_quantity < ADMIN_LOW_STOCK_THRESHOLD,
    };
  });

  if (search) {
    const needle = search.toLowerCase();
    return rows.filter(
      (row) =>
        row.product_name.toLowerCase().includes(needle) ||
        row.sku.toLowerCase().includes(needle) ||
        row.size.toLowerCase().includes(needle) ||
        row.color.toLowerCase().includes(needle)
    );
  }

  return rows;
}

export async function adjustAdminVariantInventory(input: {
  variantId: string;
  delta: number;
  reason?: string;
}): Promise<InventoryAdjustment> {
  const { supabase, user } = await assertAdmin();

  if (!Number.isInteger(input.delta) || input.delta === 0) {
    throw new Error("Adjustment must be a non-zero whole number.");
  }

  const { data: variant, error: variantError } = await supabase
    .from("product_variants")
    .select("id, stock_quantity, size, color, sku, products(name)")
    .eq("id", input.variantId)
    .maybeSingle();

  if (variantError) {
    console.error("Failed to load variant for adjust:", variantError.message);
    throw new Error("Failed to adjust inventory.");
  }

  if (!variant) {
    throw new Error("Variant not found.");
  }

  const variantRow = variant as {
    id: string;
    stock_quantity: number;
    size: string;
    color: string;
    sku: string;
    products: { name: string } | Array<{ name: string }> | null;
  };

  const quantityBefore = Number(variantRow.stock_quantity);
  const quantityAfter = quantityBefore + input.delta;

  if (quantityAfter < 0) {
    throw new Error("Adjustment would make stock negative.");
  }

  const { error: updateError } = await supabase
    .from("product_variants")
    .update({
      stock_quantity: quantityAfter,
      updated_at: new Date().toISOString(),
    })
    .eq("id", input.variantId);

  if (updateError) {
    console.error("Failed to update variant stock:", updateError.message);
    throw new Error(updateError.message || "Failed to adjust inventory.");
  }

  const reason = input.reason?.trim() || null;
  const { data: adjustment, error: adjustmentError } = await supabase
    .from("inventory_adjustments")
    .insert({
      variant_id: input.variantId,
      delta: input.delta,
      quantity_before: quantityBefore,
      quantity_after: quantityAfter,
      reason,
      actor_auth_user_id: user.id,
    })
    .select("*")
    .single();

  if (crossedIntoLowStock(quantityBefore, quantityAfter)) {
    const product = Array.isArray(variantRow.products)
      ? variantRow.products[0]
      : variantRow.products;

    // Fire-and-forget; never block the adjustment on notification failure.
    void notifyLowStock([
      {
        variantId: input.variantId,
        productName: product?.name ?? "Unknown product",
        size: variantRow.size,
        color: variantRow.color,
        sku: variantRow.sku,
        quantityAfter,
      },
    ]);
  }

  if (adjustmentError) {
    console.error(
      "Failed to write inventory adjustment ledger:",
      adjustmentError.message
    );

    // Stock was updated; ledger is optional until migration is applied.
    if (
      isMissingRelationError(
        adjustmentError.message,
        "inventory_adjustments"
      )
    ) {
      return {
        id: crypto.randomUUID(),
        variant_id: input.variantId,
        delta: input.delta,
        quantity_before: quantityBefore,
        quantity_after: quantityAfter,
        reason,
        actor_auth_user_id: user.id,
        created_at: new Date().toISOString(),
      };
    }

    throw new Error(
      adjustmentError.message || "Stock updated but adjustment log failed."
    );
  }

  return adjustment as InventoryAdjustment;
}
