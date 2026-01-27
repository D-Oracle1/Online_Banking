import type { Metadata } from "next";
import "./globals.css";
import { getSiteSettings } from "@/lib/site-settings";
import Providers from "@/components/Providers";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();

  return {
    title: `${settings.bankName} - Online Banking`,
    description: "Manage your funds, apply for loans, and track your financial growth with ease.",
    icons: {
      icon: settings.faviconUrl || '/favicon.ico',
      apple: '/apple-touch-icon.png',
    },
    manifest: '/api/manifest',
    appleWebApp: {
      capable: true,
      statusBarStyle: 'black-translucent',
      title: `${settings.bankName}`,
    },
    formatDetection: {
      telephone: false,
    },
    openGraph: {
      type: 'website',
      siteName: `${settings.bankName}`,
      title: `${settings.bankName} - Online Banking`,
      description: "Manage your funds, apply for loans, and track your financial growth with ease.",
    },
    twitter: {
      card: 'summary',
      title: `${settings.bankName} - Online Banking`,
      description: "Manage your funds, apply for loans, and track your financial growth with ease.",
    },
    viewport: {
      width: 'device-width',
      initialScale: 1,
      maximumScale: 1,
      userScalable: false,
    },
    themeColor: settings.primaryColor,
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const settings = await getSiteSettings();

  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Jost:ital,wght@0,100..900;1,100..900&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Rajdhani:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
        <style dangerouslySetInnerHTML={{
          __html: `
            :root {
              /* Brand Colors */
              --color-primary: ${settings.primaryColor};
              --color-secondary: ${settings.secondaryColor};
              --color-accent: ${settings.accentColor};

              /* Background Colors */
              --color-bg-light: ${settings.backgroundLight};
              --color-bg-dark: ${settings.backgroundDark};

              /* Text Colors */
              --color-text-primary: ${settings.textPrimary};
              --color-text-secondary: ${settings.textSecondary};
              --color-text-muted: ${settings.textMuted};

              /* Button Colors */
              --color-btn-primary: ${settings.buttonPrimary};
              --color-btn-secondary: ${settings.buttonSecondary};
              --color-btn-success: ${settings.buttonSuccess};
              --color-btn-warning: ${settings.buttonWarning};
              --color-btn-danger: ${settings.buttonDanger};

              /* Border & UI Colors */
              --color-border: ${settings.borderColor};
              --color-shadow: ${settings.shadowColor};
            }
          `
        }} />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
