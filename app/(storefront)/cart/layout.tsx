import { buildPageMetadata } from "@/lib/seo/site";

export const metadata = buildPageMetadata({
  title: "Your Cart",
  description:
    "Review your BOOK MY TEES cart, update quantities, and proceed to secure checkout.",
  path: "/cart",
  noIndex: true,
});

export default function CartLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
