"use client";

import { useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import { REVIEW_STATUSES, type AdminReviewStatusFilter } from "@/lib/admin/reviews";

interface ReviewsFiltersProps {
  status: AdminReviewStatusFilter;
}

export function ReviewsFilters({ status }: ReviewsFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  function navigate(nextStatus: AdminReviewStatusFilter) {
    const params = new URLSearchParams();
    if (nextStatus !== "all") {
      params.set("status", nextStatus);
    }
    const qs = params.toString();
    startTransition(() => {
      router.push(qs ? `${pathname}?${qs}` : pathname);
    });
  }

  return (
    <div className="flex flex-wrap gap-2 rounded-xl border border-border bg-card p-4">
      <button
        type="button"
        disabled={isPending}
        onClick={() => navigate("all")}
        className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
          status === "all"
            ? "bg-primary text-primary-foreground"
            : "border border-border text-muted-foreground hover:text-foreground"
        }`}
      >
        All
      </button>
      {REVIEW_STATUSES.map((value) => (
        <button
          key={value}
          type="button"
          disabled={isPending}
          onClick={() => navigate(value)}
          className={`rounded-full px-3 py-1.5 text-xs font-semibold capitalize transition ${
            status === value
              ? "bg-primary text-primary-foreground"
              : "border border-border text-muted-foreground hover:text-foreground"
          }`}
        >
          {value}
        </button>
      ))}
    </div>
  );
}
