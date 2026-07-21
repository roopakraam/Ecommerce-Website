import { redirect, notFound } from "next/navigation";
import { getOrderForPayment } from "@/lib/db/orders";
import { buildPageMetadata } from "@/lib/seo/site";

export const metadata = buildPageMetadata({
  title: "Payment Successful",
  description: "Your BOOK MY TEES payment was successful.",
  path: "/checkout/success",
  noIndex: true,
});

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
