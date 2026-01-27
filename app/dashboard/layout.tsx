import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import { db } from '@/server/db';
import { users } from '@/shared/schema';
import { eq } from 'drizzle-orm';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import SupportChatbot from '@/components/SupportChatbot';
import PushNotificationPrompt from '@/components/PushNotificationPrompt';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session) {
    redirect('/login');
  }

  // Fetch user data including profile photo
  const user = await db.query.users.findFirst({
    where: eq(users.id, session.id),
  });

  return (
    <div className="flex h-screen" style={{ backgroundColor: 'var(--color-bg-dark, #f9fafb)' }}>
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header user={{
          fullName: session.fullName,
          username: session.username,
          profilePhoto: user?.profilePhoto || null,
        }} />
        <main className="flex-1 overflow-y-auto p-3 md:p-6">
          {children}
        </main>
      </div>
      <SupportChatbot />
      <PushNotificationPrompt />
    </div>
  );
}
