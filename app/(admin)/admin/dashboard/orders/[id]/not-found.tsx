import Link from "next/link";

export default function AdminOrderNotFound() {
  return (
    <main className="mx-auto flex max-w-2xl flex-col items-center px-4 py-20 text-center sm:px-6">
      <h1 className="text-2xl font-bold text-white">Order not found</h1>
      <p className="mt-3 max-w-md text-sm text-neutral-400">
        This order does not exist or you do not have access to view it.
      </p>
      <Link
        href="/admin/dashboard/orders"
        className="mt-8 rounded-full bg-lime-400 px-6 py-3 text-sm font-semibold text-neutral-950 hover:bg-lime-300"
      >
        Back to orders
      </Link>
    </main>
  );
}
