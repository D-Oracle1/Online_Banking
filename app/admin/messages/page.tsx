import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import AdminChatInterfaceV2 from '@/components/AdminChatInterfaceV2';
import MergeDuplicateChats from '@/components/MergeDuplicateChats';
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
    // Cancel the layout's padding so the blue chat header sits at the very top
    <div className="-m-3 -mt-16 md:-m-6 md:-mt-16 lg:-mt-6">
      <h1 className="sr-only">Messages & Support</h1>
      <AdminChatInterfaceV2
        conversations={conversations}
        adminId={session.id}
        fullScreen
        headerActions={<MergeDuplicateChats compact />}
      />
    </div>
  );
}
