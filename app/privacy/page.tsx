import Link from 'next/link';
import { getBankName } from '@/lib/site-settings';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export default async function PrivacyPage() {
  const bankName = await getBankName();
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-sm p-8">
          <div className="mb-8">
            <Link href="/" className="text-blue-900 hover:text-blue-800 font-medium">
              ← Back to Home
            </Link>
          </div>

          <h1 className="text-4xl font-bold text-gray-900 mb-8">Privacy Policy & Copyright</h1>

          <div className="prose prose-blue max-w-none">
            <p className="text-sm text-gray-600 mb-8">Last Updated: January 1, 2025</p>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Privacy Policy</h2>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">1. Information We Collect</h3>
              <p className="text-gray-700 mb-4">
                {bankName} collects information necessary to provide you with banking services, including:
              </p>
              <ul className="list-disc pl-6 mb-4 text-gray-700">
                <li><strong>Personal Information:</strong> Name, email address, date of birth, social security number</li>
                <li><strong>Financial Information:</strong> Account balances, transaction history, loan details</li>
                <li><strong>Contact Information:</strong> Phone number, mailing address, email address</li>
                <li><strong>Technical Information:</strong> IP address, browser type, device information, login times</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">2. How We Use Your Information</h3>
              <p className="text-gray-700 mb-4">
                We use your information to:
              </p>
              <ul className="list-disc pl-6 mb-4 text-gray-700">
                <li>Provide and maintain banking services</li>
                <li>Process transactions and prevent fraud</li>
                <li>Communicate with you about your account</li>
                <li>Comply with legal and regulatory requirements</li>
                <li>Improve our services and customer experience</li>
                <li>Send important account notifications and updates</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">3. Information Security</h3>
              <p className="text-gray-700 mb-4">
                We protect your information using:
              </p>
              <ul className="list-disc pl-6 mb-4 text-gray-700">
                <li>256-bit SSL/TLS encryption for data transmission</li>
                <li>AES-256 encryption for data storage</li>
                <li>Multi-factor authentication for account access</li>
                <li>Regular security audits and penetration testing</li>
                <li>Secure data centers with 24/7 monitoring</li>
                <li>Employee training on data protection practices</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">4. Information Sharing</h3>
              <p className="text-gray-700 mb-4">
                We do not sell your personal information. We may share your information only in the following circumstances:
              </p>
              <ul className="list-disc pl-6 mb-4 text-gray-700">
                <li><strong>Service Providers:</strong> Third-party vendors who help us operate our banking services</li>
                <li><strong>Legal Requirements:</strong> When required by law, court order, or regulatory authorities</li>
                <li><strong>Fraud Prevention:</strong> To detect, prevent, or address fraud and security issues</li>
                <li><strong>Business Transfers:</strong> In connection with a merger, acquisition, or sale of assets</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">5. Your Privacy Rights</h3>
              <p className="text-gray-700 mb-4">
                You have the right to:
              </p>
              <ul className="list-disc pl-6 mb-4 text-gray-700">
                <li>Access your personal information</li>
                <li>Request correction of inaccurate data</li>
                <li>Request deletion of your data (subject to legal requirements)</li>
                <li>Opt-out of marketing communications</li>
                <li>Lodge a complaint with regulatory authorities</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">6. Cookies and Tracking</h3>
              <p className="text-gray-700 mb-4">
                We use cookies and similar technologies to:
              </p>
              <ul className="list-disc pl-6 mb-4 text-gray-700">
                <li>Remember your preferences and settings</li>
                <li>Keep you logged in securely</li>
                <li>Analyze website traffic and usage patterns</li>
                <li>Improve our website functionality</li>
              </ul>
              <p className="text-gray-700 mb-4">
                You can control cookies through your browser settings, but disabling cookies may affect website functionality.
              </p>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">7. Data Retention</h3>
              <p className="text-gray-700 mb-4">
                We retain your information for as long as necessary to:
              </p>
              <ul className="list-disc pl-6 mb-4 text-gray-700">
                <li>Provide you with banking services</li>
                <li>Comply with legal and regulatory obligations</li>
                <li>Resolve disputes and enforce agreements</li>
                <li>Prevent fraud and maintain security</li>
              </ul>
            </section>

            <section className="mb-8 pt-8 border-t border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Copyright Notice</h2>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">1. Ownership</h3>
              <p className="text-gray-700 mb-4">
                © 2025 {bankName}. All rights reserved.
              </p>
              <p className="text-gray-700 mb-4">
                All content on this website, including but not limited to text, graphics, logos, images, audio clips,
                digital downloads, data compilations, and software, is the property of {bankName} or its
                content suppliers and is protected by United States and international copyright laws.
              </p>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">2. Trademarks</h3>
              <p className="text-gray-700 mb-4">
                {bankName}, the {bankName} logo, and all related names, logos, product and
                service names, designs, and slogans are trademarks of {bankName}. You may not use such
                marks without prior written permission from {bankName}.
              </p>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">3. Limited License</h3>
              <p className="text-gray-700 mb-4">
                {bankName} grants you a limited license to:
              </p>
              <ul className="list-disc pl-6 mb-4 text-gray-700">
                <li>Access and use our website for personal, non-commercial purposes</li>
                <li>View and print pages for your own information</li>
                <li>Download materials for personal use only</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">4. Restrictions</h3>
              <p className="text-gray-700 mb-4">
                You may not:
              </p>
              <ul className="list-disc pl-6 mb-4 text-gray-700">
                <li>Modify, copy, or distribute any content from our website</li>
                <li>Use our content for commercial purposes without permission</li>
                <li>Reverse engineer or attempt to extract source code</li>
                <li>Remove copyright or proprietary notices</li>
                <li>Transfer or sublicense any rights granted to you</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">5. DMCA Compliance</h3>
              <p className="text-gray-700 mb-4">
                If you believe that any content on our website infringes your copyright, please contact us at:
              </p>
              <div className="bg-gray-50 p-4 rounded-lg mb-4">
                <p className="text-gray-700"><strong>Email:</strong> copyright@sterlingcapitalbank.com</p>
                <p className="text-gray-700"><strong>Subject:</strong> DMCA Takedown Notice</p>
              </div>
            </section>

            <section className="mb-8 pt-8 border-t border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Contact Us</h2>
              <p className="text-gray-700 mb-4">
                If you have questions about this Privacy Policy or Copyright Notice, please contact us:
              </p>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-gray-700"><strong>Privacy Officer:</strong> privacy@sterlingcapitalbank.com</p>
                <p className="text-gray-700"><strong>Phone:</strong> +1 (800) 123-4567</p>
                <p className="text-gray-700"><strong>Mail:</strong> {bankName}, Privacy Department, New York, USA</p>
              </div>
            </section>

            <section className="mb-8 pt-8 border-t border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Updates to This Policy</h2>
              <p className="text-gray-700 mb-4">
                We may update this Privacy Policy from time to time. We will notify you of any changes by posting
                the new Privacy Policy on this page and updating the "Last Updated" date. You are advised to review
                this Privacy Policy periodically for any changes.
              </p>
            </section>
          </div>

          <div className="mt-12 pt-8 border-t border-gray-200 bg-blue-50 p-6 rounded-lg">
            <p className="text-sm text-gray-700">
              <strong>FDIC Insured:</strong> Your deposits with {bankName} are insured by the Federal
              Deposit Insurance Corporation up to $250,000 per depositor, per account ownership category.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
