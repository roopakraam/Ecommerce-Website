import Link from "next/link";
import { CsvExportButton } from "@/components/admin/csv-export-button";
import { ProductsFilters } from "@/components/admin/products-filters";
import { ProductsTable } from "@/components/admin/products-table";
import { Button } from "@/components/ui/button";
import {
  ADMIN_PRODUCT_SORTS,
  ADMIN_PRODUCTS_PATH,
  type AdminProductSort,
  type AdminProductStatusFilter,
  type AdminProductStockFilter,
} from "@/lib/admin/products";
import { getAdminProducts } from "@/lib/db/admin-products";
import { getAllCategories } from "@/lib/db/categories";

export const dynamic = "force-dynamic";

interface AdminProductsPageProps {
  searchParams: {
    q?: string;
    category?: string;
    status?: string;
    stock?: string;
    sort?: string;
    dir?: string;
    page?: string;
  };
}

function parseStatus(value: string | undefined): AdminProductStatusFilter {
  if (value === "active" || value === "inactive") return value;
  return "all";
}

function parseStock(value: string | undefined): AdminProductStockFilter {
  if (value === "in_stock" || value === "low" || value === "out") return value;
  return "all";
}

function parseSort(value: string | undefined): AdminProductSort {
  if (value && (ADMIN_PRODUCT_SORTS as string[]).includes(value)) {
    return value as AdminProductSort;
  }
  return "created_at";
}

export default async function AdminProductsPage({
  searchParams,
}: AdminProductsPageProps) {
  const filters = {
    q: searchParams.q?.trim() ?? "",
    categoryId: searchParams.category?.trim() ?? "",
    status: parseStatus(searchParams.status),
    stock: parseStock(searchParams.stock),
    sort: parseSort(searchParams.sort),
    sortDir: searchParams.dir === "asc" ? ("asc" as const) : ("desc" as const),
  };
  const page = Math.max(1, Number(searchParams.page ?? "1") || 1);

  const [categories, list] = await Promise.all([
    getAllCategories(),
    getAdminProducts({
      q: filters.q || undefined,
      categoryId: filters.categoryId || undefined,
      status: filters.status,
      stock: filters.stock,
      sort: filters.sort,
      sortDir: filters.sortDir,
      page,
    }),
  ]);

  const hasActiveFilters = Boolean(
    filters.q ||
      filters.categoryId ||
      filters.status !== "all" ||
      filters.stock !== "all"
  );

  const exportParams = new URLSearchParams();
  if (filters.q) exportParams.set("q", filters.q);
  if (filters.categoryId) exportParams.set("category", filters.categoryId);
  if (filters.status !== "all") exportParams.set("status", filters.status);
  if (filters.stock !== "all") exportParams.set("stock", filters.stock);
  if (filters.sort !== "created_at") exportParams.set("sort", filters.sort);
  if (filters.sortDir === "asc") exportParams.set("dir", "asc");
  const exportHref = `/api/admin/products/export${
    exportParams.size > 0 ? `?${exportParams.toString()}` : ""
  }`;

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Products
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Manage catalog, variants, stock, and publish status.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <CsvExportButton href={exportHref} />
          <Button asChild>
            <Link href={`${ADMIN_PRODUCTS_PATH}/new`}>New product</Link>
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        <ProductsFilters categories={categories} filters={filters} />
        <ProductsTable
          products={list.products}
          filters={filters}
          page={list.page}
          totalPages={list.totalPages}
          total={list.total}
          hasActiveFilters={hasActiveFilters}
        />
      </div>
    </main>
  );
}
