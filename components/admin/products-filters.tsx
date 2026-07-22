"use client";

import { FormEvent, useState, useTransition } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Search, Tags } from "lucide-react";
import type {
  AdminProductSort,
  AdminProductStatusFilter,
  AdminProductStockFilter,
} from "@/lib/admin/products";
import { ADMIN_CATEGORIES_PATH } from "@/lib/admin/products";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Category } from "@/types";

export interface ProductsFiltersState {
  q: string;
  categoryId: string;
  status: AdminProductStatusFilter;
  stock: AdminProductStockFilter;
  sort: AdminProductSort;
  sortDir: "asc" | "desc";
}

interface ProductsFiltersProps {
  categories: Category[];
  filters: ProductsFiltersState;
}

function buildProductsUrl(
  pathname: string,
  next: ProductsFiltersState & { page?: number }
): string {
  const params = new URLSearchParams();

  if (next.q.trim()) params.set("q", next.q.trim());
  if (next.categoryId) params.set("category", next.categoryId);
  if (next.status !== "all") params.set("status", next.status);
  if (next.stock !== "all") params.set("stock", next.stock);
  if (next.sort !== "created_at") params.set("sort", next.sort);
  if (next.sortDir !== "desc") params.set("dir", next.sortDir);
  if (next.page && next.page > 1) params.set("page", String(next.page));

  const qs = params.toString();
  return qs ? `${pathname}?${qs}` : pathname;
}

export function ProductsFilters({ categories, filters }: ProductsFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [query, setQuery] = useState(filters.q);
  const [isPending, startTransition] = useTransition();

  function navigate(next: Partial<ProductsFiltersState>) {
    startTransition(() => {
      router.push(
        buildProductsUrl(pathname, {
          ...filters,
          q: query,
          ...next,
          page: 1,
        })
      );
    });
  }

  function onSearchSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    navigate({ q: query });
  }

  return (
    <div className="space-y-3 rounded-xl border border-border bg-card p-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <form onSubmit={onSearchSubmit} className="flex w-full gap-2 lg:max-w-md">
          <label className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search name or slug"
              className="pl-9"
            />
          </label>
          <Button type="submit" disabled={isPending}>
            Search
          </Button>
        </form>

        <Button variant="outline" asChild>
          <Link href={ADMIN_CATEGORIES_PATH}>
            <Tags className="h-4 w-4" />
            Categories
          </Link>
        </Button>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <label className="space-y-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Category
          <select
            value={filters.categoryId}
            disabled={isPending}
            onChange={(event) => navigate({ categoryId: event.target.value })}
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm text-foreground outline-none ring-ring focus-visible:ring-2"
          >
            <option value="">All categories</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Status
          <select
            value={filters.status}
            disabled={isPending}
            onChange={(event) =>
              navigate({
                status: event.target.value as AdminProductStatusFilter,
              })
            }
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm text-foreground outline-none ring-ring focus-visible:ring-2"
          >
            <option value="all">All statuses</option>
            <option value="active">Published</option>
            <option value="inactive">Unpublished</option>
          </select>
        </label>

        <label className="space-y-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Stock level
          <select
            value={filters.stock}
            disabled={isPending}
            onChange={(event) =>
              navigate({
                stock: event.target.value as AdminProductStockFilter,
              })
            }
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm text-foreground outline-none ring-ring focus-visible:ring-2"
          >
            <option value="all">All stock levels</option>
            <option value="in_stock">In stock (5+)</option>
            <option value="low">Low stock (1–4)</option>
            <option value="out">Out of stock</option>
          </select>
        </label>
      </div>
    </div>
  );
}

export { buildProductsUrl };
