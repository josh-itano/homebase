export default function Loading() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-6 animate-pulse">
      {/* Page title */}
      <div className="h-7 w-40 bg-stone-200 rounded-lg mb-6" />

      {/* Card rows */}
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="bg-white rounded-xl border border-stone-100 px-4 py-3 flex items-center gap-3">
            <div className="w-8 h-8 bg-stone-100 rounded-lg flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-3.5 bg-stone-100 rounded w-1/2" />
              <div className="h-3 bg-stone-100 rounded w-1/3" />
            </div>
            <div className="h-3 w-12 bg-stone-100 rounded" />
          </div>
        ))}
      </div>
    </div>
  )
}
