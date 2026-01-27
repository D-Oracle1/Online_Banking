import { requireAuth } from '@/lib/session';
import FixedSavingsClient from '@/components/FixedSavingsClient';

export default async function FixedSavingsPage() {
  await requireAuth();

  return <FixedSavingsClient />;
}
