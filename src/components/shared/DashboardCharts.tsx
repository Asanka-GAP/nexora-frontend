"use client";
import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip,
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
} from "recharts";
import {
  BookOpen, Filter, ChevronDown,
  Search, X,
} from "lucide-react";
import DatePicker from "@/components/shared/DatePicker";
import { useTheme } from "@/lib/theme";

const toStr = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const monday = (d: Date) => { const r = new Date(d); r.setDate(r.getDate() - ((r.getDay() + 6) % 7)); return r; };
const sunday = (m: Date) => { const r = new Date(m); r.setDate(r.getDate() + 6); return r; };

const ChartTooltip = ({ active, payload, label, dark }: { active?: boolean; payload?: { value: number }[]; label?: string; dark?: boolean }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className={`backdrop-blur-sm rounded-2xl shadow-xl px-4 py-3 text-xs border ${dark ? "bg-[#1E293B]/95 border-[#334155]" : "bg-white/95 border-transparent"}`}>
      <p className={`font-semibold mb-1 ${dark ? "text-slate-300" : "text-slate-500"}`}>{label}</p>
      <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-[#4F46E5]" /><span className="text-slate-400">Attendance:</span><span className={`font-bold ${dark ? "text-white" : "text-slate-700"}`}>{payload[0].value}</span></div>
    </div>
  );
};

const GRADE_COLORS = [
  { start: "#4F46E5", end: "#3730A3" },
  { start: "#3B82F6", end: "#2563EB" },
  { start: "#8B5CF6", end: "#7C3AED" },
  { start: "#10B981", end: "#059669" },
  { start: "#F59E0B", end: "#D97706" },
  { start: "#EF4444", end: "#DC2626" },
  { start: "#EC4899", end: "#DB2777" },
  { start: "#06B6D4", end: "#0891B2" },
];

const BarTooltip = ({ active, payload, dark }: { active?: boolean; payload?: { value: number; payload: { name: string } }[]; dark?: boolean }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className={`backdrop-blur-sm rounded-2xl shadow-xl px-4 py-3 text-xs border ${dark ? "bg-[#1E293B]/95 border-[#334155]" : "bg-white/95 border-transparent"}`}>
      <p className={`font-bold mb-1 ${dark ? "text-white" : "text-slate-700"}`}>{payload[0].payload.name}</p>
      <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-[#4F46E5]" /><span className="text-slate-400">Students:</span><span className={`font-bold ${dark ? "text-white" : "text-slate-700"}`}>{payload[0].value}</span></div>
    </div>
  );
};

interface DashboardChartsProps {
  classes: { id: string; name: string; grade?: number; studentCount?: number }[] | null;
  chartSummary: { classOverview: { name: string; fullName: string; students: number }[]; gradeDistribution: { grade: string; gradeNum: number; count: number }[]; totalStudents: number } | null;
  chartRecords: { date: string }[] | null;
  chartLoading: boolean;
  chartSummaryLoading: boolean;
  chartFrom: string;
  chartTo: string;
  chartClass: string;
  chartPreset: string | null;
  setChartFrom: (v: string) => void;
  setChartTo: (v: string) => void;
  setChartClass: (v: string) => void;
  setChartPreset: (v: string | null) => void;
}

export default function DashboardCharts({
  classes, chartSummary, chartRecords, chartLoading, chartSummaryLoading,
  chartFrom, chartTo, chartClass, chartPreset,
  setChartFrom, setChartTo, setChartClass, setChartPreset,
}: DashboardChartsProps) {
  const [classDropdownOpen, setClassDropdownOpen] = useState(false);
  const [classSearchQuery, setClassSearchQuery] = useState("");
  const { theme } = useTheme();
  const dk = theme === "dark";
  const grid = dk ? "#334155" : "#E2E8F0";
  const tick = dk ? "#94A3B8" : "#64748B";
  const dotBg = dk ? "#151E2F" : "#ffffff";

  const barData = chartSummary?.classOverview ?? [];
  const gradeData = chartSummary?.gradeDistribution ?? [];
  const totalStudents = chartSummary?.totalStudents ?? 0;

  const chartData = useMemo(() => {
    if (!chartRecords) return [];
    const map: Record<string, number> = {};
    for (let d = new Date(chartFrom + "T00:00:00"); d <= new Date(chartTo + "T00:00:00"); d.setDate(d.getDate() + 1)) map[toStr(d)] = 0;
    chartRecords.forEach(r => { map[r.date] = (map[r.date] ?? 0) + 1; });
    return Object.entries(map).map(([date, count]) => ({ date: new Date(date + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" }), count }));
  }, [chartRecords, chartFrom, chartTo]);

  const applyPreset = (p: string) => {
    const now = new Date();
    if (p === "This Week") { setChartFrom(toStr(monday(now))); setChartTo(toStr(sunday(monday(now)))); }
    else if (p === "Last Week") { const m = monday(now); m.setDate(m.getDate() - 7); const s = new Date(m); s.setDate(s.getDate() + 6); setChartFrom(toStr(m)); setChartTo(toStr(s)); }
    else if (p === "This Month") { setChartFrom(toStr(new Date(now.getFullYear(), now.getMonth(), 1))); setChartTo(toStr(new Date(now.getFullYear(), now.getMonth() + 1, 0))); }
    else { setChartFrom(toStr(new Date(now.getFullYear(), now.getMonth() - 1, 1))); setChartTo(toStr(new Date(now.getFullYear(), now.getMonth(), 0))); }
    setChartPreset(p);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Attendance Overview */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className={`rounded-2xl shadow-lg border p-6 relative overflow-visible flex flex-col ${dk ? "bg-[#151E2F] border-[#1E293B]" : "bg-gradient-to-br from-white via-white to-indigo-50/30 border-slate-100/50"}`}>
        <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-indigo-100/20 to-transparent rounded-full -translate-y-12 translate-x-12" />
        <div className="relative flex flex-col flex-1">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-[#4F46E5] to-[#3730A3] rounded-xl flex items-center justify-center shadow-md">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-5 h-5 text-white"><path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" /></svg>
              </div>
              <div><h3 className="text-lg font-bold text-slate-800">Attendance Overview</h3><p className="text-xs text-slate-500">Daily attendance count</p></div>
            </div>
            <div className="relative">
              <button type="button" onClick={() => { setClassDropdownOpen(!classDropdownOpen); setClassSearchQuery(""); }}
                className={`flex items-center gap-2 pl-3 pr-3.5 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer min-w-[140px] border ${classDropdownOpen ? "border-indigo-400 ring-2 ring-indigo-100" : "border-slate-200 hover:border-indigo-300"} ${dk ? "bg-[#0F172A]" : "bg-white"}`}>
                <Filter className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                <span className={`flex-1 text-left truncate ${chartClass ? "text-slate-800 font-semibold" : "text-slate-500"}`}>
                  {chartClass ? (classes ?? []).find(c => c.id === chartClass)?.name ?? "All Classes" : "All Classes"}
                </span>
                {chartClass ? (
                  <span role="button" tabIndex={0} onClick={e => { e.stopPropagation(); setChartClass(""); }} onKeyDown={e => { if (e.key === "Enter") { e.stopPropagation(); setChartClass(""); } }} className="p-0.5 rounded-full hover:bg-slate-100 transition cursor-pointer outline-none"><X className="w-3 h-3 text-slate-400" /></span>
                ) : (
                  <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${classDropdownOpen ? "rotate-180" : ""}`} />
                )}
              </button>
              <AnimatePresence>
                {classDropdownOpen && (<>
                  <div className="fixed inset-0 z-30" onClick={() => setClassDropdownOpen(false)} />
                  <motion.div initial={{ opacity: 0, y: -6, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -6, scale: 0.97 }} transition={{ duration: 0.15 }}
                    className={`absolute right-0 top-full mt-1.5 z-40 rounded-xl border shadow-xl overflow-hidden min-w-[220px] ${dk ? "bg-[#1E293B] border-[#334155]" : "bg-white border-slate-100"}`}>
                    <div className="p-2 border-b border-slate-100">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                        <input value={classSearchQuery} onChange={e => setClassSearchQuery(e.target.value)} placeholder="Search classes..." autoFocus
                          className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 bg-white text-xs text-slate-700 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20" />
                      </div>
                    </div>
                    <div className="max-h-[200px] overflow-y-auto p-1.5">
                      <button type="button" onClick={() => { setChartClass(""); setClassDropdownOpen(false); }}
                        className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left text-xs font-medium transition-all ${!chartClass ? "bg-indigo-50 text-[#4F46E5] font-semibold" : "text-slate-600 hover:bg-slate-50"}`}>
                        <BookOpen className="w-3.5 h-3.5 opacity-40" /> All Classes
                      </button>
                      {(() => {
                        const filtered = (classes ?? []).filter(c => !classSearchQuery.trim() || c.name.toLowerCase().includes(classSearchQuery.toLowerCase()));
                        return filtered.length === 0 ? (
                          <p className="text-xs text-slate-400 text-center py-4">No classes found</p>
                        ) : filtered.map(c => (
                          <button type="button" key={c.id} onClick={() => { setChartClass(c.id); setClassDropdownOpen(false); }}
                            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left text-xs font-medium transition-all ${chartClass === c.id ? "bg-indigo-50 text-[#4F46E5] font-semibold" : "text-slate-600 hover:bg-slate-50"}`}>
                            <BookOpen className="w-3.5 h-3.5 opacity-40" />
                            <span className="flex-1 truncate">{c.name}</span>
                            {c.grade && <span className="text-[10px] text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded-md">G{c.grade}</span>}
                          </button>
                        ));
                      })()}
                    </div>
                  </motion.div>
                </>)}
              </AnimatePresence>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap mb-4">
            <div className="flex items-center gap-2 flex-wrap">
              {["This Week", "Last Week", "This Month", "Last Month"].map(p => (
                <button key={p} onClick={() => applyPreset(p)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${chartPreset === p ? "text-white shadow-md" : "bg-slate-50 text-slate-600 hover:bg-slate-100"}`}
                  style={chartPreset === p ? { background: "linear-gradient(135deg, #4F46E5, #3730A3)" } : {}}>
                  {p}
                </button>
              ))}
            </div>
            <div className="w-px h-5 bg-slate-200 mx-1 hidden sm:block" />
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <DatePicker value={chartFrom} onChange={v => { setChartFrom(v); setChartPreset(null); }} label="From" />
              <div className="w-4 h-px bg-slate-300" />
              <DatePicker value={chartTo} onChange={v => { setChartTo(v); setChartPreset(null); }} label="To" />
            </div>
          </div>
          <div className="flex-1 min-h-[192px] [&_svg]:outline-none [&_.recharts-wrapper]:outline-none">
            {chartLoading ? (
              <div className="h-full flex items-center justify-center text-slate-400 text-sm">Loading...</div>
            ) : chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 4, right: 12, left: -12, bottom: 0 }}>
                  <defs>
                    <linearGradient id="attendGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#4F46E5" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#4F46E5" stopOpacity={0.05} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={grid} strokeOpacity={0.5} />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: tick, fontWeight: "500" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: tick, fontWeight: "500" }} axisLine={false} tickLine={false} width={32} allowDecimals={false} />
                  <Tooltip content={<ChartTooltip dark={dk} />} />
                  <Area type="monotone" dataKey="count" stroke="#4F46E5" strokeWidth={3} fill="url(#attendGrad)"
                    dot={{ r: 5, fill: "#4F46E5", strokeWidth: 3, stroke: dotBg }}
                    activeDot={{ r: 7, stroke: "#4F46E5", strokeWidth: 3, fill: dotBg }} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 text-sm">No data for selected range</div>
            )}
          </div>
        </div>
      </motion.div>

      {/* Class Overview */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className={`rounded-2xl shadow-lg border p-6 relative overflow-hidden ${dk ? "bg-[#151E2F] border-[#1E293B]" : "bg-gradient-to-br from-white via-white to-violet-50/30 border-slate-100/50"}`}>
        <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-violet-100/20 to-transparent rounded-full -translate-y-12 translate-x-12" />
        <div className="relative space-y-6">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center shadow-md">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-5 h-5 text-white"><path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" /></svg>
              </div>
              <div><h3 className="text-lg font-bold text-slate-800">Class Overview</h3><p className="text-xs text-slate-500">Students per class</p></div>
            </div>
            {chartSummaryLoading ? (
              <div className="h-48 flex items-center justify-center text-slate-400 text-sm">Loading...</div>
            ) : barData.length > 0 ? (
              <div className="h-48 [&_svg]:outline-none [&_.recharts-wrapper]:outline-none">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }} barCategoryGap="20%">
                    <defs>
                      <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#8B5CF6" stopOpacity={1} />
                        <stop offset="100%" stopColor="#4F46E5" stopOpacity={0.8} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={grid} strokeOpacity={0.5} vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: tick, fontWeight: "500" }} axisLine={false} tickLine={false} interval={0} angle={-20} textAnchor="end" height={40} />
                    <YAxis tick={{ fontSize: 10, fill: tick, fontWeight: "500" }} axisLine={false} tickLine={false} width={36} allowDecimals={false} />
                    <Tooltip content={<BarTooltip dark={dk} />} cursor={{ fill: dk ? "rgba(139,92,246,0.1)" : "rgba(139,92,246,0.06)" }} />
                    <Bar dataKey="students" fill="url(#barGrad)" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-48 flex items-center justify-center text-slate-400 text-sm">No classes yet</div>
            )}
          </div>
          <div className={`border-t ${dk ? "border-[#1E293B]" : "border-slate-100"}`} />
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-md">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-5 h-5 text-white"><path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 7.74-3.342" /></svg>
              </div>
              <div><h3 className="text-lg font-bold text-slate-800">Grade Distribution</h3><p className="text-xs text-slate-500">Students across grades</p></div>
            </div>
            {chartSummaryLoading ? (
              <div className="h-40 flex items-center justify-center text-slate-400 text-sm">Loading...</div>
            ) : gradeData.length > 0 ? (
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <div className="h-40 w-40 flex-shrink-0 relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <defs>
                        {gradeData.map((_, i) => (
                          <linearGradient key={i} id={`gradeGrad-${i}`} x1="0" y1="0" x2="1" y2="1">
                            <stop offset="0%" stopColor={GRADE_COLORS[i % GRADE_COLORS.length].start} />
                            <stop offset="100%" stopColor={GRADE_COLORS[i % GRADE_COLORS.length].end} />
                          </linearGradient>
                        ))}
                      </defs>
                      <Pie data={gradeData} cx="50%" cy="50%" innerRadius={42} outerRadius={68} paddingAngle={3} dataKey="count">
                        {gradeData.map((_, i) => (
                          <Cell key={i} fill={`url(#gradeGrad-${i})`} stroke={dotBg} strokeWidth={3} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ backgroundColor: dk ? "rgba(30,41,59,0.95)" : "rgba(255,255,255,0.95)", border: "none", borderRadius: "16px", boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)", fontSize: "14px", fontWeight: "600", color: dk ? "#E2E8F0" : "#1E293B" }}
                        formatter={(value: any, _: any, props: any) => [`${value} students`, props.payload.grade]}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="text-center">
                      <div className="text-xl font-bold text-slate-800">{totalStudents}</div>
                      <div className="text-[9px] text-slate-500 font-medium">Total</div>
                    </div>
                  </div>
                </div>
                <div className="w-full sm:flex-1 grid grid-cols-2 gap-1.5">
                  {gradeData.map((item, i) => (
                    <div key={item.grade} className={`flex items-center gap-2 p-2 rounded-lg backdrop-blur-sm ${dk ? "bg-white/5" : "bg-white/60"}`}>
                      <div className="w-2.5 h-2.5 rounded-full shadow-sm flex-shrink-0"
                        style={{ background: `linear-gradient(135deg, ${GRADE_COLORS[i % GRADE_COLORS.length].start}, ${GRADE_COLORS[i % GRADE_COLORS.length].end})` }} />
                      <div className="min-w-0">
                        <div className="text-[11px] font-semibold text-slate-700 truncate"><span className="hidden sm:inline">{item.grade}</span><span className="sm:hidden">G{String(item.gradeNum).padStart(2, "0")}</span></div>
                        <div className="text-[10px] text-slate-500">{item.count} students</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="h-40 flex items-center justify-center text-slate-400 text-sm">No student data</div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
