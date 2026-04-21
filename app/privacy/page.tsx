import Link from "next/link";

export const metadata = {
  title: "Privacy Policy | ProspectVision",
  description: "How ProspectVision collects, uses, and protects data.",
};

export default function PrivacyPolicyPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <Link href="/" className="text-sm text-slate-500 hover:text-slate-900">
        ← Back to home
      </Link>
      <h1 className="mt-4 font-display text-4xl font-bold text-slate-900">Privacy Policy</h1>
      <p className="mt-2 text-sm text-slate-500">Last updated: April 21, 2026</p>

      <div className="prose prose-slate mt-10 max-w-none text-sm leading-relaxed text-slate-700">
        <h2>1. Data we collect</h2>
        <p>
          <strong>From contractors (users):</strong> email address, name, company name,
          phone, website, mailing/return address, service-area ZIP codes, niche selection,
          billing records, and activity within the platform.
        </p>
        <p>
          <strong>About properties:</strong> address, owner name(s), build year, lot size,
          estimated value, satellite and street-view imagery, and AI-generated scoring and
          rendering outputs. No homeowner contact information (email, phone) is collected or
          stored.
        </p>

        <h2>2. How we use it</h2>
        <p>
          Contractor data is used to operate the Service (authentication, billing,
          deliverability, support). Property data is used to generate leads for contractors
          (AI scoring, rendering, landing-page personalization) and to improve the Service in
          aggregate (benchmarking, model training on opt-in basis).
        </p>

        <h2>3. Property data source</h2>
        <p>
          <strong>
            Property information is sourced from public county assessor records via ATTOM
            Data, a licensed property-data aggregator.
          </strong>{" "}
          No private, financial, or confidential homeowner data is used. Addresses are public
          record.
        </p>

        <h2>4. Third-party processors</h2>
        <ul>
          <li><strong>ATTOM Data</strong> — property records source</li>
          <li><strong>Google Maps / Street View</strong> — satellite and streetview imagery</li>
          <li><strong>OpenAI</strong> — property scoring (GPT-4 Vision) and render generation (DALL-E)</li>
          <li><strong>Lob</strong> — postcard printing and USPS mail delivery</li>
          <li><strong>Stripe</strong> — payment processing (hosted checkout; we never see or store card numbers)</li>
          <li><strong>Supabase</strong> — application database and authentication</li>
        </ul>

        <h2>5. Data retention</h2>
        <p>
          Contractor account data is retained for the life of the account plus 24 months for
          billing and audit purposes. Property data is retained as long as it remains
          commercially relevant; opted-out addresses are retained in the suppression list
          indefinitely.
        </p>

        <h2>6. Homeowner opt-out mechanism</h2>
        <p>
          Every postcard includes a QR code linking to a landing page with a clearly visible
          opt-out button. One click permanently adds the address (in normalized form) to a
          platform-wide suppression list. All contractors&apos; future mailings skip opted-out
          addresses automatically, before any printer is contacted. Homeowners may also email{" "}
          <a href="mailto:optout@prospectvision.ai">optout@prospectvision.ai</a> with a
          property address to opt out.
        </p>

        <h2>7. California residents (CCPA/CPRA disclosure)</h2>
        <p>
          California residents have the right to know what personal information is collected,
          to request deletion, to correct inaccurate information, and to opt out of the sale
          or sharing of personal information. ProspectVision does not sell personal
          information. To exercise any right, email{" "}
          <a href="mailto:privacy@prospectvision.ai">privacy@prospectvision.ai</a>.
        </p>

        <h2>8. Security</h2>
        <p>
          Data is encrypted in transit (TLS) and at rest. Database row-level security
          restricts contractor access to their own records. Service-role keys are held on the
          server only.
        </p>

        <h2>9. Children</h2>
        <p>
          The Service is not directed to anyone under 18, and we do not knowingly collect
          information from minors.
        </p>

        <h2>10. Updates to this policy</h2>
        <p>
          We will post material changes to this policy at <code>/privacy</code> and notify
          contractors via email when practical.
        </p>

        <h2>11. Contact</h2>
        <p>
          Questions or requests:{" "}
          <a href="mailto:privacy@prospectvision.ai">privacy@prospectvision.ai</a>.
        </p>
      </div>
    </main>
  );
}
