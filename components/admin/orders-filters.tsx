"use client";

import { useRouter, usePathname } from "next/navigation";
import { useState, useTransition, FormEvent } from "react";
import { Search } from "lucide-react";
import { ORDER_STATUSES } from "@/lib/orders/status";
import type { OrderStatus } from "@/types";

interface OrdersFiltersProps {
  status: OrderStatus | "all";
  search: string;
}

function buildOrdersUrl(
  pathname: string,
  next: { status: OrderStatus | "all"; q: string }
): string {
  const params = new URLSearchParams();

  if (next.status !== "all") {
    params.set("status", next.status);
  }

  const trimmed = next.q.trim();
  if (trimmed) {
    params.set("q", trimmed);
  }

  const qs = params.toString();
  return qs ? `${pathname}?${qs}` : pathname;
}

export function OrdersFilters({ status, search }: OrdersFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [query, setQuery] = useState(search);
  const [isPending, startTransition] = useTransition();

  function navigate(nextStatus: OrderStatus | "all", nextQuery: string) {
    startTransition(() => {
      router.push(
        buildOrdersUrl(pathname, { status: nextStatus, q: nextQuery })
      );
    });
  }

  function onSearchSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    navigate(status, query);
  }

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-neutral-800 bg-neutral-900 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={isPending}
          onClick={() => navigate("all", query)}
          className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
            status === "all"
              ? "bg-lime-400 text-neutral-950"
              : "border border-neutral-700 text-neutral-300 hover:border-neutral-500"
          }`}
        >
          All
        </button>
        {ORDER_STATUSES.map((value) => (
          <button
            key={value}
            type="button"
            disabled={isPending}
            onClick={() => navigate(value, query)}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold capitalize transition ${
              status === value
                ? "bg-lime-400 text-neutral-950"
                : "border border-neutral-700 text-neutral-300 hover:border-neutral-500"
            }`}
          >
            {value}
          </button>
        ))}
      </div>

      <form onSubmit={onSearchSubmit} className="flex w-full gap-2 sm:w-auto">
        <label className="relative flex-1 sm:w-72">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500" />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search name or phone"
            className="w-full rounded-full border border-neutral-700 bg-neutral-950 py-2 pl-9 pr-3 text-sm text-white outline-none ring-lime-400 transition focus:border-lime-400 focus:ring-2"
          />
        </label>
        <button
          type="submit"
          disabled={isPending}
          className="rounded-full bg-neutral-100 px-4 py-2 text-sm font-semibold text-neutral-950 transition hover:bg-lime-400 disabled:opacity-60"
        >
          Search
        </button>
      </form>
    </div>
  );
}
