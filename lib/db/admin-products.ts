import { createServerClient } from "@/lib/supabase/server";
import type { Category, Product, ProductImage } from "@/types";

export type AdminProductImage = ProductImage;

export interface AdminProductListItem extends Product {
  categories: Pick<Category, "id" | "name" | "slug"> | null;
  product_images: Pick<ProductImage, "id" | "url" | "position">[];
}

export interface AdminProductDetail extends Product {
  categories: Pick<Category, "id" | "name" | "slug"> | null;
  product_images: AdminProductImage[];
}

export interface AdminProductWriteInput {
  name: string;
  slug: string;
  description: string | null;
  price: number;
  stock_quantity: number;
  category_id: string | null;
  is_active: boolean;
  images: Array<{ url: string; position: number }>;
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

  return supabase;
}

export async function getAdminProducts(): Promise<AdminProductListItem[]> {
  const supabase = await assertAdmin();

  const { data, error } = await supabase
    .from("products")
    .select(
      "*, categories(id, name, slug), product_images(id, url, position)"
    )
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Failed to fetch admin products:", error.message);
    throw new Error("Failed to load products.");
  }

  return (data ?? []) as AdminProductListItem[];
}

export async function getAdminProductById(
  id: string
): Promise<AdminProductDetail | null> {
  const supabase = await assertAdmin();

  const { data, error } = await supabase
    .from("products")
    .select(
      "*, categories(id, name, slug), product_images(id, url, position)"
    )
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("Failed to fetch admin product:", error.message);
    throw new Error("Failed to load product.");
  }

  if (!data) {
    return null;
  }

  const product = data as AdminProductDetail;
  product.product_images = [...product.product_images].sort(
    (a, b) => a.position - b.position
  );

  return product;
}

export async function createAdminProduct(
  input: AdminProductWriteInput
): Promise<Product> {
  const supabase = await assertAdmin();

  const { data: product, error } = await supabase
    .from("products")
    .insert({
      name: input.name,
      slug: input.slug,
      description: input.description,
      price: input.price,
      stock_quantity: input.stock_quantity,
      category_id: input.category_id,
      is_active: input.is_active,
    })
    .select("*")
    .single();

  if (error || !product) {
    console.error("Failed to create product:", error?.message);
    throw new Error(error?.message ?? "Failed to create product.");
  }

  if (input.images.length > 0) {
    const { error: imagesError } = await supabase.from("product_images").insert(
      input.images.map((image) => ({
        product_id: (product as Product).id,
        url: image.url,
        position: image.position,
      }))
    );

    if (imagesError) {
      console.error("Failed to create product images:", imagesError.message);
      throw new Error("Product created but images failed to save.");
    }
  }

  return product as Product;
}

export async function updateAdminProduct(
  id: string,
  input: AdminProductWriteInput
): Promise<{ product: Product; removedImageUrls: string[] }> {
  const supabase = await assertAdmin();

  const { data: existingImages, error: existingImagesError } = await supabase
    .from("product_images")
    .select("url")
    .eq("product_id", id);

  if (existingImagesError) {
    console.error(
      "Failed to load existing product images:",
      existingImagesError.message
    );
    throw new Error("Failed to update product images.");
  }

  const { data: product, error } = await supabase
    .from("products")
    .update({
      name: input.name,
      slug: input.slug,
      description: input.description,
      price: input.price,
      stock_quantity: input.stock_quantity,
      category_id: input.category_id,
      is_active: input.is_active,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select("*")
    .single();

  if (error || !product) {
    console.error("Failed to update product:", error?.message);
    throw new Error(error?.message ?? "Failed to update product.");
  }

  const { error: deleteImagesError } = await supabase
    .from("product_images")
    .delete()
    .eq("product_id", id);

  if (deleteImagesError) {
    console.error("Failed to clear product images:", deleteImagesError.message);
    throw new Error("Failed to update product images.");
  }

  if (input.images.length > 0) {
    const { error: imagesError } = await supabase.from("product_images").insert(
      input.images.map((image) => ({
        product_id: id,
        url: image.url,
        position: image.position,
      }))
    );

    if (imagesError) {
      console.error("Failed to insert product images:", imagesError.message);
      throw new Error("Failed to update product images.");
    }
  }

  const nextUrls = new Set(input.images.map((image) => image.url));
  const removedImageUrls = ((existingImages ?? []) as Array<{ url: string }>)
    .map((row) => row.url)
    .filter((url) => !nextUrls.has(url));

  return { product: product as Product, removedImageUrls };
}

export async function toggleAdminProductActive(
  id: string,
  isActive: boolean
): Promise<void> {
  const supabase = await assertAdmin();

  const { error } = await supabase
    .from("products")
    .update({
      is_active: isActive,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    console.error("Failed to toggle product active:", error.message);
    throw new Error("Failed to update product status.");
  }
}

export async function deleteAdminProduct(id: string): Promise<string[]> {
  const supabase = await assertAdmin();

  const { data: images, error: imagesError } = await supabase
    .from("product_images")
    .select("url")
    .eq("product_id", id);

  if (imagesError) {
    console.error("Failed to load product images for delete:", imagesError.message);
    throw new Error("Failed to delete product.");
  }

  const { error } = await supabase.from("products").delete().eq("id", id);

  if (error) {
    console.error("Failed to delete product:", error.message);
    throw new Error("Failed to delete product.");
  }

  return ((images ?? []) as Array<{ url: string }>).map((row) => row.url);
}

export async function ensureUniqueProductSlug(
  baseSlug: string,
  excludeId?: string
): Promise<string> {
  const supabase = await assertAdmin();
  let candidate = baseSlug || "product";
  let suffix = 1;

  while (true) {
    let query = supabase.from("products").select("id").eq("slug", candidate);

    if (excludeId) {
      query = query.neq("id", excludeId);
    }

    const { data, error } = await query.limit(1);

    if (error) {
      console.error("Failed to check slug uniqueness:", error.message);
      throw new Error("Failed to generate product slug.");
    }

    if (!data || data.length === 0) {
      return candidate;
    }

    suffix += 1;
    candidate = `${baseSlug}-${suffix}`.slice(0, 200);
  }
}
