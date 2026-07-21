import {
  StorefrontFooter,
  StorefrontHeader,
} from "@/components/storefront/storefront-shell";

export default function StorefrontLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <StorefrontHeader />
      {children}
      <StorefrontFooter />
    </>
  );
}
