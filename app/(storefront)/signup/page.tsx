import { CustomerAuthForm } from "@/components/storefront/customer-auth-form";
import { buildPageMetadata } from "@/lib/seo/site";
import { safeNextPath } from "@/lib/utils/safe-next-path";

export const metadata = buildPageMetadata({
  title: "Create account",
  description: "Create a BOOK MY TEES account to shop and checkout.",
  path: "/signup",
  noIndex: true,
});

interface SignupPageProps {
  searchParams: {
    next?: string;
  };
}

export default function SignupPage({ searchParams }: SignupPageProps) {
  const nextPath = safeNextPath(searchParams.next, "/products");

  return (
    <main className="mx-auto flex max-w-md flex-col px-4 py-12 sm:px-6 sm:py-16">
      <CustomerAuthForm mode="signup" nextPath={nextPath} />
    </main>
  );
}
