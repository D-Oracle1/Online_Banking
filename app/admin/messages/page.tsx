import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import AdminChatInterfaceV2 from '@/components/AdminChatInterfaceV2';
import { getConversations } from '@/server/chat';

export const dynamic = 'force-dynamic';

export default async function AdminMessagesPage() {
  const session = await getSession();

  if (!session || session.role !== 'admin') {
    redirect('/login');
  }

  // All conversations (registered users and anonymous guests)
  const conversations = await getConversations();

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Messages & Support</h1>
      <AdminChatInterfaceV2 conversations={conversations} adminId={session.id} />
    </div>
  );
}
