import { redirect } from "next/navigation";

interface LegacyCustomersPageProps {
  searchParams: Record<string, string | string[] | undefined>;
}

export default function LegacyAdminCustomersPage({
  searchParams,
}: LegacyCustomersPageProps) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(searchParams)) {
    if (typeof value === "string") {
      params.set(key, value);
    } else if (Array.isArray(value) && value[0]) {
      params.set(key, value[0]);
    }
  }
  const qs = params.toString();
  redirect(qs ? `/admin/customers?${qs}` : "/admin/customers");
}
