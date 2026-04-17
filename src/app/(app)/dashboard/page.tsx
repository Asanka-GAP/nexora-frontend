"use client";
import { useState, useCallback, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Users, BookOpen, CheckCircle, ScanLine, Calendar as CalendarIcon, Clock, MapPin, GraduationCap } from "lucide-react";
import { useAuth } from "@/lib/auth";
import Button from "@/components/ui/Button";
import { useFetch } from "@/hooks/useFetch";
import { getStudents, getClasses, getSchedules, getDashboard, getAttendance, getAcademicYearConfig, getDashboardChartSummary } from "@/services/api";
import DashboardCharts from "@/components/shared/DashboardCharts";
import PageSkeleton from "@/components/ui/PageSkeleton";
import { useTheme } from "@/lib/theme";

const toStr = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const monday = (d: Date) => { const r = new Date(d); r.setDate(r.getDate() - ((r.getDay() + 6) % 7)); return r; };
const sunday = (m: Date) => { const r = new Date(m); r.setDate(r.getDate() + 6); return r; };
const startOfWeek = (d: Date) => { const r = new Date(d); r.setDate(r.getDate() - r.getDay()); return r; };

const DAYS_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const SCHEDULE_STYLES = (dark: boolean): Record<string, { card: string; badge: string; gradient: string }> => ({
  UPCOMING: {
    card: dark
      ? "bg-[#1a2744] border-indigo-500/30 hover:border-indigo-400/50 hover:bg-[#1e2d50] shadow-md"
      : "bg-gradient-to-br from-indigo-50 via-blue-50 to-violet-50 border-indigo-200/60 hover:border-indigo-300 hover:shadow-indigo-100",
    badge: dark ? "bg-indigo-500/25 text-indigo-300" : "bg-indigo-100 text-indigo-700",
    gradient: "from-indigo-500 to-blue-500",
  },
  COMPLETED: {
    card: dark
      ? "bg-[#132a1f] border-emerald-500/30 hover:border-emerald-400/50 hover:bg-[#173325] shadow-md"
      : "bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 border-emerald-200/60 hover:border-emerald-300 hover:shadow-emerald-100",
    badge: dark ? "bg-emerald-500/25 text-emerald-300" : "bg-emerald-100 text-emerald-700",
    gradient: "from-emerald-500 to-teal-500",
  },
  CANCELLED: {
    card: dark
      ? "bg-[#2a1318] border-red-500/30 hover:border-red-400/50 hover:bg-[#331820] shadow-md"
      : "bg-gradient-to-br from-red-50 via-rose-50 to-pink-50 border-red-200/60 hover:border-red-300 hover:shadow-red-100",
    badge: dark ? "bg-red-500/25 text-red-300" : "bg-red-100 text-red-700",
    gradient: "from-red-500 to-rose-500",
  },
});

const formatTime12 = (t: string) => {
  const [h, m] = t.split(":").map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`;
};



export default function DashboardPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { theme } = useTheme();
  const dk = theme === "dark";
  const { data: students, loading: sLoading, refetch: refetchStudents } = useFetch(useCallback(() => getStudents(), []), "dashboard:students");
  const { data: classes, loading: cLoading, refetch: refetchClasses } = useFetch(useCallback(() => getClasses(), []), "dashboard:classes");
  const { data: dashboard, loading: dLoading, refetch: refetchDashboard } = useFetch(useCallback(() => getDashboard(), []), "dashboard:main");
  const { data: academicConfig } = useFetch(useCallback(() => getAcademicYearConfig(), []), "dashboard:academic");
  const { data: chartSummary, loading: chartSummaryLoading } = useFetch(useCallback(() => getDashboardChartSummary(), []), "dashboard:chartSummary");

  // Refetch all data when page becomes visible (e.g. navigating back from classes/students page)
  useEffect(() => {
    const onFocus = () => { refetchStudents(); refetchClasses(); refetchDashboard(); };
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [refetchStudents, refetchClasses, refetchDashboard]);
  const weekStart = useMemo(() => startOfWeek(new Date()), []);
  const weekEnd = useMemo(() => { const e = new Date(weekStart); e.setDate(e.getDate() + 6); return e; }, [weekStart]);
  const weekDays = useMemo(() => Array.from({ length: 7 }, (_, i) => { const d = new Date(weekStart); d.setDate(d.getDate() + i); return d; }), [weekStart]);

  const { data: upcomingSessions } = useFetch(useCallback(() => {
    return getSchedules({ from: toStr(weekStart), to: toStr(weekEnd) });
  }, [weekStart, weekEnd]), "dashboard:sessions");

  const loading = sLoading || cLoading || dLoading;
  const allSessions = upcomingSessions ?? [];
  const upcomingAll = useMemo(() => allSessions.filter(s => s.status === "UPCOMING"), [allSessions]);
  const upcoming = useMemo(() => upcomingAll.slice(0, 6), [upcomingAll]);

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


  const { data: chartRecords, loading: chartLoading } = useFetch(useCallback(() => {
    const p: Record<string, string> = { from: chartFrom, to: chartTo };
    if (chartClass) p.classId = chartClass;
    return getAttendance(p);
  }, [chartFrom, chartTo, chartClass]));

  if (loading && !students && !classes && !dashboard) return <PageSkeleton />;

  return (
      <div className="space-y-6">
        {/* Quick Action */}
        <div className="flex items-center justify-end">
          <Button onClick={() => router.push("/scanner")} className="w-full sm:w-auto"><ScanLine className="h-4 w-4" /> Start Scanning</Button>
        </div>

        {/* Next Grade Upgrade Banner */}
        {academicConfig?.nextUpgradeDate && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
            className={`relative rounded-2xl border p-4 flex items-center gap-4 overflow-hidden ${dk ? "bg-[#2a1f0f] border-amber-500/25" : "bg-gradient-to-r from-amber-50 via-orange-50 to-yellow-50 border-amber-200/60"}`}>
            <div className="absolute right-0 top-0 w-32 h-32 bg-gradient-to-bl from-amber-200/20 to-transparent rounded-full -translate-y-8 translate-x-8" />
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-md flex-shrink-0">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0 relative">
              <p className={`text-[10px] font-bold uppercase tracking-widest ${dk ? "text-amber-400/70" : "text-amber-600/70"}`}>Next Grade Upgrade</p>
              <p className={`text-sm font-bold mt-0.5 ${dk ? "text-amber-100" : "text-slate-800"}`}>
                {new Date(academicConfig.nextUpgradeDate + "T00:00:00").toLocaleDateString("en-US", { weekday: "short", year: "numeric", month: "long", day: "numeric" })}
              </p>
            </div>
            <div className="flex-shrink-0 relative">
              {(() => {
                const days = Math.ceil((new Date(academicConfig.nextUpgradeDate + "T00:00:00").getTime() - new Date().setHours(0,0,0,0)) / 86400000);
                return (
                  <div className={`text-center px-3 py-1.5 rounded-xl border ${dk ? "bg-amber-500/10 border-amber-500/20" : "bg-white/70 border-amber-200/50"}`}>
                    <p className={`text-lg font-bold leading-tight ${dk ? "text-amber-400" : "text-amber-600"}`}>{days <= 0 ? "Due" : days}</p>
                    <p className={`text-[9px] font-semibold ${dk ? "text-amber-400/60" : "text-amber-500/70"}`}>{days <= 0 ? "now" : days === 1 ? "day left" : "days left"}</p>
                  </div>
                );
              })()}
            </div>
          </motion.div>
        )}

        {/* Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[
            { label: "TODAY'S SCANS", value: dashboard?.todayCount ?? 0, sub: `${dashboard?.todayCount ?? 0} attendance marked`, gradient: "from-[#4F46E5] to-[#3730A3]", lightBg: "bg-indigo-50", lightText: "text-indigo-600", accentColor: "#4F46E5", icon: <CheckCircle className="w-5 h-5" />, trend: "+12%", up: true },
            { label: "STUDENTS", value: students?.length ?? 0, sub: "Total enrolled", gradient: "from-emerald-500 to-emerald-600", lightBg: "bg-emerald-50", lightText: "text-emerald-600", accentColor: "#10b981", icon: <Users className="w-5 h-5" />, trend: "+3", up: true },
            { label: "CLASSES", value: classes?.length ?? 0, sub: "Active classes", gradient: "from-violet-500 to-purple-600", lightBg: "bg-violet-50", lightText: "text-violet-600", accentColor: "#8b5cf6", icon: <BookOpen className="w-5 h-5" />, trend: "Stable", up: null },
            { label: "UPCOMING", value: upcomingAll.length, sub: "This week", gradient: "from-amber-500 to-orange-500", lightBg: "bg-amber-50", lightText: "text-amber-600", accentColor: "#f59e0b", icon: <CalendarIcon className="w-5 h-5" />, trend: upcomingAll.length > 0 ? `${upcomingAll.length} sessions` : "None", up: upcomingAll.length > 0 ? true : null },
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



        {/* ROW 1: Charts (Vendora customer-analytics style) */}
        <DashboardCharts
          classes={classes}
          chartSummary={chartSummary}
          chartRecords={chartRecords}
          chartLoading={chartLoading}
          chartSummaryLoading={chartSummaryLoading}
          chartFrom={chartFrom}
          chartTo={chartTo}
          chartClass={chartClass}
          chartPreset={chartPreset}
          setChartFrom={setChartFrom}
          setChartTo={setChartTo}
          setChartClass={setChartClass}
          setChartPreset={setChartPreset}
        />

        {/* ROW 2: Class Overview + Weekly Schedule */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" style={{ gridTemplateRows: "auto" }}>
          {/* Left: Today's Scans */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className={`rounded-2xl shadow-lg border p-6 relative lg:overflow-hidden flex flex-col ${dk ? "bg-[#151E2F] border-[#1E293B]" : "bg-gradient-to-br from-white via-white to-emerald-50/30 border-slate-100/50"}`}>
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-emerald-100/20 to-transparent rounded-full -translate-y-12 translate-x-12" />
            <div className="relative flex flex-col flex-1 min-h-0">
              <div className="flex items-center gap-3 mb-4 flex-shrink-0">
                <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-md">
                  <ScanLine className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-800">Recent Scans</h3>
                  <p className="text-xs text-slate-500">Latest attendance</p>
                </div>
              </div>
              {(dashboard?.todayCount ?? 0) > 0 && (
                <div className={`flex items-center gap-2 mb-4 p-3 rounded-xl border flex-shrink-0 ${dk ? "bg-emerald-500/10 border-emerald-500/20" : "bg-emerald-50/60 border-emerald-100/50"}`}>
                  <span className={`text-2xl font-bold ${dk ? "text-emerald-400" : "text-emerald-700"}`}>{dashboard?.todayCount}</span>
                  <span className={`text-xs ${dk ? "text-emerald-400/70" : "text-emerald-600/70"}`}>students scanned</span>
                </div>
              )}
              <div className="flex-1 overflow-y-auto space-y-2 min-h-0">
                {(!dashboard?.recentToday || dashboard.recentToday.length === 0) ? (
                  <div className="flex flex-col items-center justify-center h-full text-slate-400">
                    <div className="w-16 h-16 bg-gradient-to-br from-emerald-100 to-emerald-200 rounded-full flex items-center justify-center mb-4">
                      <ScanLine className="w-8 h-8 text-emerald-600" />
                    </div>
                    <p className="text-sm font-semibold text-slate-700">No scans yet today</p>
                    <p className="text-xs text-slate-500 mt-0.5">Start scanning to see activity</p>
                  </div>
                ) : (
                  dashboard.recentToday.slice(0, 5).map((r, i) => (
                    <motion.div key={r.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 + i * 0.05 }}
                      className={`backdrop-blur-sm rounded-xl p-3 border hover:shadow-md transition-all duration-300 flex items-center gap-3 ${dk ? "bg-white/5 border-white/10" : "bg-white/60 border-white/50"}`}>
                      <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center flex-shrink-0 shadow-sm">
                        <span className="text-[11px] font-bold text-white">{r.studentName?.charAt(0)?.toUpperCase()}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-slate-800 truncate">{r.studentName}</p>
                        <p className="text-[10px] text-slate-500 truncate">{r.className}</p>
                      </div>
                      {r.checkInTime && (
                        <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-50 flex-shrink-0">
                          <Clock className="w-2.5 h-2.5 text-emerald-500" />
                          <span className="text-[10px] font-semibold text-emerald-700 tabular-nums">
                            {new Date(r.checkInTime).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </div>
                      )}
                    </motion.div>
                  ))
                )}
              </div>
            </div>
          </motion.div>

          {/* Right: Weekly Schedule */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
            className={`lg:col-span-2 rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.06)] border overflow-hidden flex flex-col ${dk ? "bg-[#151E2F] border-[#1E293B]" : "bg-white border-slate-100"}`}>
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
          <div className={`md:hidden ${dk ? "divide-[#1E293B]" : "divide-slate-100"} divide-y`}>
            {weekDays.map((d, idx) => {
              const ds = toStr(d);
              const isToday = ds === todayStr;
              const isPast = ds < todayStr;
              const dayEvents = eventsByDate[ds] ?? [];
              if (isPast && dayEvents.length === 0) return null;
              return (
                <div key={ds} className={`px-4 py-3 ${isToday ? (dk ? "bg-indigo-500/5" : "bg-indigo-50/40") : ""}`}>
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`w-10 h-10 rounded-xl flex flex-col items-center justify-center flex-shrink-0 ${
                      isToday ? "bg-gradient-to-br from-indigo-500 to-purple-600 shadow-md shadow-indigo-300/40" : (dk ? "bg-[#1E293B] border border-[#334155]" : "bg-slate-50 border border-slate-200")
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
                        const st = SCHEDULE_STYLES(dk)[ev.status] ?? SCHEDULE_STYLES(dk).UPCOMING;
                        return (
                          <div key={ev.id} className={`rounded-xl border p-3 ${st.card}`}>
                            <div className="flex items-start justify-between gap-2">
                              <p className="text-xs font-bold text-gray-800 truncate">{ev.className}</p>
                              {ev.grade && <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0 ${st.badge}`}>G{ev.grade}</span>}
                            </div>
                            <div className="flex items-center gap-3 mt-1.5">
                              <div className="flex items-center gap-1">
                                <Clock className={`w-3 h-3 ${dk ? "text-slate-500" : "text-gray-400"}`} />
                                <span className={`text-[11px] font-medium ${dk ? "text-slate-400" : "text-gray-500"}`}>{formatTime12(ev.startTime)} – {formatTime12(ev.endTime)}</span>
                              </div>
                              {ev.location && (
                                <div className="flex items-center gap-1">
                                  <MapPin className={`w-3 h-3 ${dk ? "text-slate-500" : "text-gray-400"}`} />
                                  <span className={`text-[11px] truncate ${dk ? "text-slate-400" : "text-gray-500"}`}>{ev.location}</span>
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
          <div className="hidden md:flex md:flex-col flex-1">
            {/* Day header row */}
            <div className={`grid grid-cols-7 border-b ${dk ? "border-[#1E293B] bg-[#0F172A]/50" : "border-slate-100 bg-slate-50/50"}`}>
              {weekDays.map((d) => {
                const ds = toStr(d);
                const isToday = ds === todayStr;
                const isPast = ds < todayStr;
                return (
                  <div key={ds} className={`flex flex-col items-center py-3 border-r last:border-r-0 transition-colors ${dk ? "border-[#1E293B]/40" : "border-slate-100/40"} ${isToday ? (dk ? "bg-indigo-500/5" : "bg-indigo-50/60") : ""}`}>
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
            {(() => {
              const maxPerDay = Math.max(...weekDays.map(d => (eventsByDate[toStr(d)] ?? []).length), 1);
              const compact = maxPerDay > 4;
              const veryCompact = maxPerDay > 6;
              return (
            <div className="grid grid-cols-7 flex-1">
              {weekDays.map((d, idx) => {
                const ds = toStr(d);
                const isToday = ds === todayStr;
                const isPast = ds < todayStr;
                const dayEvents = eventsByDate[ds] ?? [];
                return (
                  <div key={ds} className={`border-r last:border-r-0 ${dk ? "border-[#1E293B]/40" : "border-slate-100/40"} ${veryCompact ? "p-0.5" : compact ? "p-1" : "p-1.5"} flex flex-col ${veryCompact ? "gap-0.5" : compact ? "gap-1" : "gap-1.5"} ${
                    isToday ? (dk ? "bg-indigo-500/5" : "bg-indigo-50/30") : isPast ? (dk ? "bg-white/[0.01]" : "bg-gray-50/30") : ""
                  }`}>
                    {dayEvents.length === 0 ? (
                      <div className="flex-1 flex flex-col items-center justify-center opacity-20 py-6">
                        <CalendarIcon className="w-5 h-5 text-slate-300 mb-1" />
                        <p className="text-[9px] text-slate-300 font-medium">Free</p>
                      </div>
                    ) : (
                      dayEvents.map((ev, evIdx) => {
                        const st = SCHEDULE_STYLES(dk)[ev.status] ?? SCHEDULE_STYLES(dk).UPCOMING;
                        return (
                          <motion.div
                            key={ev.id}
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.03 + evIdx * 0.04, duration: 0.2 }}
                            className={`w-full text-left rounded-lg border ${veryCompact ? "p-1" : compact ? "p-1.5" : "p-2"} transition-all duration-200 shadow-sm hover:shadow-md hover:-translate-y-0.5 group cursor-default ${st.card}`}
                          >
                            {!veryCompact && <div className={`h-0.5 w-6 rounded-full bg-gradient-to-r ${st.gradient} ${compact ? "mb-0.5" : "mb-1.5"} group-hover:w-10 transition-all duration-300`} />}
                            <p className={`${veryCompact ? "text-[8px]" : "text-[10px]"} font-bold truncate leading-tight ${dk ? "text-slate-200" : "text-gray-800"}`}>{ev.className}</p>
                            <div className={`flex items-center gap-1 ${veryCompact ? "mt-0" : "mt-1"}`}>
                              <Clock className={`${veryCompact ? "w-2 h-2" : "w-2.5 h-2.5"} ${dk ? "text-slate-500" : "text-gray-400"} flex-shrink-0`} />
                              <p className={`${veryCompact ? "text-[7px]" : "text-[9px]"} ${dk ? "text-slate-400" : "text-gray-500"} font-medium truncate`}>
                                {formatTime12(ev.startTime)} – {formatTime12(ev.endTime)}
                              </p>
                            </div>
                            {!veryCompact && ev.location && (
                              <div className="flex items-center gap-1 mt-0.5">
                                <MapPin className={`w-2.5 h-2.5 ${dk ? "text-slate-500" : "text-gray-400"} flex-shrink-0`} />
                                <p className={`text-[9px] ${dk ? "text-slate-400" : "text-gray-500"} truncate`}>{ev.location}</p>
                              </div>
                            )}
                            {!compact && ev.grade && (
                              <span className={`inline-flex items-center gap-0.5 text-[8px] font-bold px-1.5 py-0.5 rounded-full mt-1.5 ${st.badge}`}>
                                <GraduationCap className="w-2 h-2" /> Grade {ev.grade}
                              </span>
                            )}
                          </motion.div>
                        );
                      })
                    )}
                  </div>
                );
              })}
            </div>
              );
            })()}

            {/* Footer summary row */}
            <div className={`grid grid-cols-7 border-t ${dk ? "border-[#1E293B] bg-[#0F172A]/50" : "border-slate-100 bg-slate-50/50"}`}>
              {weekDays.map((d) => {
                const ds = toStr(d);
                const isToday = ds === todayStr;
                const count = (eventsByDate[ds] ?? []).length;
                return (
                  <div key={`f-${ds}`} className={`text-center py-1.5 border-r last:border-r-0 ${dk ? "border-[#1E293B]/40" : "border-slate-100/40"}`}>
                    {count > 0 ? (
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                        isToday ? (dk ? "bg-indigo-500/20 text-indigo-400" : "bg-indigo-100 text-indigo-600") : (dk ? "bg-white/5 text-slate-500" : "bg-gray-100 text-gray-400")
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
      </div>
  );
}
