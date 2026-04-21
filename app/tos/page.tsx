import Link from "next/link";

export const metadata = {
  title: "Terms of Service | ProspectVision",
  description: "Terms governing use of ProspectVision.",
};

export default function TermsOfServicePage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <Link href="/" className="text-sm text-slate-500 hover:text-slate-900">
        ← Back to home
      </Link>
      <h1 className="mt-4 font-display text-4xl font-bold text-slate-900">Terms of Service</h1>
      <p className="mt-2 text-sm text-slate-500">Last updated: April 21, 2026</p>

      <div className="prose prose-slate mt-10 max-w-none text-sm leading-relaxed text-slate-700">
        <h2>1. Acceptance of Terms</h2>
        <p>
          By creating an account or using ProspectVision (the &ldquo;Service&rdquo;), you agree
          to be bound by these Terms of Service and our Privacy Policy. If you do not agree,
          do not use the Service.
        </p>

        <h2>2. Service Description</h2>
        <p>
          ProspectVision is a software platform that helps home service contractors identify
          prospective customers and send direct-mail postcards. The Service uses AI to analyze
          publicly available property data (via ATTOM Data) and satellite imagery, generates
          AI-rendered visualizations of proposed improvements, prints and mails postcards via
          Lob, and tracks responses through an integrated CRM.
        </p>

        <h2>3. AI-Generated Content Disclosure</h2>
        <p>
          <strong>
            All &ldquo;after&rdquo; images displayed on postcards, landing pages, and in-app
            previews are AI-generated visualizations for illustration purposes only. They are
            not photographs of completed work, not architectural renderings, and do not
            represent any guarantee of actual results.
          </strong>{" "}
          Contractors may not remove or obscure the AI-generated disclosure included on
          postcards and landing pages. This disclosure is required by the FTC under its
          Endorsement and Advertising Guides.
        </p>

        <h2>4. Data Accuracy Disclaimer</h2>
        <p>
          Property data (including ownership, build year, estimated value, lot size, and
          address) is sourced from ATTOM Data, which aggregates public county assessor records.
          ProspectVision makes no warranty as to the accuracy, completeness, or timeliness of
          such data. Contractors are responsible for verifying property facts before making any
          representation or entering any contract with a homeowner.
        </p>

        <h2>5. Contractor Liability Shield</h2>
        <p>
          <strong>
            ProspectVision provides marketing tools only. Contractor is solely responsible for
            all representations, estimates, quotes, contracts, and work performed with any
            homeowner.
          </strong>{" "}
          Contractor agrees to indemnify and hold ProspectVision harmless against any claim
          arising from contractor&apos;s services or statements.
        </p>

        <h2>6. Credit and Refund Policy</h2>
        <p>
          Credits purchased on the Service are non-refundable once a postcard has been
          submitted to the printer (Lob). Credits that have not yet been used to mail a
          postcard are refundable within 30 days of purchase upon written request to our
          support email. Credits do not expire.
        </p>

        <h2>7. Direct Mail Compliance</h2>
        <p>
          All postcards include a valid USPS return address (supplied by Contractor), AI
          disclosure text, and a homeowner opt-out mechanism. Contractor represents that all
          mail sent through the Service complies with the DMA Direct Mail Association
          guidelines and applicable federal, state, and local laws. Addresses that opt out are
          added to a permanent platform-wide suppression list.
        </p>

        <h2>8. Prohibited Uses</h2>
        <p>
          You may not use the Service to send postcards: (a) to addresses on the suppression
          list; (b) for unsolicited services not matching your declared niche; (c) that
          misrepresent contractor identity, licensing, or insurance status; or (d) in violation
          of any law.
        </p>

        <h2>9. Termination</h2>
        <p>
          We may suspend or terminate your account for breach of these Terms, for fraudulent
          activity, or at the request of law enforcement. Upon termination, unused credits may
          be refunded subject to Section 6.
        </p>

        <h2>10. Dispute Resolution</h2>
        <p>
          Any dispute arising out of these Terms will first be addressed by good-faith
          negotiation. If unresolved, disputes will be submitted to binding arbitration in
          Delaware, USA, under the rules of the American Arbitration Association. You waive
          the right to participate in any class action against ProspectVision.
        </p>

        <h2>11. Limitation of Liability</h2>
        <p>
          To the fullest extent permitted by law, ProspectVision&apos;s aggregate liability
          under these Terms is limited to the amount paid by you for credits in the 12 months
          preceding the claim.
        </p>

        <h2>12. Contact</h2>
        <p>
          Questions about these Terms:{" "}
          <a href="mailto:legal@prospectvision.ai">legal@prospectvision.ai</a>.
        </p>
      </div>
    </main>
  );
}
