import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface ShopPaginationProps {
  page: number;
  totalPages: number;
  buildHref: (page: number) => string;
}

function getPageNumbers(page: number, totalPages: number): (number | "ellipsis")[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const pages = new Set<number>([1, totalPages, page, page - 1, page + 1]);
  const sorted = Array.from(pages)
    .filter((p) => p >= 1 && p <= totalPages)
    .sort((a, b) => a - b);

  const result: (number | "ellipsis")[] = [];
  let prev: number | null = null;
  for (const p of sorted) {
    if (prev !== null && p - prev > 1) {
      result.push("ellipsis");
    }
    result.push(p);
    prev = p;
  }
  return result;
}

export function ShopPagination({ page, totalPages, buildHref }: ShopPaginationProps) {
  if (totalPages <= 1) {
    return null;
  }

  const pageNumbers = getPageNumbers(page, totalPages);

  return (
    <nav
      aria-label="Pagination"
      className="mt-10 flex items-center justify-center gap-1.5 sm:gap-2"
    >
      <PageLink
        href={buildHref(page - 1)}
        disabled={page <= 1}
        ariaLabel="Previous page"
      >
        <ChevronLeft className="h-4 w-4" />
      </PageLink>

      {pageNumbers.map((p, index) =>
        p === "ellipsis" ? (
          <span
            key={`ellipsis-${index}`}
            className="flex h-9 w-9 items-center justify-center font-mono text-xs text-dust"
          >
            …
          </span>
        ) : (
          <PageLink key={p} href={buildHref(p)} active={p === page}>
            {p}
          </PageLink>
        )
      )}

      <PageLink
        href={buildHref(page + 1)}
        disabled={page >= totalPages}
        ariaLabel="Next page"
      >
        <ChevronRight className="h-4 w-4" />
      </PageLink>
    </nav>
  );
}

function PageLink({
  href,
  active,
  disabled,
  ariaLabel,
  children,
}: {
  href: string;
  active?: boolean;
  disabled?: boolean;
  ariaLabel?: string;
  children: React.ReactNode;
}) {
  const base =
    "flex h-9 w-9 items-center justify-center rounded-full font-mono text-xs font-bold transition";

  if (disabled) {
    return (
      <span className={`${base} cursor-not-allowed border border-bone/10 text-dust/40`}>
        {children}
      </span>
    );
  }

  return (
    <Link
      href={href}
      aria-label={ariaLabel}
      aria-current={active ? "page" : undefined}
      className={`${base} ${
        active
          ? "bg-neon text-ink"
          : "border border-bone/15 text-bone/70 hover:border-neon hover:text-bone"
      }`}
    >
      {children}
    </Link>
  );
}
