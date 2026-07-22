import { AdminLoginForm } from "@/components/admin/admin-login-form";
import { safeNextPath } from "@/lib/utils/safe-next-path";

interface AdminLoginPageProps {
  searchParams: {
    next?: string;
  };
}

export default function AdminLoginPage({ searchParams }: AdminLoginPageProps) {
  const nextPath = safeNextPath(searchParams.next, "/admin/dashboard");
  return <AdminLoginForm nextPath={nextPath} />;
}
