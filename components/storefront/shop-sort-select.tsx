"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { ProductSort } from "@/lib/db/products";

interface ShopSortSelectProps {
  currentSort: ProductSort;
}

const sortOptions: { value: ProductSort; label: string }[] = [
  { value: "newest", label: "Newest" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
];

export function ShopSortSelect({ currentSort }: ShopSortSelectProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function handleChange(sort: ProductSort) {
    const params = new URLSearchParams(searchParams.toString());
    if (sort === "newest") {
      params.delete("sort");
    } else {
      params.set("sort", sort);
    }
    params.delete("page");
    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname);
  }

  return (
    <div className="flex items-center gap-2.5">
      <label htmlFor="sort-filter" className="font-mono text-[11px] uppercase tracking-wide text-dust">
        Sort
      </label>
      <select
        id="sort-filter"
        value={currentSort}
        onChange={(event) => handleChange(event.target.value as ProductSort)}
        className="rounded-full border border-bone/20 bg-surface2 px-4 py-2 text-sm text-bone outline-none ring-neon focus:border-neon focus:ring-2"
      >
        {sortOptions.map((option) => (
          <option key={option.value} value={option.value} className="bg-surface2 text-bone">
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
