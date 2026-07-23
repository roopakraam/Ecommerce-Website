import { createAdminClient } from "@/lib/supabase/admin";
import type { CartItem } from "@/lib/store/cart";
import type { CartLineInput } from "@/lib/validations/cart";

type VariantProductJoin = {
  id: string;
  size: string;
  color: string;
  stock_quantity: number;
  price_override: number | null;
  is_active: boolean;
  products: {
    id: string;
    name: string;
    slug: string;
    price: number;
    is_active: boolean;
    product_images: { url: string; position: number }[] | null;
  } | null;
};

type CartItemJoinRow = {
  quantity: number;
  variant_id: string;
  product_variants: VariantProductJoin | null;
};

const CART_SELECT = `
  quantity,
  variant_id,
  product_variants!inner (
    id,
    size,
    color,
    stock_quantity,
    price_override,
    is_active,
    products!inner (
      id,
      name,
      slug,
      price,
      is_active,
      product_images (url, position)
    )
  )
`;

function primaryImageUrl(
  images: { url: string; position: number }[] | null | undefined
): string | null {
  if (!images || images.length === 0) return null;
  const sorted = [...images].sort((a, b) => a.position - b.position);
  return sorted[0]?.url ?? null;
}

function unitPriceFor(
  basePrice: number,
  priceOverride: number | null
): number {
  return priceOverride != null ? Number(priceOverride) : Number(basePrice);
}

function toStorefrontCartItem(row: CartItemJoinRow): CartItem | null {
  const variant = row.product_variants;
  const product = variant?.products;
  if (!variant || !product) return null;
  if (!variant.is_active || !product.is_active) return null;

  const maxQuantity = Math.max(0, variant.stock_quantity);
  if (maxQuantity <= 0) return null;

  const quantity = Math.min(Math.max(1, row.quantity), maxQuantity);

  return {
    productId: product.id,
    variantId: variant.id,
    slug: product.slug,
    name: product.name,
    size: variant.size,
    color: variant.color,
    unitPrice: unitPriceFor(product.price, variant.price_override),
    imageUrl: primaryImageUrl(product.product_images),
    quantity,
    maxQuantity,
  };
}

export type MergeCartLine = {
  variantId: string;
  quantity: number;
  maxQuantity: number;
};

/**
 * Pure merge: sum quantities by variantId, clamp to maxQuantity/stock.
 */
export function mergeCartItems(
  server: MergeCartLine[],
  local: MergeCartLine[]
): MergeCartLine[] {
  const byVariant = new Map<string, MergeCartLine>();

  for (const line of [...server, ...local]) {
    const existing = byVariant.get(line.variantId);
    if (!existing) {
      byVariant.set(line.variantId, {
        variantId: line.variantId,
        quantity: Math.min(Math.max(1, line.quantity), line.maxQuantity),
        maxQuantity: line.maxQuantity,
      });
      continue;
    }

    const maxQuantity = Math.min(existing.maxQuantity, line.maxQuantity);
    byVariant.set(line.variantId, {
      variantId: line.variantId,
      quantity: Math.min(existing.quantity + line.quantity, maxQuantity),
      maxQuantity,
    });
  }

  return Array.from(byVariant.values()).filter((line) => line.maxQuantity > 0);
}

async function loadVariantStockMap(
  variantIds: string[]
): Promise<Map<string, number>> {
  const stockByVariant = new Map<string, number>();
  if (variantIds.length === 0) return stockByVariant;

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("product_variants")
    .select("id, stock_quantity, is_active, products!inner(is_active)")
    .in("id", variantIds);

  if (error) {
    console.error("Failed to load variant stock for cart:", error.message);
    return stockByVariant;
  }

  for (const row of data ?? []) {
    const productRaw = row.products as
      | { is_active: boolean }
      | { is_active: boolean }[]
      | null;
    const product = Array.isArray(productRaw) ? productRaw[0] : productRaw;
    const active = row.is_active && Boolean(product?.is_active);
    stockByVariant.set(
      row.id,
      active ? Math.max(0, row.stock_quantity) : 0
    );
  }

  return stockByVariant;
}

export async function getCartItemsForCustomer(
  customerId: string
): Promise<CartItem[]> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("cart_items")
    .select(CART_SELECT)
    .eq("customer_id", customerId)
    .order("updated_at", { ascending: false });

  if (error) {
    console.error("Failed to load cart items:", error.message);
    return [];
  }

  const items: CartItem[] = [];
  for (const row of (data ?? []) as unknown as CartItemJoinRow[]) {
    const item = toStorefrontCartItem(row);
    if (item) items.push(item);
  }
  return items;
}

export async function replaceCartItems(
  customerId: string,
  items: CartLineInput[]
): Promise<CartItem[]> {
  const admin = createAdminClient();
  const stockByVariant = await loadVariantStockMap(
    items.map((item) => item.variantId)
  );

  const normalized = items
    .map((item) => {
      const maxQuantity = stockByVariant.get(item.variantId) ?? 0;
      if (maxQuantity <= 0) return null;
      return {
        customer_id: customerId,
        variant_id: item.variantId,
        quantity: Math.min(item.quantity, maxQuantity),
      };
    })
    .filter((row): row is NonNullable<typeof row> => row != null);

  // Deduplicate by variant_id (last wins after clamp)
  const unique = new Map<string, (typeof normalized)[number]>();
  for (const row of normalized) {
    unique.set(row.variant_id, row);
  }
  const rows = Array.from(unique.values());

  const { error: deleteError } = await admin
    .from("cart_items")
    .delete()
    .eq("customer_id", customerId);

  if (deleteError) {
    console.error("Failed to clear cart before replace:", deleteError.message);
    throw new Error("Failed to update cart.");
  }

  if (rows.length > 0) {
    const { error: insertError } = await admin.from("cart_items").insert(rows);
    if (insertError) {
      console.error("Failed to insert cart items:", insertError.message);
      throw new Error("Failed to update cart.");
    }
  }

  return getCartItemsForCustomer(customerId);
}

export async function upsertCartItem(
  customerId: string,
  variantId: string,
  quantity: number
): Promise<CartItem[]> {
  const stockByVariant = await loadVariantStockMap([variantId]);
  const maxQuantity = stockByVariant.get(variantId) ?? 0;
  if (maxQuantity <= 0) {
    await removeCartItem(customerId, variantId);
    return getCartItemsForCustomer(customerId);
  }

  const clamped = Math.min(Math.max(1, quantity), maxQuantity);
  const admin = createAdminClient();
  const { error } = await admin.from("cart_items").upsert(
    {
      customer_id: customerId,
      variant_id: variantId,
      quantity: clamped,
    },
    { onConflict: "customer_id,variant_id" }
  );

  if (error) {
    console.error("Failed to upsert cart item:", error.message);
    throw new Error("Failed to update cart item.");
  }

  return getCartItemsForCustomer(customerId);
}

export async function updateCartItemQuantity(
  customerId: string,
  variantId: string,
  quantity: number
): Promise<CartItem[]> {
  if (quantity <= 0) {
    return removeCartItem(customerId, variantId);
  }
  return upsertCartItem(customerId, variantId, quantity);
}

export async function removeCartItem(
  customerId: string,
  variantId: string
): Promise<CartItem[]> {
  const admin = createAdminClient();
  const { error } = await admin
    .from("cart_items")
    .delete()
    .eq("customer_id", customerId)
    .eq("variant_id", variantId);

  if (error) {
    console.error("Failed to remove cart item:", error.message);
    throw new Error("Failed to remove cart item.");
  }

  return getCartItemsForCustomer(customerId);
}

export async function clearCartItems(customerId: string): Promise<void> {
  const admin = createAdminClient();
  const { error } = await admin
    .from("cart_items")
    .delete()
    .eq("customer_id", customerId);

  if (error) {
    console.error("Failed to clear cart:", error.message);
    throw new Error("Failed to clear cart.");
  }
}

/**
 * Merge local guest lines into the server cart, persist, and return enriched items.
 */
export async function mergeAndReplaceCartItems(
  customerId: string,
  localItems: CartLineInput[]
): Promise<CartItem[]> {
  const serverItems = await getCartItemsForCustomer(customerId);

  const allVariantIds = Array.from(
    new Set([
      ...serverItems.map((item) => item.variantId),
      ...localItems.map((item) => item.variantId),
    ])
  );
  const stockByVariant = await loadVariantStockMap(allVariantIds);

  const serverLines: MergeCartLine[] = serverItems.map((item) => ({
    variantId: item.variantId,
    quantity: item.quantity,
    maxQuantity: stockByVariant.get(item.variantId) ?? item.maxQuantity,
  }));

  const localLines: MergeCartLine[] = localItems.map((item) => ({
    variantId: item.variantId,
    quantity: item.quantity,
    maxQuantity: stockByVariant.get(item.variantId) ?? 0,
  }));

  const merged = mergeCartItems(serverLines, localLines);

  return replaceCartItems(
    customerId,
    merged.map((line) => ({
      variantId: line.variantId,
      quantity: line.quantity,
    }))
  );
}
