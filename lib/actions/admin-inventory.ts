"use server";

import { revalidatePath } from "next/cache";
import { adjustAdminVariantInventory } from "@/lib/db/admin-inventory";
import { ADMIN_INVENTORY_PATH } from "@/lib/admin/inventory";
import { ADMIN_PRODUCTS_PATH } from "@/lib/admin/products";
import { adjustInventorySchema } from "@/lib/validations/admin-inventory";

export type AdjustInventoryResult =
  | { success: true; quantityAfter: number }
  | { success: false; error: string };

export async function adjustInventoryAction(input: {
  variantId: string;
  delta: number;
  reason?: string;
}): Promise<AdjustInventoryResult> {
  const parsed = adjustInventorySchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Invalid adjustment.",
    };
  }

  try {
    const adjustment = await adjustAdminVariantInventory(parsed.data);
    revalidatePath(ADMIN_INVENTORY_PATH);
    revalidatePath("/admin/dashboard/inventory");
    revalidatePath(ADMIN_PRODUCTS_PATH);
    revalidatePath("/admin/dashboard");
    revalidatePath("/products");
    return { success: true, quantityAfter: adjustment.quantity_after };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to adjust inventory.",
    };
  }
}
