export default function FulfillmentHistoryLoading() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8 rounded-2xl border border-slate-200/80 bg-white/70 p-6 shadow-sm backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl shimmer" />
          <div className="space-y-2">
            <div className="h-3 w-24 rounded shimmer" />
            <div className="h-6 w-52 rounded shimmer" />
          </div>
        </div>
        <div className="mt-3 h-4 w-2/3 rounded shimmer" />
      </div>
      <div className="mb-8 grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="rounded-2xl border border-slate-200/80 bg-white/70 p-5 shadow-sm backdrop-blur-md">
            <div className="h-3 w-24 rounded shimmer" />
            <div className="mt-3 h-8 w-16 rounded shimmer" />
            <div className="mt-2 h-3 w-20 rounded shimmer" />
          </div>
        ))}
      </div>
      <div className="rounded-2xl border border-slate-200/80 bg-white/70 p-6 shadow-sm backdrop-blur-md">
        <div className="h-5 w-40 rounded shimmer mb-4" />
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-12 w-full rounded-lg shimmer" />
          ))}
        </div>
      </div>
    </div>
  );
}
