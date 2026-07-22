import { CustomerAuthForm } from "@/components/storefront/customer-auth-form";
import { buildPageMetadata } from "@/lib/seo/site";
import { safeNextPath } from "@/lib/utils/safe-next-path";

export const metadata = buildPageMetadata({
  title: "Sign in",
  description: "Sign in to BOOK MY TEES to shop and checkout.",
  path: "/login",
  noIndex: true,
});

interface LoginPageProps {
  searchParams: {
    next?: string;
  };
}

export default function LoginPage({ searchParams }: LoginPageProps) {
  const nextPath = safeNextPath(searchParams.next, "/products");

  return (
    <main className="mx-auto flex max-w-md flex-col px-4 py-12 sm:px-6 sm:py-16">
      <CustomerAuthForm mode="login" nextPath={nextPath} />
    </main>
  );
}
