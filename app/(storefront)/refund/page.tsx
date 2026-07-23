import Link from "next/link";
import {
  LegalDocument,
  LegalList,
  LegalSection,
} from "@/components/storefront/legal-document";
import { buildPageMetadata } from "@/lib/seo/site";

export const metadata = buildPageMetadata({
  title: "Return & Refund Policy",
  description:
    "BOOK MY TEES return, exchange, and refund policy for prepaid orders shipped across India.",
  path: "/refund",
});

const LAST_UPDATED = "22 July 2026";

export default function RefundPage() {
  return (
    <LegalDocument
      title="Return & Refund Policy"
      lastUpdated={LAST_UPDATED}
    >
      <p>
        This Return &amp; Refund Policy explains how returns, exchanges, and
        refunds work for orders placed on BOOK MY TEES. We ship across India.
        All purchases are prepaid through Razorpay; cash on delivery (COD) is
        not available. Please read this policy before ordering.
      </p>

      <LegalSection title="1. Eligibility for returns and exchanges">
        <p>
          You may request a return or size/colour exchange within{" "}
          <strong className="font-semibold text-bone">7 days</strong> of
          delivery for unused items that meet all of the following:
        </p>
        <LegalList
          items={[
            "The product is unused, unwashed, and free of stains, odour, or damage.",
            "Original tags and packaging are intact where applicable.",
            "You can provide proof of purchase (order ID / confirmation email).",
            "The item is not marked as final sale, clearance, or non-returnable on the product page.",
          ]}
        />
        <p>
          Personalised, custom-printed, or made-to-order items (if offered) are
          generally non-returnable unless they arrive damaged or incorrect.
        </p>
      </LegalSection>

      <LegalSection title="2. What we do not accept">
        <LegalList
          items={[
            "Items returned after the 7-day window without our prior written approval.",
            "Worn, washed, altered, or damaged products (except manufacturing defects reported promptly).",
            "Returns without order details or from someone other than the original purchaser without authorisation.",
            "Change-of-mind returns for items excluded as non-returnable at purchase.",
          ]}
        />
      </LegalSection>

      <LegalSection title="3. Damaged, defective, or wrong items">
        <p>
          If you receive a damaged, defective, or incorrect product, contact us
          within{" "}
          <strong className="font-semibold text-bone">48 hours</strong>{" "}
          of delivery with your order ID and clear photos of the issue and
          packaging. We will arrange a replacement or refund at our discretion
          after verifying the claim. Shipping charges for approved defect or
          wrong-item cases are typically covered by us.
        </p>
      </LegalSection>

      <LegalSection title="4. How to initiate a return or exchange">
        <LegalList
          items={[
            "Contact us using the support email or phone in your order confirmation (or listed on this website).",
            "Share your order ID, product name/size/colour, and reason for return or exchange.",
            "Wait for our approval and return instructions before shipping anything back. Unapproved returns may be refused.",
            "Pack the item securely and ship it to the address we provide. Keep the courier receipt until the return is processed.",
          ]}
        />
        <p>
          Unless we agree otherwise (for example approved defect cases), return
          shipping costs for change-of-mind or size exchanges are borne by you.
        </p>
      </LegalSection>

      <LegalSection title="5. Exchanges">
        <p>
          Exchanges are subject to available stock in the requested size or
          colour. If the preferred variant is unavailable, we may offer a store
          credit, alternative product, or refund of the product amount as
          agreed with you.
        </p>
      </LegalSection>

      <LegalSection title="6. Refunds">
        <LegalList
          items={[
            "Approved refunds are issued to the original payment method via Razorpay / your bank or UPI app.",
            "Product price is refunded for approved returns. Original shipping fees are refundable only if the return is due to our error (wrong, damaged, or defective item) or if we cancel your order.",
            "Refund processing typically begins within 5–7 business days after we receive and inspect the returned item. Banks and UPI providers may take additional time to reflect the credit.",
            "Because we are not GST-registered, refunds relate to the amounts you paid on the order; no separate GST tax credit note is issued.",
          ]}
        />
      </LegalSection>

      <LegalSection title="7. Cancellations">
        <p>
          You may request cancellation before the order is shipped. Once
          shipped, the order follows the return process above. We may cancel
          unpaid, failed, or suspected fraudulent orders; any amount captured in
          error will be refunded through the payment gateway where applicable.
        </p>
      </LegalSection>

      <LegalSection title="8. Non-delivery and courier issues">
        <p>
          If a shipment is marked delivered but you did not receive it, contact
          us within 48 hours so we can raise a claim with the courier. We may
          require an FIR or courier investigation for lost parcels. Resolution
          (reshipment or refund) depends on the investigation outcome.
        </p>
      </LegalSection>

      <LegalSection title="9. Consumer rights">
        <p>
          Nothing in this policy limits your statutory rights under applicable
          Indian consumer protection laws for defective goods. Where those laws
          provide stronger protections, those protections prevail.
        </p>
      </LegalSection>

      <LegalSection title="10. Contact">
        <p>
          For returns, exchanges, or refund questions, contact BOOK MY TEES
          using the support details in your order confirmation or on this
          website. Related policies:{" "}
          <Link
            href="/terms"
            className="font-medium text-bone underline underline-offset-2 hover:text-neon"
          >
            Terms of Service
          </Link>{" "}
          and{" "}
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
