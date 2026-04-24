"use client";

// ── Shared mini screen content ──────────────────────────────────────────────
function MiniScreen({ variant }: { variant: "laptop" | "tablet" | "phone" }) {
  const isPhone = variant === "phone";
  const isTablet = variant === "tablet";

  return (
    <div className="w-full h-full bg-[#F8FAFC] flex overflow-hidden" style={{ fontFamily: "Inter, sans-serif" }}>
      {/* Sidebar — hidden on phone */}
      {!isPhone && (
        <div
          className="bg-white border-r border-slate-100 flex flex-col items-center py-2 gap-2 flex-shrink-0"
          style={{ width: isTablet ? 32 : 40 }}
        >
          <div
            className="rounded-md flex items-center justify-center mb-1"
            style={{ width: isTablet ? 18 : 22, height: isTablet ? 18 : 22, background: "linear-gradient(135deg,#4F46E5,#3730A3)" }}
          >
            <span className="text-white font-black" style={{ fontSize: isTablet ? 5 : 6 }}>N</span>
          </div>
          {["M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75",
            "M4.26 10.147a60.438 60.438 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5",
            "M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0118 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25",
          ].map((d, i) => (
            <div key={i} className={`rounded-md flex items-center justify-center ${i === 0 ? "bg-indigo-50" : ""}`}
              style={{ width: isTablet ? 20 : 24, height: isTablet ? 20 : 24 }}>
              <svg viewBox="0 0 24 24" fill="none" stroke={i === 0 ? "#4F46E5" : "#94A3B8"} strokeWidth={1.8}
                style={{ width: isTablet ? 10 : 12, height: isTablet ? 10 : 12 }}>
                <path strokeLinecap="round" strokeLinejoin="round" d={d} />
              </svg>
            </div>
          ))}
        </div>
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Top bar */}
        <div className="bg-white border-b border-slate-100 flex items-center justify-between px-2 flex-shrink-0"
          style={{ height: isPhone ? 20 : 22 }}>
          {isPhone ? (
            <>
              <div className="flex items-center gap-1">
                <div className="rounded flex items-center justify-center" style={{ width: 14, height: 14, background: "linear-gradient(135deg,#4F46E5,#3730A3)" }}>
                  <span className="text-white font-black" style={{ fontSize: 5 }}>N</span>
                </div>
                <span style={{ fontSize: 5.5, fontWeight: 700, color: "#1E293B" }}>Nexora</span>
              </div>
              <div className="flex gap-0.5">
                {[0, 1, 2].map(i => <div key={i} className="bg-slate-300 rounded-full" style={{ width: 2, height: 2 }} />)}
              </div>
            </>
          ) : (
            <>
              <span style={{ fontSize: isTablet ? 5.5 : 6.5, fontWeight: 700, color: "#1E293B" }}>Dashboard</span>
              <div className="flex items-center gap-1">
                <div className="flex items-center gap-0.5 px-1.5 py-0.5 rounded text-white"
                  style={{ background: "linear-gradient(135deg,#4F46E5,#3730A3)", fontSize: isTablet ? 4 : 5 }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2} style={{ width: 6, height: 6 }}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 013.75 9.375v-4.5zM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 01-1.125-1.125v-4.5zM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0113.5 9.375v-4.5z" />
                  </svg>
                  Scan
                </div>
                <div className="rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center"
                  style={{ width: 14, height: 14 }}>
                  <span className="text-white font-bold" style={{ fontSize: 4 }}>T</span>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden p-1.5 flex flex-col gap-1.5">
          {/* Stat cards */}
          <div className={`grid gap-1 flex-shrink-0 ${isPhone ? "grid-cols-2" : "grid-cols-4"}`}>
            {[
              { label: "Scans", value: "34", grad: "from-[#4F46E5] to-[#3730A3]", accent: "#4F46E5" },
              { label: "Students", value: "248", grad: "from-emerald-500 to-emerald-600", accent: "#10b981" },
              ...(!isPhone ? [
                { label: "Classes", value: "12", grad: "from-violet-500 to-purple-600", accent: "#8b5cf6" },
                { label: "Upcoming", value: "5", grad: "from-amber-500 to-orange-500", accent: "#f59e0b" },
              ] : []),
            ].map((c) => (
              <div key={c.label} className="bg-white rounded border border-slate-100 relative overflow-hidden"
                style={{ padding: isPhone ? "4px 5px" : "3px 5px" }}>
                <svg className="absolute bottom-0 right-0 opacity-[0.07]" viewBox="0 0 120 60" fill="none"
                  style={{ width: 32, height: 18 }}>
                  <path d="M0 55 Q20 45 30 35 T60 20 T90 30 T120 10" stroke={c.accent} strokeWidth="3" fill="none" />
                  <path d="M0 55 Q20 45 30 35 T60 20 T90 30 T120 10 V60 H0 Z" fill={c.accent} opacity="0.3" />
                </svg>
                <div className="flex items-center justify-between mb-0.5">
                  <span style={{ fontSize: 4, fontWeight: 700, color: "#94A3B8", textTransform: "uppercase" }}>{c.label}</span>
                  <div className={`rounded bg-gradient-to-br ${c.grad} flex items-center justify-center`}
                    style={{ width: 10, height: 10 }}>
                    <div className="bg-white/60 rounded-full" style={{ width: 4, height: 4 }} />
                  </div>
                </div>
                <p style={{ fontSize: isPhone ? 10 : 9, fontWeight: 800, color: "#1E293B", lineHeight: 1 }}>{c.value}</p>
              </div>
            ))}
          </div>

          {/* Charts row */}
          <div className={`flex gap-1 flex-1 min-h-0 overflow-hidden ${isPhone ? "flex-col" : ""}`}>
            {/* Area chart */}
            <div className="bg-white rounded border border-slate-100 flex flex-col overflow-hidden"
              style={{ flex: isPhone ? "none" : 3, height: isPhone ? 52 : "auto" }}>
              <p style={{ fontSize: 5, fontWeight: 700, color: "#475569", padding: "3px 5px 1px" }}>Attendance Overview</p>
              <div className="flex-1 px-1 pb-1 flex items-end gap-0.5">
                {[40, 65, 50, 80, 70, 90, 60].map((h, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
                    <div className="w-full rounded-t-sm relative overflow-hidden" style={{ height: `${h * 0.38}px` }}>
                      <div className="absolute inset-0 opacity-20" style={{ background: "#4F46E5" }} />
                      <div className="absolute bottom-0 left-0 right-0" style={{ height: `${h * 0.38 * 0.6}px`, background: "linear-gradient(180deg,#4F46E5,#3730A3)", opacity: i === 5 ? 1 : 0.7 }} />
                    </div>
                    <span style={{ fontSize: 3.5, color: "#94A3B8" }}>{["M","T","W","T","F","S","S"][i]}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Bar chart — hidden on phone */}
            {!isPhone && (
              <div className="bg-white rounded border border-slate-100 flex flex-col overflow-hidden" style={{ flex: 2 }}>
                <p style={{ fontSize: 5, fontWeight: 700, color: "#475569", padding: "3px 5px 1px" }}>Class Overview</p>
                <div className="flex-1 px-1 pb-1 flex items-end gap-0.5">
                  {[30, 45, 28, 52, 38].map((h, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
                      <div className="w-full rounded-t-sm" style={{ height: `${h * 0.55}px`, background: `linear-gradient(180deg,#8B5CF6,#4F46E5)` }} />
                      <span style={{ fontSize: 3.5, color: "#94A3B8" }}>C{i + 1}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Donut — only on laptop/tablet */}
            {!isPhone && (
              <div className="bg-white rounded border border-slate-100 flex flex-col items-center justify-center overflow-hidden" style={{ flex: isTablet ? 2 : 2 }}>
                <p style={{ fontSize: 5, fontWeight: 700, color: "#475569", padding: "3px 5px 1px", alignSelf: "flex-start" }}>Grades</p>
                <div className="flex-1 flex items-center justify-center pb-1">
                  <svg viewBox="0 0 60 60" style={{ width: isTablet ? 36 : 44, height: isTablet ? 36 : 44 }}>
                    {[
                      { color: "#4F46E5", d: "M30 5 A25 25 0 0 1 55 30", sw: 10 },
                      { color: "#10B981", d: "M55 30 A25 25 0 0 1 30 55", sw: 10 },
                      { color: "#8B5CF6", d: "M30 55 A25 25 0 0 1 5 30", sw: 10 },
                      { color: "#F59E0B", d: "M5 30 A25 25 0 0 1 30 5", sw: 10 },
                    ].map((arc, i) => (
                      <path key={i} d={arc.d} fill="none" stroke={arc.color} strokeWidth={arc.sw} strokeLinecap="butt" opacity={0.85} />
                    ))}
                    <circle cx="30" cy="30" r="14" fill="white" />
                    <text x="30" y="33" textAnchor="middle" style={{ fontSize: 7, fontWeight: 800, fill: "#1E293B" }}>248</text>
                  </svg>
                </div>
              </div>
            )}

            {/* Phone: donut inline */}
            {isPhone && (
              <div className="bg-white rounded border border-slate-100 flex items-center gap-2 overflow-hidden flex-shrink-0" style={{ height: 40, padding: "4px 6px" }}>
                <svg viewBox="0 0 60 60" style={{ width: 32, height: 32, flexShrink: 0 }}>
                  {[
                    { color: "#4F46E5", d: "M30 5 A25 25 0 0 1 55 30" },
                    { color: "#10B981", d: "M55 30 A25 25 0 0 1 30 55" },
                    { color: "#8B5CF6", d: "M30 55 A25 25 0 0 1 5 30" },
                    { color: "#F59E0B", d: "M5 30 A25 25 0 0 1 30 5" },
                  ].map((arc, i) => (
                    <path key={i} d={arc.d} fill="none" stroke={arc.color} strokeWidth={10} strokeLinecap="butt" opacity={0.85} />
                  ))}
                  <circle cx="30" cy="30" r="14" fill="white" />
                  <text x="30" y="33" textAnchor="middle" style={{ fontSize: 7, fontWeight: 800, fill: "#1E293B" }}>248</text>
                </svg>
                <div>
                  <p style={{ fontSize: 5, fontWeight: 700, color: "#475569" }}>Grade Distribution</p>
                  {[{ c: "#4F46E5", l: "G6 · 68" }, { c: "#10B981", l: "G7 · 72" }, { c: "#8B5CF6", l: "G8 · 58" }].map(g => (
                    <div key={g.l} className="flex items-center gap-1">
                      <div className="rounded-full" style={{ width: 4, height: 4, background: g.c }} />
                      <span style={{ fontSize: 4, color: "#64748B" }}>{g.l}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Laptop frame ─────────────────────────────────────────────────────────────
function LaptopFrame() {
  return (
    <div className="relative w-full select-none">
      <div className="rounded-t-xl overflow-hidden shadow-2xl" style={{ background: "#1a1a2e", padding: "8px 8px 0" }}>
        <div className="flex justify-center mb-1">
          <div className="w-1.5 h-1.5 rounded-full bg-slate-600" />
        </div>
        <div className="rounded-t-lg overflow-hidden" style={{ aspectRatio: "16/10" }}>
          <MiniScreen variant="laptop" />
        </div>
      </div>
      <div style={{ background: "#2a2a3e", height: 12, borderRadius: "0 0 4px 4px", position: "relative" }}>
        <div style={{ position: "absolute", left: "50%", transform: "translateX(-50%)", top: 0, width: 60, height: 6, background: "#1a1a2e", borderRadius: "0 0 4px 4px" }} />
      </div>
      <div style={{ width: "55%", height: 8, background: "linear-gradient(180deg,#2a2a3e,#3a3a4e)", borderRadius: "0 0 6px 6px", margin: "0 auto" }} />
      <div style={{ width: "70%", height: 4, background: "#1a1a2e", borderRadius: 99, margin: "1px auto 0" }} />
    </div>
  );
}

// ── Tablet frame ─────────────────────────────────────────────────────────────
function TabletFrame() {
  return (
    <div className="relative select-none mx-auto" style={{ width: 160 }}>
      <div className="rounded-2xl overflow-hidden shadow-xl border-4 border-slate-800" style={{ background: "#1a1a2e" }}>
        {/* Top bar */}
        <div className="flex justify-center py-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-slate-600" />
        </div>
        {/* Screen */}
        <div className="overflow-hidden" style={{ aspectRatio: "3/4" }}>
          <MiniScreen variant="tablet" />
        </div>
        {/* Bottom bar */}
        <div className="flex justify-center py-2">
          <div className="w-8 h-1 rounded-full bg-slate-600" />
        </div>
      </div>
    </div>
  );
}

// ── Phone frame ───────────────────────────────────────────────────────────────
function PhoneFrame() {
  return (
    <div className="relative select-none mx-auto" style={{ width: 120 }}>
      <div className="rounded-[20px] overflow-hidden shadow-xl border-4 border-slate-800" style={{ background: "#1a1a2e" }}>
        {/* Notch */}
        <div className="flex justify-center pt-1.5 pb-1">
          <div className="w-10 h-2 rounded-full bg-slate-900" />
        </div>
        {/* Screen */}
        <div className="overflow-hidden" style={{ aspectRatio: "9/19" }}>
          <MiniScreen variant="phone" />
        </div>
        {/* Home bar */}
        <div className="flex justify-center py-1.5">
          <div className="w-8 h-1 rounded-full bg-slate-600" />
        </div>
      </div>
    </div>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────
export function ResponsiveMockup() {
  return (
    <div className="relative w-full max-w-5xl mx-auto px-2 sm:px-4">
      {/* Mobile: stack vertically, show phone + laptop only */}
      <div className="flex sm:hidden flex-col items-center gap-8">
        <div className="w-full max-w-[320px]">
          <LaptopFrame />
          <p className="text-center text-xs font-semibold text-slate-400 mt-3">Desktop / Laptop</p>
        </div>
        <div className="flex items-end justify-center gap-8">
          <div style={{ marginBottom: 8 }}>
            <TabletFrame />
            <p className="text-center text-xs font-semibold text-slate-400 mt-3">Tablet</p>
          </div>
          <div style={{ marginBottom: 16 }}>
            <PhoneFrame />
            <p className="text-center text-xs font-semibold text-slate-400 mt-3">Mobile</p>
          </div>
        </div>
      </div>

      {/* sm+: all three side by side */}
      <div className="hidden sm:flex items-end justify-center gap-6 lg:gap-10">
        <div className="flex-shrink-0" style={{ marginBottom: 8, zIndex: 2 }}>
          <TabletFrame />
          <p className="text-center text-xs font-semibold text-slate-400 mt-3">Tablet</p>
        </div>
        <div className="flex-1 max-w-[520px]" style={{ zIndex: 1 }}>
          <LaptopFrame />
          <p className="text-center text-xs font-semibold text-slate-400 mt-3">Desktop / Laptop</p>
        </div>
        <div className="flex-shrink-0" style={{ marginBottom: 16, zIndex: 2 }}>
          <PhoneFrame />
          <p className="text-center text-xs font-semibold text-slate-400 mt-3">Mobile</p>
        </div>
      </div>

      <div className="mt-4 mx-auto h-3 rounded-full opacity-10 blur-2xl pointer-events-none" style={{ background: "linear-gradient(90deg,#4F46E5,#8B5CF6,#4F46E5)", maxWidth: 500 }} />
    </div>
  );
}
