"use client";

import { AdminRouteError } from "@/components/admin/route-error";

export default function OrdersError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <AdminRouteError error={error} reset={reset} title="Orders failed" />;
}
