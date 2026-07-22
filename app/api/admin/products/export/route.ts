import { NextResponse } from "next/server";
import {
  ADMIN_PRODUCT_SORTS,
  type AdminProductSort,
  type AdminProductStatusFilter,
  type AdminProductStockFilter,
} from "@/lib/admin/products";
import { getAdminProductsForExport } from "@/lib/db/admin-products";
import { csvDownloadResponse, rowsToCsv } from "@/lib/utils/csv";

export const dynamic = "force-dynamic";

function parseStatus(value: string | null): AdminProductStatusFilter {
  if (value === "active" || value === "inactive") return value;
  return "all";
}

function parseStock(value: string | null): AdminProductStockFilter {
  if (value === "in_stock" || value === "low" || value === "out") return value;
  return "all";
}

function parseSort(value: string | null): AdminProductSort {
  if (value && (ADMIN_PRODUCT_SORTS as string[]).includes(value)) {
    return value as AdminProductSort;
  }
  return "created_at";
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const products = await getAdminProductsForExport({
      q: searchParams.get("q")?.trim() || undefined,
      categoryId: searchParams.get("category")?.trim() || undefined,
      status: parseStatus(searchParams.get("status")),
      stock: parseStock(searchParams.get("stock")),
      sort: parseSort(searchParams.get("sort")),
      sortDir: searchParams.get("dir") === "asc" ? "asc" : "desc",
    });

    const csv = rowsToCsv(
      [
        "Product ID",
        "Name",
        "Slug",
        "Category",
        "Price",
        "Stock Quantity",
        "Active",
        "Variant Count",
        "Created At",
        "Updated At",
      ],
      products.map((product) => [
        product.id,
        product.name,
        product.slug,
        product.categories?.name ?? "",
        Number(product.price),
        Number(product.stock_quantity),
        product.is_active ? "yes" : "no",
        product.product_variants?.length ?? 0,
        product.created_at,
        product.updated_at,
      ])
    );

    const stamp = new Date().toISOString().slice(0, 10);
    return csvDownloadResponse(`products-${stamp}.csv`, csv);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to export products.";
    const status =
      message.includes("signed in") || message.includes("admin access")
        ? 401
        : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
