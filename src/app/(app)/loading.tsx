export default function AppLoading() {
  return (
    <div className="relative">
      {/* Subtle top progress bar */}
      <div className="absolute top-0 left-0 right-0 h-0.5 overflow-hidden rounded-full">
        <div className="h-full bg-gradient-to-r from-transparent via-indigo-500 to-transparent loading-shimmer" />
      </div>

      <div className="space-y-6 pt-2">
        {/* Header */}
        <div className="loading-fade-in flex items-center justify-between" style={{ animationDelay: "0ms" }}>
          <div>
            <div className="h-5 w-44 rounded-lg skeleton" />
            <div className="h-3 w-24 rounded skeleton mt-2.5" />
          </div>
          <div className="h-10 w-32 rounded-xl skeleton" />
        </div>

        {/* Stat cards */}
        <div className="loading-fade-in grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5" style={{ animationDelay: "60ms" }}>
          {[0, 1, 2, 3].map(i => (
            <div key={i} className="relative bg-white rounded-2xl p-5 border border-slate-100/80 overflow-hidden"
              style={{ animationDelay: `${80 + i * 40}ms` }}>
              <div className="absolute inset-0 loading-shimmer" />
              <div className="relative">
                <div className="flex items-start justify-between mb-4">
                  <div className="h-2 w-14 rounded skeleton" />
                  <div className="w-9 h-9 rounded-xl skeleton" />
                </div>
                <div className="h-7 w-16 rounded-lg skeleton mb-3" />
                <div className="h-2.5 w-24 rounded skeleton" />
              </div>
            </div>
          ))}
        </div>

        {/* Chart area */}
        <div className="loading-fade-in grid grid-cols-1 lg:grid-cols-2 gap-4" style={{ animationDelay: "180ms" }}>
          {[0, 1].map(i => (
            <div key={i} className="relative bg-white rounded-2xl p-6 border border-slate-100/80 overflow-hidden">
              <div className="absolute inset-0 loading-shimmer" />
              <div className="relative">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 rounded-xl skeleton" />
                  <div>
                    <div className="h-4 w-32 rounded-lg skeleton" />
                    <div className="h-2.5 w-20 rounded skeleton mt-2" />
                  </div>
                </div>
                {/* Chart bars */}
                <div className="flex items-end gap-3 h-36 pt-4">
                  {[40, 65, 45, 80, 55, 70, 50].map((h, j) => (
                    <div key={j} className="flex-1 rounded-t-md skeleton" style={{ height: `${h}%`, animationDelay: `${j * 60}ms` }} />
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Table area */}
        <div className="loading-fade-in relative bg-white rounded-2xl border border-slate-100/80 overflow-hidden" style={{ animationDelay: "280ms" }}>
          <div className="absolute inset-0 loading-shimmer" />
          {/* Table header */}
          <div className="relative flex items-center gap-6 px-6 py-4 border-b border-slate-100/60">
            {[80, 56, 72, 48, 40].map((w, i) => (
              <div key={i} className="h-2 rounded skeleton" style={{ width: w }} />
            ))}
          </div>
          {/* Table rows */}
          <div className="relative divide-y divide-slate-50">
            {[0, 1, 2, 3, 4].map(i => (
              <div key={i} className="flex items-center gap-4 px-6 py-4" style={{ animationDelay: `${300 + i * 50}ms` }}>
                <div className="w-9 h-9 rounded-xl skeleton flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 rounded-lg skeleton" style={{ width: `${55 + i * 7}%` }} />
                  <div className="h-2 rounded skeleton" style={{ width: `${30 + i * 5}%` }} />
                </div>
                <div className="h-6 w-16 rounded-lg skeleton flex-shrink-0" />
                <div className="h-6 w-12 rounded-lg skeleton flex-shrink-0" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
