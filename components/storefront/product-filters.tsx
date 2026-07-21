"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { Category } from "@/types";
import type { ProductSort } from "@/lib/db/products";

interface ProductFiltersProps {
  categories: Category[];
  currentCategory?: string;
  currentSort: ProductSort;
}

const sortOptions: { value: ProductSort; label: string }[] = [
  { value: "newest", label: "Newest" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
];

export function ProductFilters({
  categories,
  currentCategory,
  currentSort,
}: ProductFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function updateFilters(updates: { category?: string; sort?: ProductSort }) {
    const params = new URLSearchParams(searchParams.toString());

    if (updates.category !== undefined) {
      if (updates.category) {
        params.set("category", updates.category);
      } else {
        params.delete("category");
      }
    }

    if (updates.sort !== undefined) {
      if (updates.sort === "newest") {
        params.delete("sort");
      } else {
        params.set("sort", updates.sort);
      }
    }

    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname);
  }

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="flex flex-col gap-2">
        <label htmlFor="category-filter" className="text-sm font-medium text-neutral-700">
          Category
        </label>
        <select
          id="category-filter"
          value={currentCategory ?? ""}
          onChange={(event) => updateFilters({ category: event.target.value })}
          className="w-full rounded-xl border border-neutral-300 bg-white px-4 py-2.5 text-sm text-neutral-950 outline-none ring-lime-400 focus:border-lime-400 focus:ring-2 sm:w-56"
        >
          <option value="">All categories</option>
          {categories.map((category) => (
            <option key={category.id} value={category.slug}>
              {category.name}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="sort-filter" className="text-sm font-medium text-neutral-700">
          Sort by
        </label>
        <select
          id="sort-filter"
          value={currentSort}
          onChange={(event) =>
            updateFilters({ sort: event.target.value as ProductSort })
          }
          className="w-full rounded-xl border border-neutral-300 bg-white px-4 py-2.5 text-sm text-neutral-950 outline-none ring-lime-400 focus:border-lime-400 focus:ring-2 sm:w-56"
        >
          {sortOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
