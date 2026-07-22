"use server";

import { revalidatePath } from "next/cache";
import {
  createAdminCategory,
  deleteAdminCategory,
  ensureUniqueCategorySlug,
  updateAdminCategory,
} from "@/lib/db/admin-categories";
import { ADMIN_CATEGORIES_PATH, ADMIN_PRODUCTS_PATH } from "@/lib/admin/products";
import { adminCategoryFormSchema } from "@/lib/validations/admin-category";
import { slugify } from "@/lib/utils/slugify";

export type AdminCategoryMutationResult =
  | { success: true }
  | { success: false; error: string };

function revalidateCategoryPaths() {
  revalidatePath(ADMIN_CATEGORIES_PATH);
  revalidatePath(ADMIN_PRODUCTS_PATH);
  revalidatePath("/products");
  revalidatePath("/");
}

export async function createCategoryAction(input: {
  form: unknown;
}): Promise<AdminCategoryMutationResult> {
  const parsed = adminCategoryFormSchema.safeParse(input.form);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Invalid category details.",
    };
  }

  try {
    const slug = await ensureUniqueCategorySlug(
      parsed.data.slug || slugify(parsed.data.name)
    );
    await createAdminCategory({
      name: parsed.data.name,
      slug,
    });
    revalidateCategoryPaths();
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to create category.",
    };
  }
}

export async function updateCategoryAction(input: {
  categoryId: string;
  form: unknown;
}): Promise<AdminCategoryMutationResult> {
  const parsed = adminCategoryFormSchema.safeParse(input.form);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Invalid category details.",
    };
  }

  try {
    const slug = await ensureUniqueCategorySlug(
      parsed.data.slug || slugify(parsed.data.name),
      input.categoryId
    );
    await updateAdminCategory(input.categoryId, {
      name: parsed.data.name,
      slug,
    });
    revalidateCategoryPaths();
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to update category.",
    };
  }
}

export async function deleteCategoryAction(
  categoryId: string
): Promise<AdminCategoryMutationResult> {
  try {
    await deleteAdminCategory(categoryId);
    revalidateCategoryPaths();
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to delete category.",
    };
  }
}
