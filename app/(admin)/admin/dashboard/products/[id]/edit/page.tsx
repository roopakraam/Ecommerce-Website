import { redirect } from "next/navigation";

interface LegacyEditProductPageProps {
  params: { id: string };
}

export default function LegacyEditProductPage({
  params,
}: LegacyEditProductPageProps) {
  redirect(`/admin/products/${params.id}/edit`);
}
