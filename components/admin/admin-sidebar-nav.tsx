"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ADMIN_NAV_ITEMS, isAdminNavActive } from "@/lib/admin/nav";
import { cn } from "@/lib/utils/cn";
import { Separator } from "@/components/ui/separator";

interface AdminSidebarNavProps {
  onNavigate?: () => void;
  className?: string;
}

export function AdminSidebarNav({
  onNavigate,
  className,
}: AdminSidebarNavProps) {
  const pathname = usePathname();

  return (
    <nav className={cn("flex flex-col gap-1 px-3", className)}>
      {ADMIN_NAV_ITEMS.map((item) => {
        const Icon = item.icon;
        const active = isAdminNavActive(pathname, item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-primary/15 text-primary"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {item.title}
          </Link>
        );
      })}
      <Separator className="my-3" />
      <Link
        href="/"
        onClick={onNavigate}
        className="rounded-md px-3 py-2 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
      >
        View storefront
      </Link>
    </nav>
  );
}
