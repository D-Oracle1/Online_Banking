import { db } from '@/server/db';
import { users } from '@/shared/schema';
import { eq, and, isNull } from 'drizzle-orm';
import { Lock } from 'lucide-react';
import AdminChatInterfaceV2 from '@/components/AdminChatInterfaceV2';
import { getConversations } from '@/server/chat';
import { getStaffContext } from '@/lib/manager-permissions';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function ManagerMessagesPage() {
  const staff = await getStaffContext();
  if (!staff) redirect('/login');

  if (!staff.permissions.viewMessages) {
    return (
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Messages</h1>
        <div className="bg-white rounded-xl p-12 text-center text-gray-500 shadow-sm border border-gray-200">
          <Lock className="w-10 h-10 mx-auto mb-3 text-gray-300" />
          <p className="font-semibold text-gray-700">Messaging isn&apos;t enabled for you.</p>
          <p className="text-sm mt-2">An admin can turn it on for you under <strong>Manager Rules</strong>.</p>
        </div>
      </div>
    );
  }

  const managerId = staff.id;

  // Get assigned users — exact same query as /api/manager/users (admins see everyone)
  const assignedUsers = staff.isFullAdmin
    ? null
    : await db
        .select({ id: users.id })
        .from(users)
        .where(and(eq(users.assignedManagerId, managerId), isNull(users.deletedAt)));

  if (assignedUsers && assignedUsers.length === 0) {
    return (
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Messages</h1>
        <div className="bg-white rounded-xl p-12 text-center text-gray-500 shadow-sm border border-gray-200">
          <p className="font-semibold text-gray-700">No users assigned to you yet.</p>
          <p className="text-sm mt-2">
            Ask an admin to assign clients to you under <strong>Manager Rules</strong>.
          </p>
        </div>
      </div>
    );
  }

  // Assigned users' conversations, including assigned users with no messages yet
  const conversations = await getConversations(staff.isFullAdmin ? undefined : managerId);

  return (
    <div>
      <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4 md:mb-6">Messages</h1>
      <AdminChatInterfaceV2
        conversations={conversations}
        adminId={managerId}
        canSend={staff.permissions.sendMessages}
        canDelete={staff.permissions.deleteMessages}
      />
    </div>
  );
}
