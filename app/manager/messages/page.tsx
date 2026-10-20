import { db } from '@/server/db';
import { users } from '@/shared/schema';
import { eq, and, isNull } from 'drizzle-orm';
import AdminChatInterfaceV2 from '@/components/AdminChatInterfaceV2';
import { getConversations } from '@/server/chat';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function ManagerMessagesPage() {
  // Read session directly — same pattern as /api/manager/users
  const cookieStore = await cookies();
  const managerId = cookieStore.get('userId')?.value;

  if (!managerId) redirect('/login');

  const currentUser = await db.query.users.findFirst({
    where: eq(users.id, managerId),
  });

  if (!currentUser || (!currentUser.isManager && currentUser.role !== 'admin' && !currentUser.isSuperAdmin)) {
    redirect('/login');
  }

  // Get assigned users — exact same query as /api/manager/users
  const assignedUsers = await db
    .select({ id: users.id })
    .from(users)
    .where(and(eq(users.assignedManagerId, managerId), isNull(users.deletedAt)));

  if (assignedUsers.length === 0) {
    return (
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Messages</h1>
        <div className="bg-white rounded-xl p-12 text-center text-gray-500 shadow-sm border border-gray-200">
          <p className="font-semibold text-gray-700">No users assigned to you yet.</p>
          <p className="text-sm mt-2">
            Ask a super admin to go to <strong>Admin → Users</strong>, click the{' '}
            <strong>assign icon</strong> next to a user, and select you as their manager.
          </p>
        </div>
      </div>
    );
  }

  // Assigned users' conversations, including assigned users with no messages yet
  const conversations = await getConversations(managerId);

  return (
    <div>
      <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4 md:mb-6">Messages</h1>
      <AdminChatInterfaceV2 conversations={conversations} adminId={managerId} />
    </div>
  );
}
