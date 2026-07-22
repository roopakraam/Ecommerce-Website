"use client";

import { AdminRouteError } from "@/components/admin/route-error";

export default function CustomersError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <AdminRouteError error={error} reset={reset} title="Customers failed" />
  );
}
