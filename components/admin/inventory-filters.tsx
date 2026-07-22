"use client";

import { FormEvent, useMemo, useState, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface InventoryFiltersProps {
  search: string;
  lowStockOnly: boolean;
}

export function InventoryFilters({
  search,
  lowStockOnly,
}: InventoryFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [query, setQuery] = useState(search);
  const [isPending, startTransition] = useTransition();

  const lowStockHref = useMemo(() => {
    const params = new URLSearchParams();
    if (query.trim()) params.set("q", query.trim());
    if (!lowStockOnly) params.set("low", "1");
    const qs = params.toString();
    return qs ? `${pathname}?${qs}` : pathname;
  }, [lowStockOnly, pathname, query]);

  const allHref = useMemo(() => {
    const params = new URLSearchParams();
    if (query.trim()) params.set("q", query.trim());
    const qs = params.toString();
    return qs ? `${pathname}?${qs}` : pathname;
  }, [pathname, query]);

  function navigate(href: string) {
    startTransition(() => {
      router.push(href);
    });
  }

  function onSearchSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const params = new URLSearchParams();
    if (query.trim()) params.set("q", query.trim());
    if (lowStockOnly) params.set("low", "1");
    const qs = params.toString();
    navigate(qs ? `${pathname}?${qs}` : pathname);
  }

  return (
    <div className="space-y-3 rounded-xl border border-border bg-card p-4">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={isPending}
          onClick={() => navigate(allHref)}
          className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
            !lowStockOnly
              ? "bg-primary text-primary-foreground"
              : "border border-border text-muted-foreground hover:text-foreground"
          }`}
        >
          All stock
        </button>
        <button
          type="button"
          disabled={isPending}
          onClick={() => navigate(lowStockHref)}
          className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
            lowStockOnly
              ? "bg-primary text-primary-foreground"
              : "border border-border text-muted-foreground hover:text-foreground"
          }`}
        >
          Low stock (&lt;5)
        </button>
      </div>

      <form onSubmit={onSearchSubmit} className="flex gap-2">
        <label className="relative flex-1">
          <span className="sr-only">Search inventory</span>
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search product, SKU, size, or colour"
            className="pl-9"
          />
        </label>
        <Button type="submit" disabled={isPending}>
          Search
        </Button>
      </form>
    </div>
  );
}
