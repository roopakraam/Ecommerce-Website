"use server";

import { revalidatePath } from "next/cache";
import {
  createAdminProduct,
  deleteAdminProduct,
  ensureUniqueProductSlug,
  toggleAdminProductActive,
  updateAdminProduct,
} from "@/lib/db/admin-products";
import { adminProductFormSchema } from "@/lib/validations/admin-product";
import { slugify } from "@/lib/utils/slugify";
import { createServerClient } from "@/lib/supabase/server";

export type AdminProductActionResult =
  | { success: true; productId: string }
  | { success: false; error: string };

export type AdminProductMutationResult =
  | { success: true }
  | { success: false; error: string };

interface ProductImagePayload {
  url: string;
  position: number;
}

function parseImages(images: unknown): ProductImagePayload[] {
  if (!Array.isArray(images)) {
    return [];
  }

  return images
    .map((image, index) => {
      if (
        typeof image !== "object" ||
        image === null ||
        typeof (image as { url?: unknown }).url !== "string"
      ) {
        return null;
      }

      return {
        url: (image as { url: string }).url,
        position:
          typeof (image as { position?: unknown }).position === "number"
            ? (image as { position: number }).position
            : index,
      };
    })
    .filter((image): image is ProductImagePayload => image !== null)
    .sort((a, b) => a.position - b.position)
    .map((image, index) => ({ ...image, position: index }));
}

function storagePathFromPublicUrl(url: string): string | null {
  const marker = "/storage/v1/object/public/product-images/";
  const index = url.indexOf(marker);
  if (index === -1) {
    return null;
  }
  return decodeURIComponent(url.slice(index + marker.length));
}

async function removeStoragePaths(urls: string[]) {
  const paths = urls
    .map(storagePathFromPublicUrl)
    .filter((path): path is string => Boolean(path));

  if (paths.length === 0) {
    return;
  }

  const supabase = await createServerClient();
  const { error } = await supabase.storage
    .from("product-images")
    .remove(paths);

  if (error) {
    console.error("Failed to remove product image files:", error.message);
  }
}

function mapVariants(parsed: ReturnType<typeof adminProductFormSchema.parse>) {
  return parsed.variants.map((variant) => ({
    id: variant.id,
    size: variant.size,
    color: variant.color,
    sku: variant.sku,
    stock_quantity: variant.stock_quantity,
    price_override: variant.price_override,
    is_active: variant.is_active,
  }));
}

export async function createProductAction(input: {
  form: unknown;
  images: unknown;
}): Promise<AdminProductActionResult> {
  const parsed = adminProductFormSchema.safeParse(input.form);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Invalid product details.",
    };
  }

  try {
    const baseSlug = slugify(parsed.data.name);
    const slug = await ensureUniqueProductSlug(baseSlug);
    const images = parseImages(input.images);

    const product = await createAdminProduct({
      name: parsed.data.name,
      slug,
      description: parsed.data.description?.trim()
        ? parsed.data.description.trim()
        : null,
      price: parsed.data.price,
      category_id: parsed.data.category_id || null,
      is_active: parsed.data.is_active,
      images,
      variants: mapVariants(parsed.data),
    });

    revalidatePath("/admin/dashboard/products");
    revalidatePath("/products");
    revalidatePath("/");

    return { success: true, productId: product.id };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create product.",
    };
  }
}

export async function updateProductAction(input: {
  productId: string;
  form: unknown;
  images: unknown;
}): Promise<AdminProductActionResult> {
  const parsed = adminProductFormSchema.safeParse(input.form);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Invalid product details.",
    };
  }

  try {
    const baseSlug = slugify(parsed.data.name);
    const slug = await ensureUniqueProductSlug(baseSlug, input.productId);
    const images = parseImages(input.images);

    const { product, removedImageUrls } = await updateAdminProduct(
      input.productId,
      {
        name: parsed.data.name,
        slug,
        description: parsed.data.description?.trim()
          ? parsed.data.description.trim()
          : null,
        price: parsed.data.price,
        category_id: parsed.data.category_id || null,
        is_active: parsed.data.is_active,
        images,
        variants: mapVariants(parsed.data),
      }
    );

    await removeStoragePaths(removedImageUrls);

    revalidatePath("/admin/dashboard/products");
    revalidatePath(`/admin/dashboard/products/${product.id}/edit`);
    revalidatePath("/products");
    revalidatePath(`/products/${product.slug}`);
    revalidatePath("/");

    return { success: true, productId: product.id };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update product.",
    };
  }
}

export async function toggleProductActiveAction(
  productId: string,
  isActive: boolean
): Promise<AdminProductMutationResult> {
  try {
    await toggleAdminProductActive(productId, isActive);
    revalidatePath("/admin/dashboard/products");
    revalidatePath("/products");
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to update product status.",
    };
  }
}

export async function deleteProductAction(
  productId: string
): Promise<AdminProductMutationResult> {
  try {
    const imageUrls = await deleteAdminProduct(productId);
    await removeStoragePaths(imageUrls);
    revalidatePath("/admin/dashboard/products");
    revalidatePath("/products");
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete product.",
    };
  }
}
