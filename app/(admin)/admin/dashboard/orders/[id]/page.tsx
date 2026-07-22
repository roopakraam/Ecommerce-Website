import { redirect } from "next/navigation";

interface LegacyOrderDetailPageProps {
  params: { id: string };
}

export default function LegacyAdminOrderDetailPage({
  params,
}: LegacyOrderDetailPageProps) {
  redirect(`/admin/orders/${params.id}`);
}
