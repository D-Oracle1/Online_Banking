import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import { getSiteSettings } from '@/lib/site-settings';
import LoginForm from '@/components/LoginForm';
import SupportChatbot from '@/components/SupportChatbot';
import BrandImage from '@/components/BrandImage';

export default async function LoginPage() {
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
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-2">
              {/* Uploaded logo first; if its URL is dead, the built-in logo */}
              <BrandImage
                sources={[settings.logoUrl, '/logo_1760007385.png']}
                alt={`${settings.bankName} Logo`}
                className="h-20 object-contain"
                fallback={<span className="text-2xl font-bold text-gray-900">{settings.bankName}</span>}
              />
            </div>
            {/* The logo already shows the name; keep the heading for screen readers */}
            <h1 className="sr-only">{settings.bankName}</h1>
            <p className="text-gray-600">{settings.tagline || 'Secure Online Banking'}</p>
          </div>

          <LoginForm />

          <div className="mt-6 text-center text-sm text-gray-600">
            <p>By logging in, you agree to our Terms of Service and Privacy Policy</p>
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
