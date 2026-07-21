interface AdminRouteLoadingProps {
  variant?: "default" | "table" | "form" | "detail";
}

export function AdminRouteLoading({
  variant = "default",
}: AdminRouteLoadingProps) {
  if (variant === "table") {
    return (
      <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
        <div className="mb-6 space-y-2">
          <div className="h-3 w-20 animate-pulse rounded bg-neutral-800" />
          <div className="h-8 w-40 animate-pulse rounded bg-neutral-800" />
        </div>
        <div className="mb-4 h-16 animate-pulse rounded-2xl bg-neutral-900" />
        <div className="h-80 animate-pulse rounded-2xl border border-neutral-800 bg-neutral-900" />
      </main>
    );
  }

  if (variant === "form") {
    return (
      <main className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6">
        <div className="mb-6 space-y-2">
          <div className="h-4 w-32 animate-pulse rounded bg-neutral-800" />
          <div className="h-8 w-48 animate-pulse rounded bg-neutral-800" />
        </div>
        <div className="h-[28rem] animate-pulse rounded-2xl border border-neutral-800 bg-neutral-900" />
      </main>
    );
  }

  if (variant === "detail") {
    return (
      <main className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6">
        <div className="mb-6 space-y-2">
          <div className="h-4 w-28 animate-pulse rounded bg-neutral-800" />
          <div className="h-8 w-56 animate-pulse rounded bg-neutral-800" />
        </div>
        <div className="space-y-4">
          <div className="h-28 animate-pulse rounded-2xl bg-neutral-900" />
          <div className="h-40 animate-pulse rounded-2xl bg-neutral-900" />
          <div className="h-56 animate-pulse rounded-2xl bg-neutral-900" />
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-12 sm:px-6">
      <div className="h-9 w-56 animate-pulse rounded bg-neutral-800" />
      <div className="h-4 w-80 animate-pulse rounded bg-neutral-800" />
      <div className="grid gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div
            key={index}
            className="h-28 animate-pulse rounded-2xl border border-neutral-800 bg-neutral-900"
          />
        ))}
      </div>
    </main>
  );
}
