import { redirect, notFound } from "next/navigation";
import { getOrderForPayment } from "@/lib/db/orders";

interface SuccessPageProps {
  searchParams: {
    orderId?: string;
  };
}

export default async function CheckoutSuccessPage({
  searchParams,
}: SuccessPageProps) {
  const orderId = searchParams.orderId;

  if (!orderId) {
    notFound();
  }

  const order = await getOrderForPayment(orderId);

  if (!order || order.payment_status !== "paid") {
    notFound();
  }

  redirect(`/order-confirmation/${orderId}`);
}
