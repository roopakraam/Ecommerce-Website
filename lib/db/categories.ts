import { createStaticClient } from "@/lib/supabase/static";
import type { Category } from "@/types";

const FEATURED_CATEGORY_LIMIT = 5;

export async function getAllCategories(): Promise<Category[]> {
  const supabase = createStaticClient();

  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .order("name");

  if (error) {
    console.error("Failed to fetch categories:", error.message);
    return [];
  }

  return data ?? [];
}

export async function getFeaturedCategories(): Promise<Category[]> {
  const categories = await getAllCategories();
  return categories.slice(0, FEATURED_CATEGORY_LIMIT);
}

export async function getCategoryIdBySlug(slug: string): Promise<string | null> {
  const supabase = createStaticClient();

  const { data, error } = await supabase
    .from("categories")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();

  if (error) {
    console.error("Failed to fetch category:", error.message);
    return null;
  }

  const row = data as { id: string } | null;
  return row?.id ?? null;
}
