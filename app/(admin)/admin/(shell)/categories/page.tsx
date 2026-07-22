import { CategoriesManager } from "@/components/admin/categories-manager";
import { getAdminCategories } from "@/lib/db/admin-categories";

export const dynamic = "force-dynamic";

export default async function AdminCategoriesPage() {
  const categories = await getAdminCategories();

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Categories
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Create and manage product categories used across the catalog.
        </p>
      </div>

      <CategoriesManager categories={categories} />
    </main>
  );
}
