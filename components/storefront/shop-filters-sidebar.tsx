"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search, MessageCircle } from "lucide-react";
import type { Category } from "@/types";

interface ShopFiltersSidebarProps {
  categories: Category[];
  currentCategorySlugs: string[];
  currentMinPrice?: number;
  currentMaxPrice?: number;
  currentSearch?: string;
  priceBounds: { min: number; max: number };
}

export function ShopFiltersSidebar({
  categories,
  currentCategorySlugs,
  currentMinPrice,
  currentMaxPrice,
  currentSearch,
  priceBounds,
}: ShopFiltersSidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [search, setSearch] = useState(currentSearch ?? "");
  const [minPrice, setMinPrice] = useState(
    currentMinPrice != null ? String(currentMinPrice) : ""
  );
  const [maxPrice, setMaxPrice] = useState(
    currentMaxPrice != null ? String(currentMaxPrice) : ""
  );

  const hasActiveFilters =
    currentCategorySlugs.length > 0 ||
    currentMinPrice != null ||
    currentMaxPrice != null ||
    Boolean(currentSearch);

  function navigate(params: URLSearchParams) {
    // Any filter change resets pagination back to page 1.
    params.delete("page");
    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname);
  }

  function toggleCategory(slug: string) {
    const params = new URLSearchParams(searchParams.toString());
    const next = new Set(currentCategorySlugs);
    if (next.has(slug)) {
      next.delete(slug);
    } else {
      next.add(slug);
    }
    if (next.size > 0) {
      params.set("category", Array.from(next).join(","));
    } else {
      params.delete("category");
    }
    navigate(params);
  }

  function applyPriceAndSearch(event: React.FormEvent) {
    event.preventDefault();
    const params = new URLSearchParams(searchParams.toString());

    if (search.trim()) {
      params.set("q", search.trim());
    } else {
      params.delete("q");
    }

    const min = minPrice.trim();
    const max = maxPrice.trim();
    if (min) {
      params.set("minPrice", min);
    } else {
      params.delete("minPrice");
    }
    if (max) {
      params.set("maxPrice", max);
    } else {
      params.delete("maxPrice");
    }

    navigate(params);
  }

  function clearAll() {
    setSearch("");
    setMinPrice("");
    setMaxPrice("");
    const params = new URLSearchParams(searchParams.toString());
    params.delete("category");
    params.delete("q");
    params.delete("minPrice");
    params.delete("maxPrice");
    params.delete("page");
    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname);
  }

  return (
    <aside className="flex flex-col gap-8">
      <form onSubmit={applyPriceAndSearch} className="flex flex-col gap-8">
        {/* Search */}
        <div className="flex flex-col gap-3">
          <h2 className="font-mono text-xs font-bold uppercase tracking-widest text-bone">
            Search
          </h2>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-dust" />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search tees…"
              className="w-full rounded-full border border-bone/15 bg-surface2 py-2.5 pl-10 pr-4 text-sm text-bone placeholder:text-dust outline-none ring-neon focus:border-neon focus:ring-2"
            />
          </div>
        </div>

        {/* Category */}
        {categories.length > 0 && (
          <div className="flex flex-col gap-3">
            <h2 className="font-mono text-xs font-bold uppercase tracking-widest text-bone">
              Category
            </h2>
            <ul className="flex flex-col gap-2.5">
              {categories.map((category) => {
                const checked = currentCategorySlugs.includes(category.slug);
                return (
                  <li key={category.id}>
                    <label className="flex cursor-pointer items-center gap-2.5 text-sm text-dust transition hover:text-bone">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleCategory(category.slug)}
                        className="h-4 w-4 shrink-0 rounded border-bone/30 bg-surface2 text-neon accent-neon focus:ring-neon"
                      />
                      <span className={checked ? "text-bone" : undefined}>
                        {category.name}
                      </span>
                    </label>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {/* Price range */}
        <div className="flex flex-col gap-3">
          <h2 className="font-mono text-xs font-bold uppercase tracking-widest text-bone">
            Price range
          </h2>
          <p className="font-mono text-[11px] text-dust">
            ₹{priceBounds.min} – ₹{priceBounds.max}
          </p>
          <div className="flex items-center gap-3">
            <input
              type="number"
              inputMode="numeric"
              min={0}
              value={minPrice}
              onChange={(event) => setMinPrice(event.target.value)}
              placeholder="Min"
              className="w-full min-w-0 rounded-full border border-bone/15 bg-surface2 px-4 py-2.5 text-sm text-bone placeholder:text-dust outline-none ring-neon focus:border-neon focus:ring-2"
            />
            <span className="shrink-0 text-dust">–</span>
            <input
              type="number"
              inputMode="numeric"
              min={0}
              value={maxPrice}
              onChange={(event) => setMaxPrice(event.target.value)}
              placeholder="Max"
              className="w-full min-w-0 rounded-full border border-bone/15 bg-surface2 px-4 py-2.5 text-sm text-bone placeholder:text-dust outline-none ring-neon focus:border-neon focus:ring-2"
            />
          </div>
        </div>

        <div className="flex flex-col gap-2.5">
          <button
            type="submit"
            className="w-full rounded-full bg-neon px-5 py-2.5 text-center font-mono text-xs font-bold uppercase tracking-wide text-ink transition hover:bg-bone"
          >
            Apply filters
          </button>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearAll}
              className="w-full rounded-full border border-bone/15 px-5 py-2.5 text-center font-mono text-xs uppercase tracking-wide text-dust transition hover:border-bone/40 hover:text-bone"
            >
              Clear all filters
            </button>
          )}
        </div>
      </form>

      {/* CTA */}
      <div className="rounded-2xl border border-bone/10 bg-surface2 p-6">
        <MessageCircle className="h-6 w-6 text-neon" />
        <h3 className="mt-3 font-display text-lg uppercase tracking-tight text-bone">
          Need help choosing?
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-dust">
          Not sure about sizing or which print suits you? Our team replies
          fast.
        </p>
        <Link
          href="/contact"
          className="mt-4 inline-flex items-center justify-center rounded-full border border-neon px-5 py-2.5 font-mono text-xs font-bold uppercase tracking-wide text-neon transition hover:bg-neon hover:text-ink"
        >
          Contact us
        </Link>
      </div>
    </aside>
  );
}
