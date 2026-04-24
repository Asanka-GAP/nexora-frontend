"use client";

export function StudentsMockup() {
  const students = [
    { name: "Kasun Perera", code: "STU00012", grade: 6, pct: 92, active: true },
    { name: "Amaya Silva", code: "STU00013", grade: 7, pct: 78, active: true },
    { name: "Nimal Rajapaksa", code: "STU00014", grade: 6, pct: 45, active: true },
    { name: "Dilani Mendis", code: "STU00015", grade: 8, pct: 88, active: true },
    { name: "Ruwan Fernando", code: "STU00016", grade: 7, pct: 60, active: false },
  ];

  const barColor = (p: number) => p >= 75 ? "#10B981" : p >= 50 ? "#F59E0B" : "#EF4444";

  return (
    <div className="w-full max-w-[560px] mx-auto rounded-2xl overflow-hidden shadow-2xl border border-slate-200" style={{ fontFamily: "Inter, sans-serif" }}>
      {/* Header */}
      <div className="bg-white px-4 py-3 border-b border-slate-100 flex items-center justify-between">
        <div>
          <p className="text-sm font-bold text-slate-800">All Students</p>
          <p className="text-xs text-slate-400 mt-0.5">5 students total</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-white" style={{ background: "linear-gradient(135deg,#10B981,#059669)" }}>
            + Add
          </div>
          <div className="hidden sm:block px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-600 bg-slate-100">
            Import CSV
          </div>
        </div>
      </div>

      {/* Stat row */}
      <div className="bg-white px-4 py-3 border-b border-slate-100 grid grid-cols-4 gap-2">
        {[
          { label: "Total", value: "5", color: "#4F46E5" },
          { label: "Active", value: "4", color: "#10B981" },
          { label: "Avg", value: "73%", color: "#8B5CF6" },
          { label: "Low", value: "1", color: "#F59E0B" },
        ].map((s) => (
          <div key={s.label} className="text-center">
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">{s.label}</p>
            <p className="text-sm font-bold mt-0.5" style={{ color: s.color }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Desktop table — hidden on small screens */}
      <div className="hidden sm:block bg-white">
        <div className="grid grid-cols-12 px-4 py-2 border-b border-slate-100 bg-slate-50">
          {["Student", "Grade", "Attendance", "Status", ""].map((h, i) => (
            <div key={i} className={`text-[9px] font-bold text-slate-400 uppercase tracking-wider ${i === 0 ? "col-span-4" : i === 2 ? "col-span-3" : "col-span-2"} ${i === 4 ? "col-span-1" : ""}`}>{h}</div>
          ))}
        </div>
        {students.map((s, i) => (
          <div key={s.code} className={`grid grid-cols-12 px-4 py-2.5 items-center ${i < students.length - 1 ? "border-b border-slate-50" : ""}`}>
            <div className="col-span-4">
              <p className="text-xs font-semibold text-slate-800 truncate">{s.name}</p>
              <p className="text-[9px] font-mono text-slate-400">{s.code}</p>
            </div>
            <div className="col-span-2">
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-cyan-50 text-cyan-700">{s.grade}</span>
            </div>
            <div className="col-span-3">
              <div className="flex items-center gap-1.5">
                <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${s.pct}%`, backgroundColor: barColor(s.pct) }} />
                </div>
                <span className="text-[9px] font-bold text-slate-600 w-6 text-right">{s.pct}%</span>
              </div>
            </div>
            <div className="col-span-2 flex items-center">
              <div className={`relative inline-flex h-3.5 w-6 items-center rounded-full ${s.active ? "bg-emerald-500" : "bg-red-400"}`}>
                <span className={`inline-block h-2.5 w-2.5 transform rounded-full bg-white shadow-sm ${s.active ? "translate-x-3" : "translate-x-0.5"}`} />
              </div>
            </div>
            <div className="col-span-1">
              <span className="text-[8px] font-semibold text-indigo-500">Edit</span>
            </div>
          </div>
        ))}
      </div>

      {/* Mobile card list — shown only on small screens */}
      <div className="sm:hidden bg-white divide-y divide-slate-50">
        {students.map((s) => (
          <div key={s.code} className="px-4 py-3 flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 flex items-center justify-center flex-shrink-0">
              <span className="text-xs font-bold text-indigo-600">{s.name[0]}</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2 mb-1">
                <p className="text-xs font-semibold text-slate-800 truncate">{s.name}</p>
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-cyan-50 text-cyan-700 flex-shrink-0">G{s.grade}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${s.pct}%`, backgroundColor: barColor(s.pct) }} />
                </div>
                <span className="text-[9px] font-bold text-slate-500">{s.pct}%</span>
                <div className={`relative inline-flex h-3 w-5 items-center rounded-full flex-shrink-0 ${s.active ? "bg-emerald-500" : "bg-red-400"}`}>
                  <span className={`inline-block h-2 w-2 transform rounded-full bg-white shadow-sm ${s.active ? "translate-x-2.5" : "translate-x-0.5"}`} />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
