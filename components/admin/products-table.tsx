"use client";

import { useMemo, useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Pencil,
  Trash2,
} from "lucide-react";
import {
  bulkDeleteProductsAction,
  bulkSetProductsActiveAction,
  deleteProductAction,
  toggleProductActiveAction,
} from "@/lib/actions/admin-products";
import type { AdminProductListItem } from "@/lib/db/admin-products";
import {
  ADMIN_PRODUCTS_PATH,
  type AdminProductSort,
} from "@/lib/admin/products";
import { formatPrice } from "@/lib/utils/format-price";
import { buildProductsUrl, type ProductsFiltersState } from "@/components/admin/products-filters";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";

interface ProductsTableProps {
  products: AdminProductListItem[];
  filters: ProductsFiltersState;
  page: number;
  totalPages: number;
  total: number;
  hasActiveFilters: boolean;
}

function getCoverUrl(product: AdminProductListItem): string | null {
  const sorted = [...product.product_images].sort(
    (a, b) => a.position - b.position
  );
  return sorted[0]?.url ?? null;
}

function SortHeader({
  label,
  column,
  filters,
  pathname,
}: {
  label: string;
  column: AdminProductSort;
  filters: ProductsFiltersState;
  pathname: string;
}) {
  const active = filters.sort === column;
  const nextDir =
    active && filters.sortDir === "asc" ? "desc" : active ? "asc" : "asc";
  const href = buildProductsUrl(pathname, {
    ...filters,
    sort: column,
    sortDir: nextDir,
    page: 1,
  });

  const Icon = !active
    ? ArrowUpDown
    : filters.sortDir === "asc"
      ? ArrowUp
      : ArrowDown;

  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1 font-semibold transition hover:text-foreground"
    >
      {label}
      <Icon className="h-3.5 w-3.5" />
    </Link>
  );
}

export function ProductsTable({
  products,
  filters,
  page,
  totalPages,
  total,
  hasActiveFilters,
}: ProductsTableProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isPending, startTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const pageIds = useMemo(() => products.map((product) => product.id), [products]);
  const allSelected =
    pageIds.length > 0 && pageIds.every((id) => selectedIds.includes(id));

  function toggleAll() {
    setSelectedIds((current) =>
      allSelected
        ? current.filter((id) => !pageIds.includes(id))
        : Array.from(new Set([...current, ...pageIds]))
    );
  }

  function toggleOne(id: string) {
    setSelectedIds((current) =>
      current.includes(id)
        ? current.filter((value) => value !== id)
        : [...current, id]
    );
  }

  function runBulk(action: () => Promise<void>) {
    setErrorMessage(null);
    startTransition(async () => {
      try {
        await action();
        setSelectedIds([]);
        router.refresh();
      } catch (error) {
        setErrorMessage(
          error instanceof Error ? error.message : "Something went wrong."
        );
      }
    });
  }

  function handleBulkPublish(isActive: boolean) {
    if (selectedIds.length === 0) return;
    runBulk(async () => {
      const result = await bulkSetProductsActiveAction({
        productIds: selectedIds,
        isActive,
      });
      if (!result.success) throw new Error(result.error);
    });
  }

  function handleBulkDelete() {
    if (selectedIds.length === 0) return;
    const confirmed = window.confirm(
      `Delete ${selectedIds.length} product${selectedIds.length === 1 ? "" : "s"}? This cannot be undone.`
    );
    if (!confirmed) return;

    runBulk(async () => {
      const result = await bulkDeleteProductsAction({ productIds: selectedIds });
      if (!result.success) throw new Error(result.error);
    });
  }

  function handleToggle(product: AdminProductListItem) {
    setErrorMessage(null);
    startTransition(async () => {
      const result = await toggleProductActiveAction(
        product.id,
        !product.is_active
      );
      if (!result.success) {
        setErrorMessage(result.error);
        return;
      }
      router.refresh();
    });
  }

  function handleDelete(product: AdminProductListItem) {
    const confirmed = window.confirm(
      `Delete “${product.name}”? This cannot be undone.`
    );
    if (!confirmed) return;

    setErrorMessage(null);
    startTransition(async () => {
      const result = await deleteProductAction(product.id);
      if (!result.success) {
        setErrorMessage(result.error);
        return;
      }
      setSelectedIds((current) => current.filter((id) => id !== product.id));
      router.refresh();
    });
  }

  if (products.length === 0) {
    return (
      <EmptyState
        tone="dark"
        title={hasActiveFilters ? "No products match your filters" : "No products yet"}
        description={
          hasActiveFilters
            ? "Try a different category, status, stock level, or search term."
            : "Add your first tee to start selling on the BOOK MY TEES storefront."
        }
        actionHref={
          hasActiveFilters ? ADMIN_PRODUCTS_PATH : `${ADMIN_PRODUCTS_PATH}/new`
        }
        actionLabel={hasActiveFilters ? "Clear filters" : "Add your first product"}
      />
    );
  }

  const prevHref =
    page > 1
      ? buildProductsUrl(pathname, { ...filters, page: page - 1 })
      : null;
  const nextHref =
    page < totalPages
      ? buildProductsUrl(pathname, { ...filters, page: page + 1 })
      : null;

  return (
    <div className="space-y-4">
      {errorMessage ? (
        <p className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive-foreground">
          {errorMessage}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card px-4 py-3">
        <p className="text-sm text-muted-foreground">
          {selectedIds.length > 0
            ? `${selectedIds.length} selected`
            : `${total} product${total === 1 ? "" : "s"}`}
        </p>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={isPending || selectedIds.length === 0}
            onClick={() => handleBulkPublish(true)}
          >
            Publish
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={isPending || selectedIds.length === 0}
            onClick={() => handleBulkPublish(false)}
          >
            Unpublish
          </Button>
          <Button
            type="button"
            size="sm"
            variant="destructive"
            disabled={isPending || selectedIds.length === 0}
            onClick={handleBulkDelete}
          >
            Delete
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="min-w-full divide-y divide-border text-left text-sm">
          <thead className="bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-3">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={toggleAll}
                  aria-label="Select all products on this page"
                  className="h-4 w-4 rounded border-input"
                />
              </th>
              <th className="px-4 py-3">
                <SortHeader
                  label="Product"
                  column="name"
                  filters={filters}
                  pathname={pathname}
                />
              </th>
              <th className="px-4 py-3 font-semibold">Category</th>
              <th className="px-4 py-3">
                <SortHeader
                  label="Price"
                  column="price"
                  filters={filters}
                  pathname={pathname}
                />
              </th>
              <th className="px-4 py-3">
                <SortHeader
                  label="Stock"
                  column="stock_quantity"
                  filters={filters}
                  pathname={pathname}
                />
              </th>
              <th className="px-4 py-3">
                <SortHeader
                  label="Status"
                  column="is_active"
                  filters={filters}
                  pathname={pathname}
                />
              </th>
              <th className="px-4 py-3 text-right font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border bg-background">
            {products.map((product) => {
              const cover = getCoverUrl(product);
              const checked = selectedIds.includes(product.id);

              return (
                <tr key={product.id} className="align-middle">
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleOne(product.id)}
                      aria-label={`Select ${product.name}`}
                      className="h-4 w-4 rounded border-input"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="relative h-12 w-12 overflow-hidden rounded-lg bg-muted">
                        {cover ? (
                          <Image
                            src={cover}
                            alt={product.name}
                            fill
                            className="object-cover"
                            sizes="48px"
                            unoptimized
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-[10px] text-muted-foreground">
                            No img
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-foreground">
                          {product.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {product.slug}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {product.categories?.name ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-foreground">
                    {formatPrice(Number(product.price))}
                  </td>
                  <td className="px-4 py-3 text-foreground">
                    {product.stock_quantity}
                    <span className="ml-1 text-xs text-muted-foreground">
                      (
                      {
                        (product.product_variants ?? []).filter((v) => v.is_active)
                          .length
                      }{" "}
                      var)
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() => handleToggle(product)}
                      className={`rounded-full border px-3 py-1 text-xs font-semibold transition disabled:opacity-50 ${
                        product.is_active
                          ? "border-emerald-700 bg-emerald-950 text-emerald-300"
                          : "border-border bg-muted text-muted-foreground"
                      }`}
                    >
                      {product.is_active ? "Published" : "Unpublished"}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`${ADMIN_PRODUCTS_PATH}/${product.id}/edit`}>
                          <Pencil className="h-3.5 w-3.5" />
                          Edit
                        </Link>
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={isPending}
                        onClick={() => handleDelete(product)}
                        className="border-destructive/40 text-red-300 hover:bg-destructive/10"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Delete
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-muted-foreground">
          Page {page} of {totalPages}
        </p>
        <div className="flex gap-2">
          {prevHref ? (
            <Button variant="outline" size="sm" asChild>
              <Link href={prevHref}>Previous</Link>
            </Button>
          ) : (
            <Button variant="outline" size="sm" disabled>
              Previous
            </Button>
          )}
          {nextHref ? (
            <Button variant="outline" size="sm" asChild>
              <Link href={nextHref}>Next</Link>
            </Button>
          ) : (
            <Button variant="outline" size="sm" disabled>
              Next
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
