export default function SettingsLoading() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8 rounded-2xl border border-slate-200/80 bg-white/70 p-6 shadow-sm backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl shimmer" />
          <div className="space-y-2">
            <div className="h-3 w-24 rounded shimmer" />
            <div className="h-6 w-20 rounded shimmer" />
          </div>
        </div>
        <div className="mt-3 h-4 w-3/4 rounded shimmer" />
      </div>
      <div className="space-y-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="rounded-2xl border border-slate-200/80 bg-white/70 p-5 shadow-sm backdrop-blur-md">
            <div className="h-4 w-1/3 rounded shimmer" />
            <div className="mt-3 h-10 w-full rounded-xl shimmer" />
          </div>
        ))}
      </div>
    </div>
  );
}
