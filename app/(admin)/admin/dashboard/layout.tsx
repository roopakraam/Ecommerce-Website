import { redirect } from "next/navigation";
import { AdminShell } from "@/components/admin/admin-shell";
import { createServerClient } from "@/lib/supabase/server";

export default async function AdminDashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/admin/login");
  }

  const { data: adminUser } = await supabase
    .from("admin_users")
    .select("role")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  if (!adminUser) {
    redirect("/admin/login");
  }

  return (
    <AdminShell email={user.email ?? "admin"} role={adminUser.role}>
      {children}
    </AdminShell>
  );
}
