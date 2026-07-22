"use client";

import { FormEvent, useState, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { ORDER_STATUSES } from "@/lib/orders/status";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { OrderStatus } from "@/types";

export interface OrdersFiltersState {
  status: OrderStatus | "all";
  search: string;
  fromDate: string;
  toDate: string;
}

interface OrdersFiltersProps {
  filters: OrdersFiltersState;
}

function buildOrdersUrl(
  pathname: string,
  next: OrdersFiltersState
): string {
  const params = new URLSearchParams();

  if (next.status !== "all") {
    params.set("status", next.status);
  }

  const trimmed = next.search.trim();
  if (trimmed) {
    params.set("q", trimmed);
  }

  if (next.fromDate) {
    params.set("from", next.fromDate);
  }

  if (next.toDate) {
    params.set("to", next.toDate);
  }

  const qs = params.toString();
  return qs ? `${pathname}?${qs}` : pathname;
}

export function OrdersFilters({ filters }: OrdersFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [query, setQuery] = useState(filters.search);
  const [fromDate, setFromDate] = useState(filters.fromDate);
  const [toDate, setToDate] = useState(filters.toDate);
  const [isPending, startTransition] = useTransition();

  function navigate(next: Partial<OrdersFiltersState>) {
    startTransition(() => {
      router.push(
        buildOrdersUrl(pathname, {
          status: filters.status,
          search: query,
          fromDate,
          toDate,
          ...next,
        })
      );
    });
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    navigate({ search: query, fromDate, toDate });
  }

  return (
    <div className="space-y-3 rounded-xl border border-border bg-card p-4">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={isPending}
          onClick={() => navigate({ status: "all" })}
          className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
            filters.status === "all"
              ? "bg-primary text-primary-foreground"
              : "border border-border text-muted-foreground hover:border-primary/40 hover:text-foreground"
          }`}
        >
          All
        </button>
        {ORDER_STATUSES.map((value) => (
          <button
            key={value}
            type="button"
            disabled={isPending}
            onClick={() => navigate({ status: value })}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold capitalize transition ${
              filters.status === value
                ? "bg-primary text-primary-foreground"
                : "border border-border text-muted-foreground hover:border-primary/40 hover:text-foreground"
            }`}
          >
            {value}
          </button>
        ))}
      </div>

      <form
        onSubmit={onSubmit}
        className="grid gap-3 md:grid-cols-[1fr_auto_auto_auto] md:items-end"
      >
        <label className="space-y-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Search
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Customer name or phone"
              className="pl-9"
            />
          </div>
        </label>

        <label className="space-y-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          From
          <Input
            type="date"
            value={fromDate}
            onChange={(event) => setFromDate(event.target.value)}
          />
        </label>

        <label className="space-y-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          To
          <Input
            type="date"
            value={toDate}
            onChange={(event) => setToDate(event.target.value)}
          />
        </label>

        <Button type="submit" disabled={isPending}>
          Apply
        </Button>
      </form>
    </div>
  );
}
