import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { AdminTopbar } from "@/components/admin/admin-topbar";

interface AdminShellProps {
  email: string;
  role: string;
  children: React.ReactNode;
}

export function AdminShell({ email, role, children }: AdminShellProps) {
  return (
    <div className="flex min-h-screen bg-background text-foreground print:block print:bg-white print:text-black">
      <div className="print:hidden">
        <AdminSidebar />
      </div>
      <div className="flex min-w-0 flex-1 flex-col print:block">
        <div className="print:hidden">
          <AdminTopbar email={email} role={role} />
        </div>
        <div className="flex-1 overflow-y-auto print:overflow-visible">
          {children}
        </div>
      </div>
    </div>
  );
}
