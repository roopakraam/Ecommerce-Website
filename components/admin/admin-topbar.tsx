"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, Search } from "lucide-react";
import { AdminAccountMenu } from "@/components/admin/admin-account-menu";
import { AdminSidebarNav } from "@/components/admin/admin-sidebar-nav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { SITE_NAME } from "@/lib/seo/site";

interface AdminTopbarProps {
  email: string;
  role: string;
}

export function AdminTopbar({ email, role }: AdminTopbarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 flex h-14 items-center gap-3 border-b border-border bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/80 sm:px-6">
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="lg:hidden">
            <Menu className="h-5 w-5" />
            <span className="sr-only">Open navigation</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-72 p-0">
          <SheetHeader className="border-b border-border px-5 py-4 text-left">
            <SheetTitle className="text-sm font-semibold tracking-tight">
              {SITE_NAME}
            </SheetTitle>
            <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              Admin
            </p>
          </SheetHeader>
          <div className="py-4">
            <AdminSidebarNav onNavigate={() => setMobileOpen(false)} />
          </div>
        </SheetContent>
      </Sheet>

      <Link
        href="/admin/dashboard"
        className="shrink-0 text-sm font-semibold tracking-tight lg:hidden"
      >
        {SITE_NAME}
      </Link>

      <form
        action="/admin/products"
        method="get"
        className="relative ml-auto hidden w-full max-w-md sm:block"
        role="search"
      >
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          name="q"
          type="search"
          placeholder="Search products…"
          className="h-9 bg-card pl-9"
          aria-label="Search products"
        />
      </form>

      <div className="ml-auto flex items-center gap-1 sm:ml-0">
        <Button
          variant="ghost"
          size="icon"
          className="sm:hidden"
          asChild
        >
          <Link href="/admin/products">
            <Search className="h-4 w-4" />
            <span className="sr-only">Search products</span>
          </Link>
        </Button>
        <AdminAccountMenu email={email} role={role} />
      </div>
    </header>
  );
}
