import Link from 'next/link';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-sm p-8">
          <div className="mb-8">
            <Link href="/" className="text-blue-900 hover:text-blue-800 font-medium">
              ← Back to Home
            </Link>
          </div>

          <h1 className="text-4xl font-bold text-gray-900 mb-8">Terms and Conditions</h1>

          <div className="prose prose-blue max-w-none">
            <p className="text-sm text-gray-600 mb-8">Last Updated: January 1, 2025</p>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Introduction</h2>
              <p className="text-gray-700 mb-4">
                Welcome to Sterling Capital Bank. These Terms and Conditions govern your use of our banking services,
                website, and mobile applications. By accessing or using our services, you agree to be bound by these terms.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Account Services</h2>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">2.1 Account Opening</h3>
              <p className="text-gray-700 mb-4">
                To open an account with Sterling Capital Bank, you must:
              </p>
              <ul className="list-disc pl-6 mb-4 text-gray-700">
                <li>Be at least 18 years of age</li>
                <li>Provide accurate and complete information</li>
                <li>Maintain updated contact information</li>
                <li>Comply with all applicable laws and regulations</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">2.2 Account Security</h3>
              <p className="text-gray-700 mb-4">
                You are responsible for maintaining the confidentiality of your account credentials, including
                passwords and transaction PINs. You must notify us immediately of any unauthorized access or security breach.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Banking Services</h2>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">3.1 Deposits</h3>
              <p className="text-gray-700 mb-4">
                All deposits are subject to verification and may be held for processing. Funds availability may vary
                based on deposit method and amount.
              </p>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">3.2 Transfers</h3>
              <p className="text-gray-700 mb-4">
                Money transfers require sufficient available balance and valid transaction PIN verification.
                Transfer limits may apply based on your account type.
              </p>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">3.3 Loans</h3>
              <p className="text-gray-700 mb-4">
                Loan applications are subject to credit approval. Interest rates, terms, and conditions vary based
                on creditworthiness and loan type. Late payments may result in additional fees and impact your credit score.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Fees and Charges</h2>
              <p className="text-gray-700 mb-4">
                Sterling Capital Bank may charge fees for certain services, including but not limited to:
              </p>
              <ul className="list-disc pl-6 mb-4 text-gray-700">
                <li>Monthly maintenance fees</li>
                <li>Overdraft fees</li>
                <li>Wire transfer fees</li>
                <li>ATM fees for non-network transactions</li>
                <li>Late payment fees on loans</li>
              </ul>
              <p className="text-gray-700 mb-4">
                Current fee schedules are available upon request and may be updated with prior notice.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Transaction PIN</h2>
              <p className="text-gray-700 mb-4">
                A 4-digit transaction PIN is required for all financial operations including deposits, transfers,
                loans, and repayments. Your PIN:
              </p>
              <ul className="list-disc pl-6 mb-4 text-gray-700">
                <li>Must be set during account creation</li>
                <li>Cannot be changed once set</li>
                <li>Should never be shared with anyone</li>
                <li>Is required for account security and fraud prevention</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Privacy and Data Protection</h2>
              <p className="text-gray-700 mb-4">
                We are committed to protecting your personal information. Your data will be:
              </p>
              <ul className="list-disc pl-6 mb-4 text-gray-700">
                <li>Kept confidential and secure</li>
                <li>Used only for banking purposes</li>
                <li>Not shared with third parties without consent, except as required by law</li>
                <li>Protected with industry-standard encryption</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Liability and Disclaimers</h2>
              <p className="text-gray-700 mb-4">
                Sterling Capital Bank is not liable for:
              </p>
              <ul className="list-disc pl-6 mb-4 text-gray-700">
                <li>Losses resulting from unauthorized access due to user negligence</li>
                <li>Service interruptions due to system maintenance or technical issues</li>
                <li>Third-party payment processor delays</li>
                <li>Investment losses or market fluctuations</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Account Termination</h2>
              <p className="text-gray-700 mb-4">
                We reserve the right to suspend or terminate your account if:
              </p>
              <ul className="list-disc pl-6 mb-4 text-gray-700">
                <li>You violate these Terms and Conditions</li>
                <li>Fraudulent activity is detected</li>
                <li>Your account remains inactive for an extended period</li>
                <li>Required by law or regulatory authorities</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Modifications</h2>
              <p className="text-gray-700 mb-4">
                Sterling Capital Bank reserves the right to modify these Terms and Conditions at any time.
                Changes will be effective upon posting to our website. Continued use of our services constitutes
                acceptance of modified terms.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Governing Law</h2>
              <p className="text-gray-700 mb-4">
                These Terms and Conditions are governed by and construed in accordance with the laws of the
                United States. Any disputes shall be resolved in the courts of New York, USA.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">11. Contact Information</h2>
              <p className="text-gray-700 mb-4">
                For questions about these Terms and Conditions, please contact us:
              </p>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-gray-700"><strong>Email:</strong> legal@sterlingcapitalbank.com</p>
                <p className="text-gray-700"><strong>Phone:</strong> +1 (800) 123-4567</p>
                <p className="text-gray-700"><strong>Address:</strong> Sterling Capital Bank HQ, New York, USA</p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">12. FDIC Insurance</h2>
              <p className="text-gray-700 mb-4">
                Your deposits with Sterling Capital Bank are insured by the Federal Deposit Insurance Corporation
                (FDIC) up to the maximum amount permitted by law.
              </p>
            </section>
          </div>

          <div className="mt-12 pt-8 border-t border-gray-200">
            <p className="text-sm text-gray-600">
              By using Sterling Capital Bank services, you acknowledge that you have read, understood, and agree
              to be bound by these Terms and Conditions.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
