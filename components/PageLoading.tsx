/**
 * Shown by Next.js loading.tsx files while a page's server data loads,
 * so navigation gives instant feedback instead of appearing frozen.
 */
export default function PageLoading({ message = 'Loading...' }: { message?: string }) {
  return (
    <div className="space-y-6 animate-pulse" role="status" aria-live="polite">
      <div className="space-y-2">
        <div className="h-8 w-56 bg-gray-200 rounded-lg" />
        <div className="h-4 w-80 max-w-full bg-gray-200 rounded" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[0, 1, 2, 3].map(i => (
          <div key={i} className="h-24 bg-white border border-gray-200 rounded-xl shadow-sm" />
        ))}
      </div>
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-4 space-y-3">
        {[0, 1, 2, 3, 4].map(i => (
          <div key={i} className="h-10 bg-gray-100 rounded-lg" />
        ))}
      </div>
      <span className="sr-only">{message}</span>
    </div>
  );
}
