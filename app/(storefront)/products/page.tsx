import { PageHero } from "@/components/storefront/page-hero";
import { ShopFiltersSidebar } from "@/components/storefront/shop-filters-sidebar";
import { ShopSortSelect } from "@/components/storefront/shop-sort-select";
import { ShopPagination } from "@/components/storefront/shop-pagination";
import { ProductGrid } from "@/components/storefront/product-grid";
import { getAllCategories } from "@/lib/db/categories";
import {
  getPaginatedProducts,
  getProductPriceRange,
  type ProductSort,
} from "@/lib/db/products";
import { buildPageMetadata } from "@/lib/seo/site";

export const revalidate = 60;

export const metadata = buildPageMetadata({
  title: "Shop All Tees",
  description:
    "Browse graphic tees, everyday basics, and limited drops from BOOK MY TEES. Filter by category, price, and search the full catalog.",
  path: "/products",
});

interface ProductsPageProps {
  searchParams: {
    category?: string;
    sort?: string;
    q?: string;
    minPrice?: string;
    maxPrice?: string;
    page?: string;
  };
}

function parseSort(sort?: string): ProductSort {
  if (sort === "price-asc" || sort === "price-desc") {
    return sort;
  }
  return "newest";
}

function parseNumberParam(value?: string): number | undefined {
  if (!value) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : undefined;
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const categorySlugs = searchParams.category
    ? searchParams.category.split(",").filter(Boolean)
    : [];
  const sort = parseSort(searchParams.sort);
  const search = searchParams.q?.trim() || undefined;
  const minPrice = parseNumberParam(searchParams.minPrice);
  const maxPrice = parseNumberParam(searchParams.maxPrice);
  const page = Math.max(1, Number(searchParams.page) || 1);

  const [categories, priceBounds, result] = await Promise.all([
    getAllCategories(),
    getProductPriceRange(),
    getPaginatedProducts({
      categorySlugs,
      sort,
      search,
      minPrice,
      maxPrice,
      page,
      pageSize: 12,
    }),
  ]);

  const activeCategoryNames = categories
    .filter((category) => categorySlugs.includes(category.slug))
    .map((category) => category.name);

  function buildPageHref(targetPage: number): string {
    const params = new URLSearchParams();
    if (categorySlugs.length > 0) params.set("category", categorySlugs.join(","));
    if (sort !== "newest") params.set("sort", sort);
    if (search) params.set("q", search);
    if (minPrice != null) params.set("minPrice", String(minPrice));
    if (maxPrice != null) params.set("maxPrice", String(maxPrice));
    if (targetPage > 1) params.set("page", String(targetPage));
    const query = params.toString();
    return query ? `/products?${query}` : "/products";
  }

  const heroTitle =
    activeCategoryNames.length === 1 ? activeCategoryNames[0] : "All Tees";

  return (
    <main className="bg-ink">
      <PageHero
        eyebrow="Shop all"
        title={heroTitle}
        description="Premium cotton tees in bold prints and clean essentials. Ships across India with sizes and colours to match your style."
      />

      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14">
        <div className="grid gap-10 lg:grid-cols-[260px_1fr] lg:gap-12">
          {/* Filters sidebar */}
          <ShopFiltersSidebar
            categories={categories}
            currentCategorySlugs={categorySlugs}
            currentMinPrice={minPrice}
            currentMaxPrice={maxPrice}
            currentSearch={search}
            priceBounds={priceBounds}
          />

          {/* Product grid */}
          <div>
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
              <p className="font-mono text-xs text-dust">
                {result.total} {result.total === 1 ? "product" : "products"}
                {search && <> for &ldquo;{search}&rdquo;</>}
              </p>
              <ShopSortSelect currentSort={sort} />
            </div>

            <ProductGrid
              products={result.products}
              priorityCount={3}
              emptyVariant={
                categorySlugs.length > 0 || search || minPrice != null || maxPrice != null
                  ? "filtered"
                  : "catalog"
              }
              emptyCategoryName={activeCategoryNames[0]}
            />

            <ShopPagination
              page={result.page}
              totalPages={result.totalPages}
              buildHref={buildPageHref}
            />
          </div>
        </div>
      </div>
    </main>
  );
}
