"use client";

// Mini dashboard preview rendered inside the laptop screen
function DashboardPreview() {
  return (
    <div className="w-full h-full bg-[#F8FAFC] flex overflow-hidden" style={{ fontFamily: "Inter, sans-serif" }}>
      {/* Sidebar */}
      <div className="w-[52px] bg-white border-r border-slate-100 flex flex-col items-center py-3 gap-3 flex-shrink-0">
        <div className="w-7 h-7 rounded-lg flex items-center justify-center mb-1" style={{ background: "linear-gradient(135deg,#4F46E5,#3730A3)" }}>
          <span className="text-white font-black text-[9px]">N</span>
        </div>
        {["M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5",
          "M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75",
          "M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z",
          "M4.26 10.147a60.438 60.438 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5",
        ].map((d, i) => (
          <div key={i} className={`w-7 h-7 rounded-lg flex items-center justify-center ${i === 1 ? "bg-indigo-50" : ""}`}>
            <svg viewBox="0 0 24 24" fill="none" stroke={i === 1 ? "#4F46E5" : "#94A3B8"} strokeWidth={1.6} className="w-3.5 h-3.5">
              <path strokeLinecap="round" strokeLinejoin="round" d={d} />
            </svg>
          </div>
        ))}
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <div className="h-8 bg-white border-b border-slate-100 flex items-center justify-between px-3 flex-shrink-0">
          <span className="text-[8px] font-semibold text-slate-700">Dashboard</span>
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <span className="text-white text-[6px] font-bold">T</span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 p-2.5 overflow-hidden">
          {/* Stat cards */}
          <div className="grid grid-cols-4 gap-1.5 mb-2.5">
            {[
              { label: "Students", value: "248", color: "from-indigo-500 to-purple-600", icon: "M4.26 10.147a60.438 60.438 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5" },
              { label: "Classes", value: "12", color: "from-blue-500 to-cyan-500", icon: "M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" },
              { label: "Today", value: "34", color: "from-emerald-500 to-teal-500", icon: "M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" },
              { label: "Rate", value: "94%", color: "from-amber-500 to-orange-500", icon: "M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" },
            ].map((c) => (
              <div key={c.label} className="bg-white rounded-lg p-2 border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[6px] font-bold text-slate-400 uppercase tracking-wide">{c.label}</span>
                  <div className={`w-4 h-4 rounded-md bg-gradient-to-br ${c.color} flex items-center justify-center`}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2} className="w-2.5 h-2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d={c.icon} />
                    </svg>
                  </div>
                </div>
                <p className="text-[11px] font-bold text-slate-800">{c.value}</p>
              </div>
            ))}
          </div>

          {/* Chart + recent */}
          <div className="grid grid-cols-5 gap-1.5">
            {/* Bar chart */}
            <div className="col-span-3 bg-white rounded-lg p-2 border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
              <p className="text-[7px] font-bold text-slate-600 mb-2">Weekly Attendance</p>
              <div className="flex items-end gap-1 h-14">
                {[65, 80, 55, 90, 75, 88, 70].map((h, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
                    <div className="w-full rounded-sm" style={{ height: `${h * 0.56}px`, background: i === 4 ? "linear-gradient(180deg,#4F46E5,#3730A3)" : "#EEF2FF" }} />
                    <span className="text-[5px] text-slate-400">{["M","T","W","T","F","S","S"][i]}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent attendance */}
            <div className="col-span-2 bg-white rounded-lg p-2 border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
              <p className="text-[7px] font-bold text-slate-600 mb-1.5">Recent</p>
              <div className="space-y-1">
                {[
                  { name: "Kasun P.", status: "P", color: "bg-emerald-500" },
                  { name: "Amaya S.", status: "P", color: "bg-emerald-500" },
                  { name: "Nimal R.", status: "A", color: "bg-red-400" },
                  { name: "Dilani M.", status: "P", color: "bg-emerald-500" },
                ].map((s) => (
                  <div key={s.name} className="flex items-center justify-between">
                    <span className="text-[6px] text-slate-600 truncate flex-1">{s.name}</span>
                    <span className={`text-[5px] font-bold text-white px-1 py-0.5 rounded ${s.color}`}>{s.status}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function LaptopMockup() {
  return (
    <div className="relative w-full max-w-[580px] mx-auto select-none">
      {/* Screen bezel */}
      <div className="relative rounded-t-2xl overflow-hidden shadow-2xl" style={{ background: "#1a1a2e", padding: "10px 10px 0 10px" }}>
        {/* Camera dot */}
        <div className="flex justify-center mb-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-slate-600" />
        </div>
        {/* Screen */}
        <div className="rounded-t-lg overflow-hidden" style={{ aspectRatio: "16/10" }}>
          <DashboardPreview />
        </div>
      </div>
      {/* Base */}
      <div className="relative" style={{ background: "#2a2a3e", height: "18px", borderRadius: "0 0 4px 4px" }}>
        <div className="absolute left-1/2 -translate-x-1/2 top-0 w-24 h-2 rounded-b-lg" style={{ background: "#1a1a2e" }} />
      </div>
      {/* Stand */}
      <div className="mx-auto" style={{ width: "60%", height: "10px", background: "linear-gradient(180deg,#2a2a3e,#3a3a4e)", borderRadius: "0 0 8px 8px" }} />
      {/* Base foot */}
      <div className="mx-auto rounded-full" style={{ width: "75%", height: "6px", background: "#1a1a2e", marginTop: "1px" }} />
    </div>
  );
}
