import Link from "next/link";
import { ProductForm } from "@/components/admin/product-form";
import { getAllCategories } from "@/lib/db/categories";

export const dynamic = "force-dynamic";

export default async function NewProductPage() {
  const categories = await getAllCategories();

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6">
      <div className="mb-6">
        <Link
          href="/admin/dashboard/products"
          className="text-sm text-neutral-400 transition hover:text-white"
        >
          ← Back to products
        </Link>
        <h1 className="mt-3 text-2xl font-bold text-white sm:text-3xl">
          New product
        </h1>
        <p className="mt-1 text-sm text-neutral-400">
          Add details and upload product photos to Supabase Storage.
        </p>
      </div>

      <ProductForm mode="create" categories={categories} />
    </main>
  );
}
