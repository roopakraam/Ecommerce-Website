interface StorefrontRouteLoadingProps {
  variant?: "default" | "grid" | "detail" | "form";
}

export function StorefrontRouteLoading({
  variant = "default",
}: StorefrontRouteLoadingProps) {
  if (variant === "grid") {
    return (
      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
        <div className="mb-8 space-y-3">
          <div className="h-3 w-24 animate-pulse rounded bg-surface" />
          <div className="h-9 w-56 animate-pulse rounded bg-surface" />
          <div className="h-4 w-full max-w-xl animate-pulse rounded bg-surface" />
        </div>
        <div className="mb-8 h-20 animate-pulse rounded-xl bg-surface" />
        <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <div
              key={index}
              className="aspect-square animate-pulse rounded-2xl bg-surface"
            />
          ))}
        </div>
      </main>
    );
  }

  if (variant === "detail") {
    return (
      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
        <div className="mb-8 h-4 w-48 animate-pulse rounded bg-surface" />
        <div className="grid gap-10 lg:grid-cols-2 lg:gap-14">
          <div className="aspect-square animate-pulse rounded-2xl bg-surface" />
          <div className="space-y-4">
            <div className="h-3 w-24 animate-pulse rounded bg-surface" />
            <div className="h-10 w-3/4 animate-pulse rounded bg-surface" />
            <div className="h-20 w-full animate-pulse rounded bg-surface" />
            <div className="h-12 w-40 animate-pulse rounded-full bg-surface" />
          </div>
        </div>
      </main>
    );
  }

  if (variant === "form") {
    return (
      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
        <div className="mb-8 space-y-3">
          <div className="h-9 w-48 animate-pulse rounded bg-surface" />
          <div className="h-4 w-72 animate-pulse rounded bg-surface" />
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="h-80 animate-pulse rounded-2xl bg-surface" />
          <div className="h-80 animate-pulse rounded-2xl bg-surface" />
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-16 sm:px-6">
      <div className="h-10 w-64 animate-pulse rounded bg-surface" />
      <div className="h-4 w-full max-w-lg animate-pulse rounded bg-surface" />
      <div className="mt-4 h-64 w-full animate-pulse rounded-2xl bg-surface" />
    </main>
  );
}
