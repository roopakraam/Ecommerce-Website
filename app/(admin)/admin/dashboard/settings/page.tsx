import { redirect } from "next/navigation";

interface LegacySettingsPageProps {
  searchParams: Record<string, string | string[] | undefined>;
}

export default function LegacySettingsPage({
  searchParams,
}: LegacySettingsPageProps) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(searchParams)) {
    if (typeof value === "string") params.set(key, value);
    else if (Array.isArray(value) && value[0]) params.set(key, value[0]);
  }
  const qs = params.toString();
  redirect(qs ? `/admin/settings?${qs}` : "/admin/settings");
}
