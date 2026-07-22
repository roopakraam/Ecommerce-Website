import Link from "next/link";
import { AuthMenu } from "@/components/storefront/auth-menu";
import { CartButton } from "@/components/storefront/cart-button";
import { CartDrawer } from "@/components/storefront/cart-drawer";

export function StorefrontHeader() {
  return (
    <>
      <header className="sticky top-0 z-50 border-b border-neutral-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <Link
            href="/"
            className="text-lg font-bold tracking-tight text-neutral-950 sm:text-xl"
          >
            BOOK MY <span className="text-lime-500">TEES</span>
          </Link>
          <nav className="flex items-center gap-3 text-sm font-medium text-neutral-600 sm:gap-4">
            <Link href="/products" className="hover:text-neutral-950">
              Shop
            </Link>
            <CartButton />
            <AuthMenu />
          </nav>
        </div>
      </header>
      <CartDrawer />
    </>
  );
}

export function StorefrontFooter() {
  return (
    <footer className="border-t border-neutral-200 bg-neutral-950 text-neutral-400">
      <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-10 sm:px-6 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm">
          © {new Date().getFullYear()} BOOK MY TEES. All rights reserved.
        </p>
        <p className="text-sm">Pan-India delivery · Premium cotton tees</p>
      </div>
    </footer>
  );
}
