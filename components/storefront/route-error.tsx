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
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-500/10 text-red-400">
        <AlertTriangle className="h-7 w-7" />
      </div>
      <h1 className="mt-5 text-2xl font-black uppercase tracking-tight text-bone">{title}</h1>
      <p className="mt-3 max-w-md text-sm text-dust">
        {error.message || "We couldn’t load this page. Please try again."}
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={reset}
          className="rounded-full bg-neon px-6 py-3 text-sm font-bold uppercase tracking-wide text-ink transition hover:bg-bone"
        >
          Try again
        </button>
        <Link
          href="/"
          className="rounded-full border border-bone/20 px-6 py-3 text-sm font-semibold text-bone transition hover:border-neon hover:text-neon"
        >
          Back home
        </Link>
      </div>
    </main>
  );
}
