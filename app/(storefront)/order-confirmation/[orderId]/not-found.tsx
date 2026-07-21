import Link from "next/link";

export default function OrderNotFound() {
  return (
    <main className="mx-auto flex max-w-2xl flex-col items-center px-4 py-20 text-center sm:px-6">
      <h1 className="text-2xl font-bold text-neutral-950">Order not found</h1>
      <p className="mt-3 max-w-md text-sm text-neutral-600">
        We couldn&apos;t find this order. Double-check the link or contact
        support if this keeps happening.
      </p>
      <Link
        href="/products"
        className="mt-8 rounded-full bg-neutral-950 px-6 py-3 text-sm font-semibold text-white hover:bg-lime-400 hover:text-neutral-950"
      >
        Back to shop
      </Link>
    </main>
  );
}
