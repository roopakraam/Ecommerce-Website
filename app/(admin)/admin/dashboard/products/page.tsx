import Link from "next/link";
import { ProductsTable } from "@/components/admin/products-table";
import { getAdminProducts } from "@/lib/db/admin-products";

export const dynamic = "force-dynamic";

export default async function AdminProductsPage() {
  const products = await getAdminProducts();

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-lime-400">
            Catalog
          </p>
          <h1 className="mt-1 text-2xl font-bold text-white sm:text-3xl">
            Products
          </h1>
          <p className="mt-1 text-sm text-neutral-400">
            Create, edit, activate, and remove storefront products.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/admin/dashboard"
            className="rounded-full border border-neutral-700 px-4 py-2 text-sm font-semibold text-neutral-200 hover:border-neutral-500"
          >
            Dashboard
          </Link>
          <Link
            href="/admin/dashboard/products/new"
            className="rounded-full bg-lime-400 px-4 py-2 text-sm font-semibold text-neutral-950 hover:bg-lime-300"
          >
            New product
          </Link>
        </div>
      </div>

      <ProductsTable products={products} />
    </main>
  );
}
