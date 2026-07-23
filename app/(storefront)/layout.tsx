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
    <div className="min-h-screen bg-ink text-bone">
      <StorefrontHeader />
      {children}
      <StorefrontFooter />
    </div>
  );
}
