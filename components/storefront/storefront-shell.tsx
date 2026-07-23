import Image from "next/image";
import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { AuthMenu } from "@/components/storefront/auth-menu";
import { CartButton } from "@/components/storefront/cart-button";
import { CartDrawer } from "@/components/storefront/cart-drawer";
import { CartSyncProvider } from "@/components/storefront/cart-sync-provider";
import { AuthModal } from "@/components/storefront/auth-modal";

export function StorefrontHeader() {
  return (
    <>
      <CartSyncProvider />
      <header className="sticky top-0 z-50 w-full overflow-x-hidden border-b border-bone/10 bg-ink/95 backdrop-blur">
        <div className="mx-auto grid w-full max-w-7xl grid-cols-2 items-center gap-3 px-4 py-4 sm:px-6 lg:grid-cols-[minmax(0,30%)_minmax(0,40%)_minmax(0,30%)] lg:gap-4">
          {/* Left 30%: Logo + divider + brand */}
          <Link href="/" className="flex min-w-0 items-center gap-2 overflow-hidden lg:gap-4">
            <Image
              src="/images/logo.png"
              alt="Book My Tees logo"
              width={40}
              height={27}
              className="h-7 w-auto shrink-0 lg:h-8"
              priority
            />
            <span className="hidden h-8 w-px shrink-0 bg-bone/20 lg:block" aria-hidden="true" />
            <span className="truncate font-display text-base tracking-tight text-bone lg:text-lg">
              BOOK MY TEES
            </span>
          </Link>

          {/* Center 40%: Navigation */}
          <nav className="hidden min-w-0 items-center justify-center gap-4 overflow-hidden text-xs font-bold uppercase tracking-wide text-bone/70 lg:flex xl:gap-7 xl:tracking-widest">
            <Link href="/" className="whitespace-nowrap transition-colors hover:text-bone">
              Home
            </Link>
            <Link href="/products" className="whitespace-nowrap transition-colors hover:text-bone">
              Shop
            </Link>
            <Link href="/contact" className="whitespace-nowrap transition-colors hover:text-bone">
              Contact
            </Link>
          </nav>

          {/* Right: account, cart */}
          <div className="flex min-w-0 shrink-0 items-center justify-end gap-4 sm:gap-5">
            <AuthMenu variant="dark" />
            <CartButton variant="dark" />
          </div>
        </div>

        {/* Mobile/tablet nav */}
        <nav className="flex items-center gap-5 overflow-x-auto border-t border-bone/10 px-4 py-2.5 text-[11px] font-bold uppercase tracking-widest text-bone/70 lg:hidden">
          <Link href="/" className="whitespace-nowrap hover:text-bone">Home</Link>
          <Link href="/products" className="whitespace-nowrap hover:text-bone">Shop</Link>
          <Link href="/contact" className="whitespace-nowrap hover:text-bone">Contact</Link>
        </nav>
      </header>
      <CartDrawer />
      <AuthModal />
    </>
  );
}

export function StorefrontFooter() {
  return (
    <footer className="border-t border-bone/10 bg-ink">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
        <div className="flex flex-col gap-8 border-b border-bone/10 pb-14 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="font-display text-4xl uppercase leading-[0.9] tracking-tight text-bone sm:text-6xl">
            Ready to
            <br />
            <span className="text-neon">wear loud?</span>
          </h2>
          <Link
            href="/products"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-neon px-7 py-3.5 text-sm font-bold uppercase tracking-wide text-ink transition hover:bg-bone"
          >
            <ShoppingBag className="h-4 w-4" />
            Shop New Arrivals
          </Link>
        </div>

        <div className="grid gap-10 py-12 sm:grid-cols-[1.6fr_1fr_1fr]">
          <div>
            <div className="text-xl font-black uppercase tracking-tight text-bone">
              Book My <span className="text-neon">Tees</span>
            </div>
            <p className="mt-3 max-w-[34ch] text-sm text-dust">
              Bold graphic tees &amp; premium essentials, printed in India. Wear
              loud.
            </p>
          </div>
          <div>
            <h5 className="font-mono text-[11px] uppercase tracking-[0.16em] text-dust">
              Shop
            </h5>
            <ul className="mt-4 space-y-2.5 text-sm">
              <li>
                <Link href="/products" className="text-bone/80 transition hover:text-neon">
                  All Tees
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h5 className="font-mono text-[11px] uppercase tracking-[0.16em] text-dust">
              Legal
            </h5>
            <ul className="mt-4 space-y-2.5 text-sm">
              <li>
                <Link href="/privacy" className="text-bone/80 transition hover:text-neon">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-bone/80 transition hover:text-neon">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/refund" className="text-bone/80 transition hover:text-neon">
                  Return &amp; Refund
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <p className="border-t border-bone/10 pt-6 font-mono text-xs tracking-wide text-dust">
          © {new Date().getFullYear()} Book My Tees · Pan-India delivery · Premium cotton tees
        </p>
      </div>
    </footer>
  );
}
