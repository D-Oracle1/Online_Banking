import { requireAdminAuth } from '@/lib/session';
import { db } from '@/server/db';
import { users } from '@/shared/schema';
import { desc, eq } from 'drizzle-orm';
import UserVerificationClient from '@/components/UserVerificationClient';

export default async function UserVerificationPage() {
  await requireAdminAuth();

  // Fetch all users with their uploaded documents
  const allUsers = await db
    .select()
    .from(users)
    .orderBy(desc(users.createdAt));

  // Filter users who have uploaded documents and transform data
  const usersWithDocuments = allUsers
    .filter(user => user.profilePhoto || user.idDocument)
    .map(user => ({
      ...user,
      dateOfBirth: user.dateOfBirth ? new Date(user.dateOfBirth) : null,
    }));

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">User Verification</h1>
        <p className="text-gray-600 mt-2">Review uploaded profile photos and ID documents</p>
      </div>

      <UserVerificationClient users={usersWithDocuments} />
    </div>
  );
}
