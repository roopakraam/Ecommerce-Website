"use client";

import Link from "next/link";
import { AlertTriangle } from "lucide-react";

interface AdminRouteErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
  title?: string;
}

export function AdminRouteError({
  error,
  reset,
  title = "Something went wrong",
}: AdminRouteErrorProps) {
  return (
    <main className="mx-auto flex max-w-2xl flex-col items-center px-4 py-20 text-center sm:px-6">
      <div className="flex h-14 w-14 items-center justify-center rounded-full border border-red-900 bg-red-950/50 text-red-300">
        <AlertTriangle className="h-7 w-7" />
      </div>
      <h1 className="mt-5 text-2xl font-bold text-white">{title}</h1>
      <p className="mt-3 max-w-md text-sm text-neutral-400">
        {error.message || "This admin page failed to load. Please try again."}
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={reset}
          className="rounded-full bg-lime-400 px-6 py-3 text-sm font-semibold text-neutral-950 transition hover:bg-lime-300"
        >
          Try again
        </button>
        <Link
          href="/admin/dashboard"
          className="rounded-full border border-neutral-700 px-6 py-3 text-sm font-semibold text-neutral-200 transition hover:border-neutral-500"
        >
          Dashboard
        </Link>
      </div>
    </main>
  );
}
