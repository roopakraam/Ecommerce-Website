import { createServerClient } from "@/lib/supabase/server";
import type { Category } from "@/types";

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

export interface AdminCategoryListItem extends Category {
  product_count: number;
}

export async function getAdminCategories(): Promise<AdminCategoryListItem[]> {
  const supabase = await assertAdmin();

  const [{ data: categories, error }, { data: products, error: productsError }] =
    await Promise.all([
      supabase.from("categories").select("*").order("name", { ascending: true }),
      supabase.from("products").select("category_id"),
    ]);

  if (error) {
    console.error("Failed to load categories:", error.message);
    throw new Error("Failed to load categories.");
  }

  if (productsError) {
    console.error("Failed to count category products:", productsError.message);
    throw new Error("Failed to load categories.");
  }

  const counts = new Map<string, number>();
  for (const row of products ?? []) {
    const categoryId = (row as { category_id: string | null }).category_id;
    if (!categoryId) {
      continue;
    }
    counts.set(categoryId, (counts.get(categoryId) ?? 0) + 1);
  }

  return ((categories ?? []) as Category[]).map((category) => ({
    ...category,
    product_count: counts.get(category.id) ?? 0,
  }));
}

export async function createAdminCategory(input: {
  name: string;
  slug: string;
}): Promise<Category> {
  const supabase = await assertAdmin();

  const { data, error } = await supabase
    .from("categories")
    .insert({
      name: input.name,
      slug: input.slug,
    })
    .select("*")
    .single();

  if (error || !data) {
    console.error("Failed to create category:", error?.message);
    if (error?.code === "23505") {
      throw new Error("A category with that slug already exists.");
    }
    throw new Error(error?.message ?? "Failed to create category.");
  }

  return data as Category;
}

export async function updateAdminCategory(
  id: string,
  input: { name: string; slug: string }
): Promise<Category> {
  const supabase = await assertAdmin();

  const { data, error } = await supabase
    .from("categories")
    .update({
      name: input.name,
      slug: input.slug,
    })
    .eq("id", id)
    .select("*")
    .single();

  if (error || !data) {
    console.error("Failed to update category:", error?.message);
    if (error?.code === "23505") {
      throw new Error("A category with that slug already exists.");
    }
    throw new Error(error?.message ?? "Failed to update category.");
  }

  return data as Category;
}

export async function deleteAdminCategory(id: string): Promise<void> {
  const supabase = await assertAdmin();

  const { count, error: countError } = await supabase
    .from("products")
    .select("id", { count: "exact", head: true })
    .eq("category_id", id);

  if (countError) {
    console.error("Failed to check category products:", countError.message);
    throw new Error("Failed to delete category.");
  }

  if ((count ?? 0) > 0) {
    throw new Error(
      "Remove or reassign products in this category before deleting it."
    );
  }

  const { error } = await supabase.from("categories").delete().eq("id", id);

  if (error) {
    console.error("Failed to delete category:", error.message);
    throw new Error("Failed to delete category.");
  }
}

export async function ensureUniqueCategorySlug(
  baseSlug: string,
  excludeId?: string
): Promise<string> {
  const supabase = await assertAdmin();
  let candidate = baseSlug || "category";
  let suffix = 1;

  while (true) {
    let query = supabase.from("categories").select("id").eq("slug", candidate);
    if (excludeId) {
      query = query.neq("id", excludeId);
    }

    const { data, error } = await query.limit(1);
    if (error) {
      console.error("Failed to check category slug:", error.message);
      throw new Error("Failed to generate category slug.");
    }

    if (!data || data.length === 0) {
      return candidate;
    }

    suffix += 1;
    candidate = `${baseSlug}-${suffix}`.slice(0, 120);
  }
}
