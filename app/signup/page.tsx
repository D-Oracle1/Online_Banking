import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import { getSiteSettings } from '@/lib/site-settings';
import EnhancedSignupForm from '@/components/EnhancedSignupForm';
import SupportChatbot from '@/components/SupportChatbot';
import Image from 'next/image';
import Link from 'next/link';

export default async function SignupPage() {
  const session = await getSession();

  if (session) {
    redirect('/dashboard');
  }

  const settings = await getSiteSettings();
  const currentYear = new Date().getFullYear();
  const copyrightText = settings.copyrightText || `${currentYear} ${settings.bankName}. All rights reserved.`;

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        background: `linear-gradient(to bottom right, ${settings.primaryColor}, ${settings.primaryColor}dd, ${settings.primaryColor})`
      }}
    >
      <div className="max-w-4xl w-full">
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              {settings.logoUrl ? (
                <img
                  src={settings.logoUrl}
                  alt={`${settings.bankName} Logo`}
                  className="h-20 object-contain"
                />
              ) : (
                <Image
                  src="/logo_1760007385.png"
                  alt={`${settings.bankName} Logo`}
                  width={200}
                  height={80}
                  priority
                  className="object-contain"
                />
              )}
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Create Your Account</h1>
            <p className="text-gray-600">Join {settings.bankName} - {settings.tagline || 'Your trusted financial partner'}</p>
          </div>

          <EnhancedSignupForm />

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <Link
                href="/login"
                className="font-semibold hover:opacity-80"
                style={{ color: settings.primaryColor }}
              >
                Log in here
              </Link>
            </p>
          </div>

          <div className="mt-6 text-center text-sm text-gray-600">
            <p>By creating an account, you agree to our Terms of Service and Privacy Policy</p>
          </div>
        </div>

        <p className="text-white text-center mt-6 text-sm">
          &copy; {copyrightText}
        </p>
      </div>
      <SupportChatbot />
    </div>
  );
}
