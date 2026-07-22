import Link from "next/link";
import { ADMIN_ORDERS_PATH } from "@/lib/admin/orders";

export default function OrderNotFound() {
  return (
    <main className="mx-auto flex max-w-lg flex-col items-center px-4 py-20 text-center">
      <h1 className="text-2xl font-bold text-foreground">Order not found</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        This order may have been removed or the link is invalid.
      </p>
      <Link
        href={ADMIN_ORDERS_PATH}
        className="mt-6 text-sm font-semibold text-primary hover:underline"
      >
        Back to orders
      </Link>
    </main>
  );
}
