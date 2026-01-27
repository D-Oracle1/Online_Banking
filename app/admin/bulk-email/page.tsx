import { requireAdmin } from '@/lib/admin';
import { db } from '@/server/db';
import { users } from '@/shared/schema';
import { desc } from 'drizzle-orm';
import BulkEmailClient from '@/components/BulkEmailClient';

export default async function BulkEmailPage() {
  await requireAdmin();

  // Fetch all users with their basic info
  const allUsers = await db.query.users.findMany({
    orderBy: [desc(users.createdAt)],
    columns: {
      id: true,
      fullName: true,
      email: true,
      username: true,
      role: true,
    },
  });

  // Filter out admin users (don't send bulk emails to admins)
  const regularUsers = allUsers.filter(user => user.role !== 'admin');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Bulk Email System</h1>
        <p className="text-gray-600 mt-2">Send emails to one or multiple users</p>
      </div>

      <BulkEmailClient users={regularUsers} />
    </div>
  );
}
