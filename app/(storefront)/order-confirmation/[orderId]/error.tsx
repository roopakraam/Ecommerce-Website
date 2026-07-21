"use client";

import { StorefrontRouteError } from "@/components/storefront/route-error";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <StorefrontRouteError
      error={error}
      reset={reset}
      title="Couldn't load this order"
    />
  );
}
