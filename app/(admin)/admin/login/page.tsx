import { AdminLoginForm } from "@/components/admin/admin-login-form";

interface AdminLoginPageProps {
  searchParams: {
    next?: string;
  };
}

export default function AdminLoginPage({ searchParams }: AdminLoginPageProps) {
  const nextPath = searchParams.next || "/admin/dashboard";
  return <AdminLoginForm nextPath={nextPath} />;
}
