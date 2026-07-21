import { getCategoryIdBySlug } from "@/lib/db/categories";
import { createStaticClient } from "@/lib/supabase/static";
import type { Product } from "@/types";

const FEATURED_PRODUCT_LIMIT = 8;

export interface ProductImage {
  url: string;
  position: number;
}

export interface ProductCategory {
  slug: string;
  name: string;
}

export interface ProductWithImages extends Product {
  product_images: ProductImage[];
}

export interface ProductDetail extends ProductWithImages {
  categories: ProductCategory | null;
}

export type ProductSort = "newest" | "price-asc" | "price-desc";

export interface ProductListOptions {
  categorySlug?: string;
  sort?: ProductSort;
}

const PRODUCT_SELECT = "*, product_images(url, position)";

function parseSort(sort?: string): ProductSort {
  if (sort === "price-asc" || sort === "price-desc") {
    return sort;
  }
  return "newest";
}

export async function getProducts(
  options: ProductListOptions = {}
): Promise<ProductWithImages[]> {
  const supabase = createStaticClient();
  const sort = parseSort(options.sort);

  let query = supabase
    .from("products")
    .select(PRODUCT_SELECT)
    .eq("is_active", true);

  if (options.categorySlug) {
    const categoryId = await getCategoryIdBySlug(options.categorySlug);
    if (!categoryId) {
      return [];
    }
    query = query.eq("category_id", categoryId);
  }

  switch (sort) {
    case "price-asc":
      query = query.order("price", { ascending: true });
      break;
    case "price-desc":
      query = query.order("price", { ascending: false });
      break;
    default:
      query = query.order("created_at", { ascending: false });
  }

  const { data, error } = await query;

  if (error) {
    console.error("Failed to fetch products:", error.message);
    return [];
  }

  return (data ?? []) as ProductWithImages[];
}

export async function getFeaturedProducts(): Promise<ProductWithImages[]> {
  const products = await getProducts({ sort: "newest" });
  return products.slice(0, FEATURED_PRODUCT_LIMIT);
}

export async function getProductBySlug(
  slug: string
): Promise<ProductDetail | null> {
  const supabase = createStaticClient();

  const { data, error } = await supabase
    .from("products")
    .select(`${PRODUCT_SELECT}, categories(slug, name)`)
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();

  if (error) {
    console.error("Failed to fetch product:", error.message);
    return null;
  }

  if (!data) {
    return null;
  }

  return data as ProductDetail;
}

export async function getAllProductSlugs(): Promise<string[]> {
  const supabase = createStaticClient();

  const { data, error } = await supabase
    .from("products")
    .select("slug")
    .eq("is_active", true);

  if (error) {
    console.error("Failed to fetch product slugs:", error.message);
    return [];
  }

  const rows = (data ?? []) as Array<{ slug: string }>;
  return rows.map((row) => row.slug);
}

export function getSortedImages(product: ProductWithImages): ProductImage[] {
  return [...product.product_images].sort((a, b) => a.position - b.position);
}

export function getPrimaryImage(product: ProductWithImages): string | null {
  return getSortedImages(product)[0]?.url ?? null;
}
