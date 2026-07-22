import Link from "next/link";
import { AdminSidebarNav } from "@/components/admin/admin-sidebar-nav";
import { SITE_NAME } from "@/lib/seo/site";

export function AdminSidebar() {
  return (
    <aside className="hidden w-60 shrink-0 flex-col border-r border-border bg-card lg:flex">
      <div className="flex h-14 items-center border-b border-border px-5">
        <Link href="/admin/dashboard" className="min-w-0">
          <p className="truncate text-sm font-semibold tracking-tight text-foreground">
            {SITE_NAME}
          </p>
          <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            Admin
          </p>
        </Link>
      </div>
      <div className="flex-1 overflow-y-auto py-4">
        <AdminSidebarNav />
      </div>
    </aside>
  );
}
