"use client";

import { AdminRouteError } from "@/components/admin/route-error";

export default function ProductsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <AdminRouteError error={error} reset={reset} title="Products failed" />;
}
