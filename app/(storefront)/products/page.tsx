import { Suspense } from "react";
import type { Metadata } from "next";
import { ProductFilters } from "@/components/storefront/product-filters";
import { ProductGrid } from "@/components/storefront/product-grid";
import { getAllCategories } from "@/lib/db/categories";
import { getProducts, type ProductSort } from "@/lib/db/products";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Shop All Tees | BOOK MY TEES",
  description:
    "Browse graphic tees, everyday basics, and limited drops from BOOK MY TEES. Filter by collection and sort by price.",
};

interface ProductsPageProps {
  searchParams: {
    category?: string;
    sort?: string;
  };
}

function parseSort(sort?: string): ProductSort {
  if (sort === "price-asc" || sort === "price-desc") {
    return sort;
  }
  return "newest";
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const categorySlug = searchParams.category;
  const sort = parseSort(searchParams.sort);

  const [categories, products] = await Promise.all([
    getAllCategories(),
    getProducts({ categorySlug, sort }),
  ]);

  const activeCategory = categories.find(
    (category) => category.slug === categorySlug
  );

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
      <div className="mb-8 flex flex-col gap-3 sm:mb-10">
        <p className="text-sm font-semibold uppercase tracking-widest text-lime-600">
          Shop all
        </p>
        <h1 className="text-3xl font-bold tracking-tight text-neutral-950 sm:text-4xl">
          {activeCategory ? activeCategory.name : "All tees"}
        </h1>
        <p className="max-w-2xl text-sm leading-relaxed text-neutral-600 sm:text-base">
          Premium cotton tees in bold prints and clean essentials. Ships across
          India with sizes and colours to match your style.
        </p>
      </div>

      <div className="mb-8">
        <Suspense fallback={<div className="h-20 animate-pulse rounded-xl bg-neutral-100" />}>
          <ProductFilters
            categories={categories}
            currentCategory={categorySlug}
            currentSort={sort}
          />
        </Suspense>
      </div>

      <p className="mb-6 text-sm text-neutral-500">
        {products.length} {products.length === 1 ? "product" : "products"}
      </p>

      <ProductGrid products={products} />
    </main>
  );
}
