"use client";
import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, AreaChart, Area } from "recharts";
import { Users, BookOpen, CheckCircle, ScanLine, Calendar as CalendarIcon, Clock, TrendingUp, MapPin, GraduationCap, ChevronDown, Filter, ChevronLeft, ChevronRight, Search, X } from "lucide-react";
import { AnimatePresence } from "framer-motion";
import AppShell from "@/components/layout/AppShell";
import Button from "@/components/ui/Button";
import { useAuth } from "@/lib/auth";
import { CardSkeleton } from "@/components/ui/Skeleton";
import { useFetch } from "@/hooks/useFetch";
import { getStudents, getClasses, getSchedules, getDashboard, getAttendance } from "@/services/api";

const toStr = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const monday = (d: Date) => { const r = new Date(d); r.setDate(r.getDate() - ((r.getDay() + 6) % 7)); return r; };
const sunday = (m: Date) => { const r = new Date(m); r.setDate(r.getDate() + 6); return r; };
const startOfWeek = (d: Date) => { const r = new Date(d); r.setDate(r.getDate() - r.getDay()); return r; };

const DAYS_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const CAL_DAYS = ["Su","Mo","Tu","We","Th","Fr","Sa"];

function DatePicker({ value, onChange, label }: { value: string; onChange: (v: string) => void; label: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const current = new Date(value + "T00:00:00");
  const [viewMonth, setViewMonth] = useState(current.getMonth());
  const [viewYear, setViewYear] = useState(current.getFullYear());

  useEffect(() => {
    if (open) { const d = new Date(value + "T00:00:00"); setViewMonth(d.getMonth()); setViewYear(d.getFullYear()); }
  }, [open, value]);

  useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const prevMonthDays = new Date(viewYear, viewMonth, 0).getDate();
  const cells: { day: number; current: boolean; dateStr: string }[] = [];
  for (let i = firstDay - 1; i >= 0; i--) {
    const d = prevMonthDays - i;
    cells.push({ day: d, current: false, dateStr: toStr(new Date(viewYear, viewMonth - 1, d)) });
  }
  for (let d = 1; d <= daysInMonth; d++) cells.push({ day: d, current: true, dateStr: toStr(new Date(viewYear, viewMonth, d)) });
  const remaining = 42 - cells.length;
  for (let d = 1; d <= remaining; d++) cells.push({ day: d, current: false, dateStr: toStr(new Date(viewYear, viewMonth + 1, d)) });

  const prev = () => { if (viewMonth === 0) { setViewMonth(11); setViewYear(viewYear - 1); } else setViewMonth(viewMonth - 1); };
  const next = () => { if (viewMonth === 11) { setViewMonth(0); setViewYear(viewYear + 1); } else setViewMonth(viewMonth + 1); };

  return (
    <div ref={ref} className="relative">
      <button type="button" onClick={() => setOpen(!open)}
        className={`flex items-center gap-2 pl-3 pr-3.5 py-1.5 rounded-xl border bg-white transition-all cursor-pointer ${
          open ? "border-indigo-400 ring-2 ring-indigo-100" : "border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/30"
        }`}>
        <CalendarIcon className="w-3.5 h-3.5 text-[#4F46E5]" />
        <span className="text-xs font-semibold text-slate-800">{current.toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
      </button>
      {open && (
        <>
        <div className="fixed inset-0 z-40 bg-black/20 sm:hidden" onClick={() => setOpen(false)} />
        <motion.div initial={{ opacity: 0, y: 6, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.15 }}
          className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 sm:absolute sm:top-full sm:left-auto sm:right-0 sm:translate-x-0 sm:translate-y-0 sm:mt-2 z-50 bg-white rounded-2xl border border-slate-100 shadow-xl p-4 w-[280px]">
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-3">{label}</p>
          <div className="flex items-center justify-between mb-3">
            <button type="button" onClick={prev} className="p-1.5 rounded-lg hover:bg-slate-50 transition"><ChevronLeft className="w-4 h-4 text-slate-400" /></button>
            <span className="text-sm font-bold text-slate-800">{MONTH_NAMES[viewMonth]} {viewYear}</span>
            <button type="button" onClick={next} className="p-1.5 rounded-lg hover:bg-slate-50 transition"><ChevronRight className="w-4 h-4 text-slate-400" /></button>
          </div>
          <div className="grid grid-cols-7 mb-1">
            {CAL_DAYS.map(d => <div key={d} className="text-center text-[10px] font-bold text-slate-300 py-1">{d}</div>)}
          </div>
          <div className="grid grid-cols-7 gap-px">
            {cells.map((c, i) => {
              const isSelected = c.dateStr === value;
              const isToday = c.dateStr === toStr(new Date());
              return (
                <button key={i} type="button" onClick={() => { onChange(c.dateStr); setOpen(false); }}
                  className={`h-8 rounded-lg text-xs font-medium transition-all ${
                    isSelected ? "text-white font-bold shadow-sm"
                      : isToday ? "ring-1 ring-indigo-400 text-[#4F46E5] font-bold"
                        : c.current ? "text-slate-700 hover:bg-indigo-50 hover:text-indigo-700" : "text-slate-300"
                  }`}
                  style={isSelected ? { background: "linear-gradient(135deg, #4F46E5, #3730A3)" } : {}}>{c.day}</button>
              );
            })}
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex justify-between">
            <button type="button" onClick={() => { onChange(toStr(new Date())); setOpen(false); }} className="text-[11px] font-semibold text-[#4F46E5] hover:text-[#3730A3] transition">Today</button>
            <button type="button" onClick={() => setOpen(false)} className="text-[11px] font-semibold text-slate-400 hover:text-slate-600 transition">Close</button>
          </div>
        </motion.div>
        </>
      )}
    </div>
  );
}

const SCHEDULE_STYLES: Record<string, { card: string; badge: string; gradient: string }> = {
  UPCOMING: {
    card: "bg-gradient-to-br from-indigo-50 via-blue-50 to-violet-50 border-indigo-200/60 hover:border-indigo-300 hover:shadow-indigo-100",
    badge: "bg-indigo-100 text-indigo-700", gradient: "from-indigo-500 to-blue-500",
  },
  COMPLETED: {
    card: "bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 border-emerald-200/60 hover:border-emerald-300 hover:shadow-emerald-100",
    badge: "bg-emerald-100 text-emerald-700", gradient: "from-emerald-500 to-teal-500",
  },
  CANCELLED: {
    card: "bg-gradient-to-br from-red-50 via-rose-50 to-pink-50 border-red-200/60 hover:border-red-300 hover:shadow-red-100",
    badge: "bg-red-100 text-red-700", gradient: "from-red-500 to-rose-500",
  },
};

const formatTime12 = (t: string) => {
  const [h, m] = t.split(":").map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`;
};

const ChartTooltip = ({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white/95 backdrop-blur-sm border border-slate-100 rounded-xl shadow-xl px-4 py-3 text-xs">
      <p className="font-semibold text-slate-500 mb-1">{label}</p>
      <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-[#4F46E5]" /><span className="text-slate-400">Attendance:</span><span className="font-bold text-slate-700">{payload[0].value}</span></div>
    </div>
  );
};

export default function DashboardPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { data: students, loading: sLoading } = useFetch(useCallback(() => getStudents(), []));
  const { data: classes, loading: cLoading } = useFetch(useCallback(() => getClasses(), []));
  const { data: dashboard, loading: dLoading } = useFetch(useCallback(() => getDashboard(), []));
  const weekStart = useMemo(() => startOfWeek(new Date()), []);
  const weekEnd = useMemo(() => { const e = new Date(weekStart); e.setDate(e.getDate() + 6); return e; }, [weekStart]);
  const weekDays = useMemo(() => Array.from({ length: 7 }, (_, i) => { const d = new Date(weekStart); d.setDate(d.getDate() + i); return d; }), [weekStart]);

  const { data: upcomingSessions } = useFetch(useCallback(() => {
    return getSchedules({ from: toStr(weekStart), to: toStr(weekEnd) });
  }, [weekStart, weekEnd]));

  const loading = sLoading || cLoading || dLoading;
  const allSessions = upcomingSessions ?? [];
  const upcoming = useMemo(() => allSessions.filter(s => s.status === "UPCOMING").slice(0, 6), [allSessions]);

  const eventsByDate = useMemo(() => {
    const map: Record<string, typeof allSessions> = {};
    allSessions.forEach((s) => { (map[s.sessionDate] ??= []).push(s); });
    Object.values(map).forEach((arr) => arr.sort((a, b) => a.startTime.localeCompare(b.startTime)));
    return map;
  }, [allSessions]);
  const todayStr = toStr(new Date());

  const [chartPreset, setChartPreset] = useState<string | null>("This Week");
  const [chartClass, setChartClass] = useState("");
  const [chartFrom, setChartFrom] = useState(toStr(monday(new Date())));
  const [chartTo, setChartTo] = useState(toStr(sunday(monday(new Date()))));
  const [classDropdownOpen, setClassDropdownOpen] = useState(false);
  const [classSearchQuery, setClassSearchQuery] = useState("");

  const { data: chartRecords, loading: chartLoading } = useFetch(useCallback(() => {
    const p: Record<string, string> = { from: chartFrom, to: chartTo };
    if (chartClass) p.classId = chartClass;
    return getAttendance(p);
  }, [chartFrom, chartTo, chartClass]));

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
    <AppShell title="Dashboard">
      <div className="space-y-6">
        {/* Quick Action */}
        <div className="flex items-center justify-end">
          <Button onClick={() => router.push("/scanner")} className="hidden sm:flex"><ScanLine className="h-4 w-4" /> Start Scanning</Button>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[
            { label: "TODAY'S SCANS", value: dashboard?.todayCount ?? 0, sub: `${dashboard?.todayCount ?? 0} attendance marked`, gradient: "from-[#4F46E5] to-[#3730A3]", lightBg: "bg-indigo-50", lightText: "text-indigo-600", accentColor: "#4F46E5", icon: <CheckCircle className="w-5 h-5" />, trend: "+12%", up: true },
            { label: "STUDENTS", value: students?.length ?? 0, sub: "Total enrolled", gradient: "from-emerald-500 to-emerald-600", lightBg: "bg-emerald-50", lightText: "text-emerald-600", accentColor: "#10b981", icon: <Users className="w-5 h-5" />, trend: "+3", up: true },
            { label: "CLASSES", value: classes?.length ?? 0, sub: "Active classes", gradient: "from-violet-500 to-purple-600", lightBg: "bg-violet-50", lightText: "text-violet-600", accentColor: "#8b5cf6", icon: <BookOpen className="w-5 h-5" />, trend: "Stable", up: null },
            { label: "UPCOMING", value: upcoming.length, sub: "This week", gradient: "from-amber-500 to-orange-500", lightBg: "bg-amber-50", lightText: "text-amber-600", accentColor: "#f59e0b", icon: <CalendarIcon className="w-5 h-5" />, trend: upcoming.length > 0 ? `${upcoming.length} sessions` : "None", up: upcoming.length > 0 ? true : null },
          ].map((card, i) => (
            <motion.div key={card.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
              className="relative bg-white rounded-2xl p-5 shadow-[0_2px_12px_rgba(0,0,0,0.06)] border border-slate-100 hover:shadow-[0_4px_20px_rgba(0,0,0,0.1)] transition-all duration-200 overflow-hidden group">
              {/* Decorative background sparkline */}
              <svg className="absolute bottom-0 right-0 w-28 h-16 opacity-[0.06] group-hover:opacity-[0.1] transition-opacity" viewBox="0 0 120 60" fill="none">
                <path d="M0 55 Q20 45 30 35 T60 20 T90 30 T120 10" stroke={card.accentColor} strokeWidth="3" fill="none" />
                <path d="M0 55 Q20 45 30 35 T60 20 T90 30 T120 10 V60 H0 Z" fill={card.accentColor} opacity="0.3" />
              </svg>
              <div className="relative">
                <div className="flex items-start justify-between mb-3">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{card.label}</p>
                  <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${card.gradient} flex items-center justify-center text-white shadow-md`}>
                    {card.icon}
                  </div>
                </div>
                <p className="text-2xl font-bold text-slate-800 leading-tight">{card.value}</p>
                <div className="flex items-center justify-between mt-2">
                  <p className="text-[11px] text-slate-400">{card.sub}</p>
                  {card.trend && (
                    <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded-md ${card.up === true ? "bg-emerald-50" : card.up === false ? "bg-red-50" : "bg-slate-50"}`}>
                      {card.up === true && (
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3 h-3 text-emerald-500">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
                        </svg>
                      )}
                      {card.up === false && (
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3 h-3 text-red-500">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6L9 12.75l4.286-4.286a11.948 11.948 0 014.306 6.43l.776 2.898m0 0l3.182-5.511m-3.182 5.51l-5.511-3.181" />
                        </svg>
                      )}
                      {card.up === null && (
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3 h-3 text-slate-400">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12h15" />
                        </svg>
                      )}
                      <span className={`text-[10px] font-semibold ${card.up === true ? "text-emerald-600" : card.up === false ? "text-red-500" : "text-slate-400"}`}>{card.trend}</span>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Mobile scan button */}
        <Button onClick={() => router.push("/scanner")} className="w-full sm:hidden" size="lg"><ScanLine className="h-5 w-5" /> Start Scanning</Button>

        {/* ROW 1: Chart (3/4) + Recent Attendance (1/4) */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            className="lg:col-span-3 bg-white rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.06)] border border-slate-100 overflow-hidden">
            <div className="bg-gradient-to-r from-[#4F46E5] to-[#3730A3] px-6 py-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="font-semibold text-white">Attendance Overview</h2>
                  <p className="text-xs text-indigo-200/70 mt-0.5">Daily attendance count</p>
                </div>
                <div className="relative">
                  <button type="button" onClick={() => { setClassDropdownOpen(!classDropdownOpen); setClassSearchQuery(""); }}
                    className={`flex items-center gap-2 pl-3 pr-3.5 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer min-w-[160px] ${
                      classDropdownOpen ? "bg-white/25 ring-2 ring-white/20" : "bg-white/15 hover:bg-white/25"
                    }`}>
                    <Filter className="w-3.5 h-3.5 text-white/60 flex-shrink-0" />
                    <span className={`flex-1 text-left truncate ${chartClass ? "text-white font-semibold" : "text-white/70"}`}>
                      {chartClass ? (classes ?? []).find(c => c.id === chartClass)?.name ?? "All Classes" : "All Classes"}
                    </span>
                    {chartClass ? (
                      <button type="button" onClick={e => { e.stopPropagation(); setChartClass(""); }} className="p-0.5 rounded-full hover:bg-white/20 transition"><X className="w-3 h-3 text-white/70" /></button>
                    ) : (
                      <ChevronDown className={`w-3.5 h-3.5 text-white/50 transition-transform ${classDropdownOpen ? "rotate-180" : ""}`} />
                    )}
                  </button>
                  <AnimatePresence>
                    {classDropdownOpen && (<>
                      <div className="fixed inset-0 z-30" onClick={() => setClassDropdownOpen(false)} />
                      <motion.div initial={{ opacity: 0, y: -6, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -6, scale: 0.97 }} transition={{ duration: 0.15 }}
                        className="absolute right-0 top-full mt-1.5 z-40 bg-white rounded-xl border border-slate-100 shadow-xl overflow-hidden min-w-[220px]">
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
              <div className="flex items-center gap-2 flex-wrap">
                {["This Week", "Last Week", "This Month", "Last Month"].map(p => (
                  <button key={p} onClick={() => applyPreset(p)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                      chartPreset === p
                        ? "text-indigo-700 bg-white shadow-sm"
                        : "text-white/70 bg-white/10 hover:bg-white/20 hover:text-white"
                    }`}>{p}</button>
                ))}
                <div className="w-px h-5 bg-white/20 mx-1 hidden sm:block" />
                <div className="flex items-center gap-2">
                  <div className="hidden sm:contents">
                    <DatePicker value={chartFrom} onChange={v => { setChartFrom(v); setChartPreset(null); }} label="From" />
                    <div className="w-4 h-px bg-white/30" />
                    <DatePicker value={chartTo} onChange={v => { setChartTo(v); setChartPreset(null); }} label="To" />
                  </div>
                  <div className="flex sm:hidden items-center gap-2">
                    <input type="date" value={chartFrom} onChange={e => { setChartFrom(e.target.value); setChartPreset(null); }}
                      className="px-2.5 py-1.5 rounded-xl bg-white/15 text-white text-xs font-medium border-0 outline-none [color-scheme:dark] w-[115px]" />
                    <div className="w-3 h-px bg-white/30" />
                    <input type="date" value={chartTo} onChange={e => { setChartTo(e.target.value); setChartPreset(null); }}
                      className="px-2.5 py-1.5 rounded-xl bg-white/15 text-white text-xs font-medium border-0 outline-none [color-scheme:dark] w-[115px]" />
                  </div>
                </div>
              </div>
            </div>
            <div className="px-2 pt-4 pb-2">
              {chartLoading ? (<div className="h-[240px] flex items-center justify-center text-slate-400 text-sm">Loading...</div>
              ) : chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={240}>
                  <AreaChart data={chartData} margin={{ top: 4, right: 12, left: -12, bottom: 0 }}>
                    <defs><linearGradient id="attendGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#4F46E5" stopOpacity={0.15} /><stop offset="100%" stopColor="#4F46E5" stopOpacity={0} /></linearGradient></defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} width={32} allowDecimals={false} />
                    <Tooltip content={<ChartTooltip />} />
                    <Area type="monotone" dataKey="count" stroke="#4F46E5" strokeWidth={2.5} fill="url(#attendGrad)" dot={{ r: 4, fill: "#4F46E5", strokeWidth: 0 }} activeDot={{ r: 6, fill: "#4F46E5" }} />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (<div className="h-[240px] flex items-center justify-center text-slate-400 text-sm">No data for selected range</div>)}
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
            className="bg-white rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.06)] border border-slate-100 overflow-hidden flex flex-col">
            <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-5 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-semibold text-white text-sm">{"Today's Scans"}</h2>
                  <p className="text-emerald-100/70 text-xs mt-0.5">Live attendance feed</p>
                </div>
                <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center">
                  <ScanLine className="w-4 h-4 text-white" />
                </div>
              </div>
              {(dashboard?.todayCount ?? 0) > 0 && (
                <div className="mt-3 flex items-center gap-2">
                  <span className="text-2xl font-bold text-white">{dashboard?.todayCount}</span>
                  <span className="text-xs text-emerald-100/70">students scanned</span>
                </div>
              )}
            </div>
            <div className="flex-1 overflow-y-auto">
              {(!dashboard?.recentToday || dashboard.recentToday.length === 0) ? (
                <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center mb-3">
                    <ScanLine className="w-6 h-6 text-emerald-300" />
                  </div>
                  <p className="text-xs font-medium">No scans yet today</p>
                  <p className="text-[10px] text-slate-300 mt-0.5">Start scanning to see activity</p>
                </div>
              ) : dashboard.recentToday.slice(0, 5).map((r, i) => (
                <motion.div key={r.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 + i * 0.05 }}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-emerald-50/40 transition-colors border-b border-slate-50 last:border-b-0 group">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center flex-shrink-0 shadow-sm">
                    <span className="text-[11px] font-bold text-white">{r.studentName?.charAt(0)?.toUpperCase()}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-slate-700 truncate">{r.studentName}</p>
                    <p className="text-[10px] text-slate-400 truncate">{r.className}</p>
                  </div>
                  {r.checkInTime && (
                    <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-50 flex-shrink-0">
                      <Clock className="w-2.5 h-2.5 text-emerald-500" />
                      <span className="text-[10px] font-semibold text-emerald-700 tabular-nums">{new Date(r.checkInTime).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}</span>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* ROW 2: Week Calendar Preview (full width) */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
          className="bg-white rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.06)] border border-slate-100 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-indigo-600 to-violet-600 px-6 py-4 flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-white">Weekly Schedule</h2>
              <p className="text-xs text-indigo-100/70 mt-0.5">
                {weekStart.toLocaleDateString("en-US", { month: "long", day: "numeric" })} – {weekEnd.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="hidden sm:flex items-center gap-4 text-[10px]">
                <span className="flex items-center gap-1.5 text-white/70"><span className="w-2 h-2 rounded-full bg-white/80 shadow-[0_0_0_3px_rgba(255,255,255,0.2)]" />Upcoming</span>
                <span className="flex items-center gap-1.5 text-white/70"><span className="w-2 h-2 rounded-full bg-emerald-300 shadow-[0_0_0_3px_rgba(16,185,129,0.2)]" />Done</span>
                <span className="flex items-center gap-1.5 text-white/70"><span className="w-2 h-2 rounded-full bg-red-300 shadow-[0_0_0_3px_rgba(239,68,68,0.2)]" />Cancelled</span>
              </div>
              <button onClick={() => router.push("/calendar")} className="text-xs font-semibold text-white/80 hover:text-white transition bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg">View Full →</button>
            </div>
          </div>

          {/* Mobile: stacked list view */}
          <div className="md:hidden divide-y divide-slate-100">
            {weekDays.map((d, idx) => {
              const ds = toStr(d);
              const isToday = ds === todayStr;
              const isPast = ds < todayStr;
              const dayEvents = eventsByDate[ds] ?? [];
              if (isPast && dayEvents.length === 0) return null;
              return (
                <div key={ds} className={`px-4 py-3 ${isToday ? "bg-indigo-50/40" : ""}`}>
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`w-10 h-10 rounded-xl flex flex-col items-center justify-center flex-shrink-0 ${
                      isToday ? "bg-gradient-to-br from-indigo-500 to-purple-600 shadow-md shadow-indigo-300/40" : "bg-slate-50 border border-slate-200"
                    }`}>
                      <span className={`text-[9px] font-bold uppercase leading-none ${isToday ? "text-white/80" : "text-slate-400"}`}>{DAYS_SHORT[d.getDay()]}</span>
                      <span className={`text-sm font-bold leading-tight ${isToday ? "text-white" : isPast ? "text-slate-300" : "text-slate-700"}`}>{d.getDate()}</span>
                    </div>
                    <div className="flex-1">
                      <span className={`text-xs font-semibold ${isToday ? "text-indigo-600" : "text-slate-700"}`}>
                        {d.toLocaleDateString("en-US", { weekday: "long" })}
                      </span>
                      <span className="text-[10px] text-slate-400 ml-2">{dayEvents.length ? `${dayEvents.length} class${dayEvents.length !== 1 ? "es" : ""}` : "Free"}</span>
                    </div>
                  </div>
                  {dayEvents.length > 0 && (
                    <div className="flex flex-col gap-2 ml-[52px]">
                      {dayEvents.map((ev) => {
                        const st = SCHEDULE_STYLES[ev.status] ?? SCHEDULE_STYLES.UPCOMING;
                        return (
                          <div key={ev.id} className={`rounded-xl border p-3 ${st.card}`}>
                            <div className="flex items-start justify-between gap-2">
                              <p className="text-xs font-bold text-gray-800 truncate">{ev.className}</p>
                              {ev.grade && <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0 ${st.badge}`}>G{ev.grade}</span>}
                            </div>
                            <div className="flex items-center gap-3 mt-1.5">
                              <div className="flex items-center gap-1">
                                <Clock className="w-3 h-3 text-gray-400" />
                                <span className="text-[11px] text-gray-500 font-medium">{formatTime12(ev.startTime)} – {formatTime12(ev.endTime)}</span>
                              </div>
                              {ev.location && (
                                <div className="flex items-center gap-1">
                                  <MapPin className="w-3 h-3 text-gray-400" />
                                  <span className="text-[11px] text-gray-500 truncate">{ev.location}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Desktop: 7-column grid view */}
          <div className="hidden md:block">
            {/* Day header row */}
            <div className="grid grid-cols-7 border-b border-slate-100 bg-slate-50/50">
              {weekDays.map((d) => {
                const ds = toStr(d);
                const isToday = ds === todayStr;
                const isPast = ds < todayStr;
                return (
                  <div key={ds} className={`flex flex-col items-center py-3 border-r border-slate-100/40 last:border-r-0 transition-colors ${isToday ? "bg-indigo-50/60" : ""}`}>
                    <span className={`text-[10px] font-bold uppercase tracking-widest ${isToday ? "text-indigo-500" : isPast ? "text-slate-300" : "text-slate-400"}`}>
                      {DAYS_SHORT[d.getDay()]}
                    </span>
                    <div className={`mt-1 w-8 h-8 rounded-full flex items-center justify-center ${
                      isToday ? "bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-300/40" : ""
                    }`}>
                      <span className={`text-sm font-bold ${isToday ? "text-white" : isPast ? "text-slate-300" : "text-slate-700"}`}>
                        {d.getDate()}
                      </span>
                    </div>
                    {isToday && <div className="w-1 h-1 rounded-full bg-indigo-400 mt-1 animate-pulse" />}
                  </div>
                );
              })}
            </div>

            {/* Events body */}
            <div className="grid grid-cols-7">
              {weekDays.map((d, idx) => {
                const ds = toStr(d);
                const isToday = ds === todayStr;
                const isPast = ds < todayStr;
                const dayEvents = eventsByDate[ds] ?? [];
                return (
                  <div key={ds} className={`border-r border-slate-100/40 last:border-r-0 p-1.5 flex flex-col gap-1.5 h-[280px] ${
                    isToday ? "bg-indigo-50/30" : isPast ? "bg-gray-50/30" : ""
                  }`}>
                    {dayEvents.length === 0 ? (
                      <div className="flex-1 flex flex-col items-center justify-center opacity-20">
                        <CalendarIcon className="w-5 h-5 text-slate-300 mb-1" />
                        <p className="text-[9px] text-slate-300 font-medium">Free</p>
                      </div>
                    ) : (
                      dayEvents.slice(0, 4).map((ev, evIdx) => {
                        const st = SCHEDULE_STYLES[ev.status] ?? SCHEDULE_STYLES.UPCOMING;
                        return (
                          <motion.div
                            key={ev.id}
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.03 + evIdx * 0.04, duration: 0.2 }}
                            className={`w-full text-left rounded-lg border p-2 transition-all duration-200 shadow-sm hover:shadow-md hover:-translate-y-0.5 group cursor-default ${st.card}`}
                          >
                            <div className={`h-0.5 w-6 rounded-full bg-gradient-to-r ${st.gradient} mb-1.5 group-hover:w-10 transition-all duration-300`} />
                            <p className="text-[10px] font-bold truncate leading-tight text-gray-800">{ev.className}</p>
                            <div className="flex items-center gap-1 mt-1">
                              <Clock className="w-2.5 h-2.5 text-gray-400 flex-shrink-0" />
                              <p className="text-[9px] text-gray-500 font-medium truncate">
                                {formatTime12(ev.startTime)} – {formatTime12(ev.endTime)}
                              </p>
                            </div>
                            {ev.location && (
                              <div className="flex items-center gap-1 mt-0.5">
                                <MapPin className="w-2.5 h-2.5 text-gray-400 flex-shrink-0" />
                                <p className="text-[9px] text-gray-500 truncate">{ev.location}</p>
                              </div>
                            )}
                            {ev.grade && (
                              <span className={`inline-flex items-center gap-0.5 text-[8px] font-bold px-1.5 py-0.5 rounded-full mt-1.5 ${st.badge}`}>
                                <GraduationCap className="w-2 h-2" /> Grade {ev.grade}
                              </span>
                            )}
                          </motion.div>
                        );
                      })
                    )}
                    {dayEvents.length > 4 && (
                      <p className="text-[9px] text-indigo-500 font-bold text-center">+{dayEvents.length - 4} more</p>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Footer summary row */}
            <div className="grid grid-cols-7 border-t border-slate-100 bg-slate-50/50">
              {weekDays.map((d) => {
                const ds = toStr(d);
                const isToday = ds === todayStr;
                const count = (eventsByDate[ds] ?? []).length;
                return (
                  <div key={`f-${ds}`} className="text-center py-1.5 border-r border-slate-100/40 last:border-r-0">
                    {count > 0 ? (
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                        isToday ? "bg-indigo-100 text-indigo-600" : "bg-gray-100 text-gray-400"
                      }`}>
                        {count} class{count !== 1 ? "es" : ""}
                      </span>
                    ) : (
                      <span className="text-[9px] text-gray-300 font-medium">—</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </motion.div>
      </div>
    </AppShell>
  );
}
