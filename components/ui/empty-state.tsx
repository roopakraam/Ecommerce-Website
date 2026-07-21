import Link from "next/link";
import { PackageSearch } from "lucide-react";

interface EmptyStateProps {
  title: string;
  description: string;
  actionHref?: string;
  actionLabel?: string;
  tone?: "light" | "dark";
}

export function EmptyState({
  title,
  description,
  actionHref,
  actionLabel,
  tone = "light",
}: EmptyStateProps) {
  const isDark = tone === "dark";

  return (
    <div
      className={`flex flex-col items-center rounded-2xl border border-dashed px-6 py-16 text-center ${
        isDark
          ? "border-neutral-700 bg-neutral-900/50"
          : "border-neutral-300 bg-neutral-50"
      }`}
    >
      <div
        className={`flex h-12 w-12 items-center justify-center rounded-full ${
          isDark
            ? "bg-neutral-800 text-neutral-400"
            : "bg-neutral-100 text-neutral-400"
        }`}
      >
        <PackageSearch className="h-6 w-6" />
      </div>
      <h2
        className={`mt-4 text-base font-semibold ${
          isDark ? "text-white" : "text-neutral-950"
        }`}
      >
        {title}
      </h2>
      <p
        className={`mt-2 max-w-md text-sm ${
          isDark ? "text-neutral-400" : "text-neutral-600"
        }`}
      >
        {description}
      </p>
      {actionHref && actionLabel ? (
        <Link
          href={actionHref}
          className={`mt-6 inline-flex rounded-full px-5 py-2.5 text-sm font-semibold transition ${
            isDark
              ? "bg-lime-400 text-neutral-950 hover:bg-lime-300"
              : "bg-neutral-950 text-white hover:bg-lime-400 hover:text-neutral-950"
          }`}
        >
          {actionLabel}
        </Link>
      ) : null}
    </div>
  );
}
