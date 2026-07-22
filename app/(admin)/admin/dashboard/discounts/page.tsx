import { redirect } from "next/navigation";

export default function LegacyDiscountsPage() {
  redirect("/admin/discounts");
}
