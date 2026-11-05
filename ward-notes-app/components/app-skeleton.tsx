export function AppSkeleton() {
  return (
    <div className="min-h-dvh" aria-busy="true">
      <span className="sr-only">Loading Clinicee</span>
      <div className="border-b border-slate-200/80 bg-white/90">
        <div className="mx-auto w-full max-w-5xl animate-pulse px-4 pb-4 pt-[max(0.75rem,env(safe-area-inset-top))]">
          <div className="h-3 w-20 rounded-full bg-sky-100" />
          <div className="mt-3 h-8 w-40 rounded-full bg-slate-200" />
          <div className="mt-2 h-4 w-56 rounded-full bg-slate-100" />
          <div className="mt-4 h-12 rounded-2xl bg-slate-100" />
        </div>
      </div>
      <div className="mx-auto grid w-full max-w-5xl grid-cols-2 gap-3 px-4 py-5 sm:grid-cols-3">
        {Array.from({ length: 4 }, (_, index) => (
          <div key={index} className="h-40 animate-pulse rounded-3xl bg-white ring-1 ring-slate-200/80" />
        ))}
      </div>
    </div>
  );
}
