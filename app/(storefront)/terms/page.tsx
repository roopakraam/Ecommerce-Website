import Link from "next/link";
import {
  LegalDocument,
  LegalList,
  LegalSection,
} from "@/components/storefront/legal-document";
import { buildPageMetadata } from "@/lib/seo/site";

export const metadata = buildPageMetadata({
  title: "Terms of Service",
  description:
    "Terms governing your use of the BOOK MY TEES online store, orders, payments, and delivery across India.",
  path: "/terms",
});

const LAST_UPDATED = "22 July 2026";

export default function TermsPage() {
  return (
    <LegalDocument title="Terms of Service" lastUpdated={LAST_UPDATED}>
      <p>
        These Terms of Service (&quot;Terms&quot;) govern your access to and use
        of the BOOK MY TEES website and online store. By browsing, creating an
        account, or placing an order, you agree to these Terms. If you do not
        agree, please do not use the site.
      </p>

      <LegalSection title="1. About us">
        <p>
          BOOK MY TEES sells apparel (including t-shirts and related products)
          online and ships across India. Product descriptions, images, and
          prices shown on the site are offers to sell subject to availability
          and these Terms.
        </p>
      </LegalSection>

      <LegalSection title="2. Eligibility">
        <p>
          You must be at least 18 years old and capable of entering a binding
          contract under Indian law to place an order. By ordering, you
          represent that the information you provide is accurate and complete.
        </p>
      </LegalSection>

      <LegalSection title="3. Accounts">
        <p>
          You may shop as a guest or create an account. You are responsible for
          keeping your login credentials confidential and for all activity under
          your account. Notify us promptly if you suspect unauthorised use.
        </p>
      </LegalSection>

      <LegalSection title="4. Products and pricing">
        <LegalList
          items={[
            "We aim to display products accurately; colours and fit may vary slightly due to screen settings and manufacturing tolerances.",
            "Prices are shown in Indian Rupees (INR) unless stated otherwise.",
            "BOOK MY TEES is not GST-registered at this time. Prices displayed are the amounts payable for the product and any applicable shipping; we do not issue GST tax invoices.",
            "We may correct pricing or description errors and cancel orders affected by such errors, with a full refund of any amount already paid.",
            "Stock is limited. An order is confirmed only after successful payment and inventory confirmation.",
          ]}
        />
      </LegalSection>

      <LegalSection title="5. Orders">
        <p>
          Placing an order constitutes an offer to purchase. We reserve the
          right to refuse or cancel an order (for example due to stock issues,
          suspected fraud, pricing errors, or inability to ship to the address
          provided). If we cancel after payment, we will refund the amount paid
          for the cancelled items through the original payment method where
          possible.
        </p>
      </LegalSection>

      <LegalSection title="6. Payments">
        <LegalList
          items={[
            "All orders must be paid in full at checkout via Razorpay (cards, UPI, net banking, and other methods Razorpay makes available).",
            "Cash on delivery (COD) is not available.",
            "Orders remain pending until payment is successfully completed. Unpaid or abandoned checkouts may be cancelled and reserved stock released.",
            "You authorise Razorpay and your payment provider to charge the selected payment method for the order total, including shipping.",
          ]}
        />
      </LegalSection>

      <LegalSection title="7. Shipping and delivery">
        <LegalList
          items={[
            "We ship across India to addresses you provide at checkout.",
            "Shipping charges and estimated delivery windows (when shown) are calculated based on your location and our shipping settings; they are estimates, not guarantees.",
            "Risk of loss passes to you upon delivery to the address you specified, or when the courier records delivery according to their practices.",
            "You are responsible for providing a complete and reachable address and phone number. Failed delivery due to incorrect details may incur additional charges or require repurchase.",
          ]}
        />
      </LegalSection>

      <LegalSection title="8. Returns, exchanges, and refunds">
        <p>
          Returns, exchanges, and refunds are governed by our{" "}
          <Link
            href="/refund"
            className="font-medium text-bone underline underline-offset-2 hover:text-neon"
          >
            Return &amp; Refund Policy
          </Link>
          , which forms part of these Terms.
        </p>
      </LegalSection>

      <LegalSection title="9. Intellectual property">
        <p>
          All content on this site—including logos, graphics, product designs,
          text, and software—is owned by BOOK MY TEES or its licensors and is
          protected by applicable intellectual property laws. You may not copy,
          modify, or commercially exploit our content without prior written
          permission.
        </p>
      </LegalSection>

      <LegalSection title="10. Acceptable use">
        <p>You agree not to:</p>
        <LegalList
          items={[
            "Use the site for any unlawful purpose or in violation of these Terms.",
            "Attempt to gain unauthorised access to our systems, accounts, or data.",
            "Interfere with the site's operation, security, or other users' experience.",
            "Use automated means to scrape, harvest, or overload the site without our consent.",
          ]}
        />
      </LegalSection>

      <LegalSection title="11. Disclaimer and limitation of liability">
        <p>
          The site and products are provided on an &quot;as available&quot;
          basis. To the fullest extent permitted by Indian law, BOOK MY TEES is
          not liable for indirect, incidental, or consequential damages arising
          from your use of the site or products. Our total liability for any
          claim related to an order is limited to the amount you paid for that
          order. Nothing in these Terms excludes liability that cannot be
          limited under applicable law (including for proven product defects
          causing personal injury where such liability cannot be waived).
        </p>
      </LegalSection>

      <LegalSection title="12. Governing law">
        <p>
          These Terms are governed by the laws of India. Courts in India shall
          have exclusive jurisdiction over disputes arising from these Terms or
          your use of the store, subject to any mandatory consumer protection
          rights that apply to you.
        </p>
      </LegalSection>

      <LegalSection title="13. Changes">
        <p>
          We may update these Terms from time to time. The &quot;Last
          updated&quot; date will reflect changes. Continued use of the site
          after updates means you accept the revised Terms.
        </p>
      </LegalSection>

      <LegalSection title="14. Contact">
        <p>
          For questions about these Terms, contact BOOK MY TEES using the
          support details shown at checkout, in your order confirmation
          messages, or elsewhere on this website. See also our{" "}
          <Link
            href="/privacy"
            className="font-medium text-bone underline underline-offset-2 hover:text-neon"
          >
            Privacy Policy
          </Link>
          .
        </p>
      </LegalSection>
    </LegalDocument>
  );
}
