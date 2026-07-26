export default function AccountLoading() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8 rounded-2xl border border-slate-200/80 bg-white/70 p-6 shadow-sm backdrop-blur-md">
        <div className="h-3 w-16 rounded shimmer" />
        <div className="mt-2 h-6 w-36 rounded shimmer" />
        <div className="mt-3 h-4 w-2/3 rounded shimmer" />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="rounded-2xl border border-slate-200/80 bg-white/70 p-5 shadow-sm backdrop-blur-md">
            <div className="h-4 w-1/3 rounded shimmer" />
            <div className="mt-3 h-4 w-2/3 rounded shimmer" />
            <div className="mt-2 h-3 w-full rounded shimmer" />
          </div>
        ))}
      </div>
    </div>
  );
}
