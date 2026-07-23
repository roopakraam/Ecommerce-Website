import { Mail, Phone, Clock } from "lucide-react";
import { PageHero } from "@/components/storefront/page-hero";
import { ContactForm } from "@/components/storefront/contact-form";
import { getPublicStoreCommerceSettings } from "@/lib/db/store-settings";
import { buildPageMetadata } from "@/lib/seo/site";

export const metadata = buildPageMetadata({
  title: "Contact Us",
  description:
    "Get in touch with BOOK MY TEES for order help, sizing questions, or general enquiries.",
  path: "/contact",
});

export default async function ContactPage() {
  const settings = await getPublicStoreCommerceSettings();
  const supportEmail = settings.supportEmail || "support@bookmytees.com";
  const supportPhone = settings.supportPhone;

  return (
    <main>
      <PageHero
        eyebrow="Get in touch"
        title="Contact us"
        description="Questions about an order, sizing, or a bulk enquiry? Send us a message and our team will get back to you."
      />

      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
        <div className="grid gap-10 lg:grid-cols-[1fr_1.3fr] lg:gap-14">
          <div className="flex flex-col gap-5">
            <ContactInfoCard
              icon={<Mail className="h-5 w-5 text-neon" />}
              label="Email"
              value={supportEmail}
              href={`mailto:${supportEmail}`}
            />
            {supportPhone && (
              <ContactInfoCard
                icon={<Phone className="h-5 w-5 text-neon" />}
                label="Phone"
                value={supportPhone}
                href={`tel:${supportPhone}`}
              />
            )}
            <ContactInfoCard
              icon={<Clock className="h-5 w-5 text-neon" />}
              label="Response time"
              value="We usually reply within 1–2 business days."
            />
          </div>

          <ContactForm />
        </div>
      </div>
    </main>
  );
}

function ContactInfoCard({
  icon,
  label,
  value,
  href,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  href?: string;
}) {
  const content = (
    <div className="flex items-start gap-4 rounded-2xl border border-bone/10 bg-surface p-5">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface2">
        {icon}
      </div>
      <div>
        <p className="font-mono text-[11px] uppercase tracking-widest text-dust">{label}</p>
        <p className="mt-1 text-sm font-medium text-bone">{value}</p>
      </div>
    </div>
  );

  if (href) {
    return (
      <a href={href} className="transition hover:opacity-80">
        {content}
      </a>
    );
  }

  return content;
}
