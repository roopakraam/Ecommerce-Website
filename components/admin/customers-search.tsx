"use client";

import { FormEvent, useState, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface CustomersSearchProps {
  search: string;
}

export function CustomersSearch({ search }: CustomersSearchProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [query, setQuery] = useState(search);
  const [isPending, startTransition] = useTransition();

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const params = new URLSearchParams();
    const trimmed = query.trim();
    if (trimmed) {
      params.set("q", trimmed);
    }
    const qs = params.toString();
    startTransition(() => {
      router.push(qs ? `${pathname}?${qs}` : pathname);
    });
  }

  return (
    <form
      onSubmit={onSubmit}
      className="flex w-full flex-col gap-2 rounded-xl border border-border bg-card p-4 sm:flex-row sm:items-center"
    >
      <label className="relative flex-1">
        <span className="sr-only">Search customers</span>
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search by name or phone"
          className="pl-9"
        />
      </label>
      <Button type="submit" disabled={isPending}>
        Search
      </Button>
    </form>
  );
}
