import Link from "next/link";

export default function OrderNotFound() {
  return (
    <main className="mx-auto flex max-w-2xl flex-col items-center px-4 py-20 text-center sm:px-6">
      <h1 className="text-2xl font-black uppercase tracking-tight text-bone">Order not found</h1>
      <p className="mt-3 max-w-md text-sm text-dust">
        We couldn&apos;t find this order. Double-check the link or contact
        support if this keeps happening.
      </p>
      <Link
        href="/products"
        className="mt-8 rounded-full bg-neon px-6 py-3 text-sm font-bold uppercase tracking-wide text-ink hover:bg-bone"
      >
        Back to shop
      </Link>
    </main>
  );
}
