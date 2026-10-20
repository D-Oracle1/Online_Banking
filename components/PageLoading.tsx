import LoadingLogo from '@/components/LoadingLogo';

/**
 * Shown by Next.js loading.tsx files while a page's server data loads,
 * so navigation gives instant feedback instead of appearing frozen.
 */
export default function PageLoading({ message = 'Loading...' }: { message?: string }) {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <LoadingLogo message={message} />
    </div>
  );
}
