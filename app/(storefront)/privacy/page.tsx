import {
  LegalDocument,
  LegalList,
  LegalSection,
} from "@/components/storefront/legal-document";
import { buildPageMetadata } from "@/lib/seo/site";

export const metadata = buildPageMetadata({
  title: "Privacy Policy",
  description:
    "How BOOK MY TEES collects, uses, and protects your personal information when you shop with us across India.",
  path: "/privacy",
});

const LAST_UPDATED = "22 July 2026";

export default function PrivacyPage() {
  return (
    <LegalDocument title="Privacy Policy" lastUpdated={LAST_UPDATED}>
      <p>
        BOOK MY TEES (&quot;we&quot;, &quot;us&quot;, or &quot;our&quot;)
        operates an online store selling apparel and related products across
        India. This Privacy Policy explains what personal information we collect
        when you use our website, how we use it, and the choices available to
        you. By placing an order or creating an account, you agree to the
        practices described here.
      </p>

      <LegalSection title="1. Information we collect">
        <p>We may collect the following information:</p>
        <LegalList
          items={[
            "Account details such as your name, email address, and password when you register.",
            "Order and checkout details including shipping address, phone number, email, and order history.",
            "Payment-related metadata processed by our payment partner Razorpay (we do not store your full card, UPI, or net-banking credentials on our servers).",
            "Device and usage information such as browser type, approximate location derived from IP address, and pages visited, used to operate and improve the site.",
            "Communications you send us (for example support requests or returns).",
          ]}
        />
      </LegalSection>

      <LegalSection title="2. How we use your information">
        <p>We use personal information to:</p>
        <LegalList
          items={[
            "Process, fulfil, and deliver your orders across India.",
            "Send order confirmations, shipping updates, and transactional messages by email and/or WhatsApp where you have provided contact details.",
            "Provide customer support, handle returns, exchanges, and refunds.",
            "Prevent fraud, secure our platform, and comply with applicable Indian law.",
            "Improve our products, website experience, and operations (including analytics in aggregated or de-identified form where practical).",
          ]}
        />
        <p>
          We do not sell your personal information to third parties for their
          marketing.
        </p>
      </LegalSection>

      <LegalSection title="3. Payment processing">
        <p>
          Payments are processed securely by Razorpay. When you pay, you may be
          redirected to or interact with Razorpay&apos;s checkout. Razorpay
          collects and processes payment credentials under its own privacy
          policy. We receive confirmation of payment status, transaction
          identifiers, and limited details needed to reconcile your order. Cash
          on delivery (COD) is not offered.
        </p>
      </LegalSection>

      <LegalSection title="4. Sharing with service providers">
        <p>
          We share information only as needed to run the store, including with:
        </p>
        <LegalList
          items={[
            "Payment processors (Razorpay) to complete transactions.",
            "Hosting, database, and infrastructure providers that power this website.",
            "Logistics and courier partners to ship orders to your address.",
            "Email or messaging providers used to send transactional notifications.",
            "Authorities when required by law or to protect our legal rights.",
          ]}
        />
      </LegalSection>

      <LegalSection title="5. Cookies and similar technologies">
        <p>
          We use cookies and similar technologies for essential site functions
          (such as keeping you signed in and remembering your cart), security,
          and basic analytics. You can control cookies through your browser
          settings; disabling essential cookies may limit checkout or account
          features.
        </p>
      </LegalSection>

      <LegalSection title="6. Data retention">
        <p>
          We retain order and account records for as long as needed to fulfil
          orders, handle disputes, meet legal and accounting obligations, and
          operate the business. When information is no longer required, we take
          reasonable steps to delete or anonymise it.
        </p>
      </LegalSection>

      <LegalSection title="7. Security">
        <p>
          We use industry-standard safeguards appropriate to an online store,
          including encrypted connections (HTTPS) and restricted access to
          systems that hold customer data. No method of transmission or storage
          is completely secure; please use a strong, unique password for your
          account.
        </p>
      </LegalSection>

      <LegalSection title="8. Your rights">
        <p>
          Subject to applicable law in India, you may request access to,
          correction of, or deletion of certain personal information we hold
          about you, or ask questions about how it is used. To make a request,
          contact us using the support email or phone listed in your order
          confirmation or on this website. We may need to verify your identity
          before responding.
        </p>
      </LegalSection>

      <LegalSection title="9. Children">
        <p>
          Our store is intended for purchase by adults. We do not knowingly
          collect personal information from children under 18. If you believe a
          minor has provided us information, please contact us so we can delete
          it.
        </p>
      </LegalSection>

      <LegalSection title="10. Changes to this policy">
        <p>
          We may update this Privacy Policy from time to time. The
          &quot;Last updated&quot; date at the top of this page will change when
          we do. Continued use of the site after an update constitutes
          acceptance of the revised policy.
        </p>
      </LegalSection>

      <LegalSection title="11. Contact">
        <p>
          For privacy-related questions, contact BOOK MY TEES using the support
          details shown at checkout, in your order confirmation messages, or
          elsewhere on this website.
        </p>
      </LegalSection>
    </LegalDocument>
  );
}
