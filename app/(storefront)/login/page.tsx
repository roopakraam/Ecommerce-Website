import { CustomerAuthForm } from "@/components/storefront/customer-auth-form";
import { PageHero } from "@/components/storefront/page-hero";
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
    <main>
      <PageHero
        eyebrow="Account"
        title="Sign in"
        description="Sign in to BOOK MY TEES to shop and check out faster."
        containerClassName="max-w-md"
      />
      <div className="mx-auto flex max-w-md flex-col px-4 py-12 sm:px-6 sm:py-16">
        <CustomerAuthForm mode="login" nextPath={nextPath} />
      </div>
    </main>
  );
}
