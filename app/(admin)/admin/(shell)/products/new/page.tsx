import Link from "next/link";
import { ProductForm } from "@/components/admin/product-form";
import { getAllCategories } from "@/lib/db/categories";
import { ADMIN_PRODUCTS_PATH } from "@/lib/admin/products";

export const dynamic = "force-dynamic";

export default async function NewProductPage() {
  const categories = await getAllCategories();

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6">
      <div className="mb-6">
        <Link
          href={ADMIN_PRODUCTS_PATH}
          className="text-sm text-muted-foreground transition hover:text-foreground"
        >
          ← Back to products
        </Link>
        <h1 className="mt-3 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          New product
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Title, description, images, price, category, variants, and inventory.
        </p>
      </div>

      <ProductForm mode="create" categories={categories} />
    </main>
  );
}
