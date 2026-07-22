import Link from "next/link";
import { ADMIN_CUSTOMERS_PATH } from "@/lib/admin/customers";

export default function CustomerNotFound() {
  return (
    <main className="mx-auto flex max-w-lg flex-col items-center px-4 py-20 text-center">
      <h1 className="text-2xl font-bold text-foreground">Customer not found</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        This customer may have been removed or the link is invalid.
      </p>
      <Link
        href={ADMIN_CUSTOMERS_PATH}
        className="mt-6 text-sm font-semibold text-primary hover:underline"
      >
        Back to customers
      </Link>
    </main>
  );
}
