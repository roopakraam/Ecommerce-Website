"use client";

import Link from "next/link";
import { AlertTriangle } from "lucide-react";

interface StorefrontRouteErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
  title?: string;
}

export function StorefrontRouteError({
  error,
  reset,
  title = "Something went wrong",
}: StorefrontRouteErrorProps) {
  return (
    <main className="mx-auto flex max-w-2xl flex-col items-center px-4 py-20 text-center sm:px-6">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-red-600">
        <AlertTriangle className="h-7 w-7" />
      </div>
      <h1 className="mt-5 text-2xl font-bold text-neutral-950">{title}</h1>
      <p className="mt-3 max-w-md text-sm text-neutral-600">
        {error.message || "We couldn’t load this page. Please try again."}
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={reset}
          className="rounded-full bg-neutral-950 px-6 py-3 text-sm font-semibold text-white transition hover:bg-lime-400 hover:text-neutral-950"
        >
          Try again
        </button>
        <Link
          href="/"
          className="rounded-full border border-neutral-300 px-6 py-3 text-sm font-semibold text-neutral-950 transition hover:border-neutral-950"
        >
          Back home
        </Link>
      </div>
    </main>
  );
}
