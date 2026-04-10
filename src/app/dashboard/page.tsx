"use client";
import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, AreaChart, Area } from "recharts";
import { Users, BookOpen, CheckCircle, ScanLine, Calendar as CalendarIcon, Clock, TrendingUp, MapPin, GraduationCap } from "lucide-react";
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
    <div className="bg-white border border-slate-200 rounded-xl shadow-lg px-4 py-3 text-xs">
      <p className="font-semibold text-slate-500 mb-1">{label}</p>
      <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-primary" /><span className="text-slate-400">Attendance:</span><span className="font-bold text-slate-700">{payload[0].value}</span></div>
    </div>
  );
};

const greetingText = () => {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
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

  if (loading) return (<AppShell title="Dashboard"><div className="space-y-6"><div className="h-16 bg-border/30 rounded-2xl animate-pulse" /><div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">{[...Array(4)].map((_, i) => <CardSkeleton key={i} />)}</div></div></AppShell>);

  return (
    <AppShell title="Dashboard">
      <div className="space-y-6">
        {/* Greeting + Quick Action */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-text">{greetingText()}, {user?.name?.split(" ")[0] ?? "Teacher"}</h1>
            <p className="text-sm text-text-muted mt-0.5">{new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}</p>
          </div>
          <Button onClick={() => router.push("/scanner")} className="hidden sm:flex"><ScanLine className="h-4 w-4" /> Start Scanning</Button>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[
            { label: "Today's Scans", value: dashboard?.todayCount ?? 0, sub: "Attendance marked", color: "text-emerald-600", bg: "bg-emerald-50", iconBg: "from-emerald-500 to-emerald-600", icon: <CheckCircle className="w-5 h-5" /> },
            { label: "Students", value: students?.length ?? 0, sub: "Total enrolled", color: "text-indigo-600", bg: "bg-indigo-50", iconBg: "from-indigo-500 to-indigo-600", icon: <Users className="w-5 h-5" /> },
            { label: "Classes", value: classes?.length ?? 0, sub: "Active classes", color: "text-blue-600", bg: "bg-blue-50", iconBg: "from-blue-500 to-blue-600", icon: <BookOpen className="w-5 h-5" /> },
            { label: "Upcoming", value: upcoming.length, sub: "This week", color: "text-amber-600", bg: "bg-amber-50", iconBg: "from-amber-500 to-orange-500", icon: <CalendarIcon className="w-5 h-5" /> },
          ].map((card, i) => (
            <motion.div key={card.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06, duration: 0.4 }}
              className="bg-bg-card rounded-2xl p-5 border border-border hover:border-border/80 hover:shadow-lg transition-all duration-300 group">
              <div className="flex items-center justify-between mb-4">
                <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${card.iconBg} flex items-center justify-center text-white shadow-sm group-hover:shadow-md group-hover:scale-105 transition-all duration-300`}>{card.icon}</div>
                <TrendingUp className={`w-4 h-4 ${card.color} opacity-40`} />
              </div>
              <p className="text-3xl font-bold text-text tracking-tight">{card.value}</p>
              <p className="text-xs text-text-muted mt-1">{card.label} <span className="text-text-muted/60">/ {card.sub}</span></p>
            </motion.div>
          ))}
        </div>

        {/* Mobile scan button */}
        <Button onClick={() => router.push("/scanner")} className="w-full sm:hidden" size="lg"><ScanLine className="h-5 w-5" /> Start Scanning</Button>

        {/* ROW 1: Chart (3/4) + Recent Attendance (1/4) */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            className="lg:col-span-3 bg-bg-card rounded-2xl border border-border overflow-hidden">
            <div className="px-6 py-4 border-b border-border">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h2 className="font-semibold text-text">Attendance Overview</h2>
                  <p className="text-xs text-text-muted mt-0.5">Daily attendance count</p>
                </div>
                <select value={chartClass} onChange={e => setChartClass(e.target.value)} className="px-3 py-2 rounded-xl border border-border bg-bg text-xs text-text focus:outline-none focus:ring-2 focus:ring-primary/20">
                  <option value="">All Classes</option>
                  {(classes ?? []).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="flex items-center gap-1.5 flex-wrap">
                {["This Week", "Last Week", "This Month", "Last Month"].map(p => (
                  <button key={p} onClick={() => applyPreset(p)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${chartPreset === p ? "text-white bg-primary shadow-sm" : "text-text-muted hover:bg-bg hover:text-text"}`}>{p}</button>
                ))}
                <div className="w-px h-4 bg-border mx-1" />
                <input type="date" value={chartFrom} onChange={e => { setChartFrom(e.target.value); setChartPreset(null); }} className="px-2.5 py-1.5 rounded-lg border border-border bg-bg text-xs text-text focus:outline-none focus:ring-2 focus:ring-primary/20" />
                <span className="text-xs text-text-muted">to</span>
                <input type="date" value={chartTo} onChange={e => { setChartTo(e.target.value); setChartPreset(null); }} className="px-2.5 py-1.5 rounded-lg border border-border bg-bg text-xs text-text focus:outline-none focus:ring-2 focus:ring-primary/20" />
              </div>
            </div>
            <div className="px-4 pt-4 pb-3">
              {chartLoading ? (<div className="h-[240px] flex items-center justify-center text-text-muted text-sm">Loading...</div>
              ) : chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={240}>
                  <AreaChart data={chartData} margin={{ top: 4, right: 12, left: -12, bottom: 0 }}>
                    <defs><linearGradient id="attendGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#4F46E5" stopOpacity={0.12} /><stop offset="100%" stopColor="#4F46E5" stopOpacity={0} /></linearGradient></defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} width={32} allowDecimals={false} />
                    <Tooltip content={<ChartTooltip />} />
                    <Area type="monotone" dataKey="count" stroke="#4F46E5" strokeWidth={2} fill="url(#attendGrad)" dot={{ r: 3, fill: "#4F46E5", strokeWidth: 0 }} activeDot={{ r: 5, fill: "#4F46E5" }} />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (<div className="h-[240px] flex items-center justify-center text-text-muted text-sm">No data for selected range</div>)}
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
            className="bg-bg-card rounded-2xl border border-border overflow-hidden flex flex-col">
            <div className="px-5 py-4 border-b border-border">
              <h2 className="font-semibold text-text text-sm">{"Today's Scans"}</h2>
              <p className="text-xs text-text-muted mt-0.5">{dashboard?.todayCount ?? 0} students</p>
            </div>
            <div className="flex-1 divide-y divide-border overflow-y-auto">
              {(!dashboard?.recentToday || dashboard.recentToday.length === 0) ? (
                <div className="flex flex-col items-center justify-center py-10 text-text-muted"><CheckCircle className="w-8 h-8 opacity-20 mb-2" /><p className="text-xs">No scans yet today</p></div>
              ) : dashboard.recentToday.map(r => (
                <div key={r.id} className="flex items-center gap-3 px-5 py-2.5 hover:bg-bg/50 transition-colors">
                  <div className="w-7 h-7 rounded-full bg-emerald-50 flex items-center justify-center flex-shrink-0"><CheckCircle className="w-3.5 h-3.5 text-emerald-500" /></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-text truncate">{r.studentName}</p>
                    <p className="text-[10px] text-text-muted">{r.className}</p>
                  </div>
                  <span className="text-[10px] text-text-muted tabular-nums">{r.checkInTime ? new Date(r.checkInTime).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }) : ""}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* ROW 2: Week Calendar Preview (full width) */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
          className="bg-bg-card rounded-2xl border border-border overflow-hidden shadow-sm">
          {/* Header */}
          <div className="px-6 py-4 border-b border-border flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-text">Weekly Schedule</h2>
              <p className="text-xs text-text-muted mt-0.5">
                {weekStart.toLocaleDateString("en-US", { month: "long", day: "numeric" })} – {weekEnd.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="hidden sm:flex items-center gap-4 text-[10px]">
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-indigo-500 shadow-[0_0_0_3px_rgba(99,102,241,0.2)]" />Upcoming</span>
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_0_3px_rgba(16,185,129,0.2)]" />Done</span>
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_0_3px_rgba(239,68,68,0.2)]" />Cancelled</span>
              </div>
              <button onClick={() => router.push("/calendar")} className="text-xs font-semibold text-primary hover:text-primary-dark transition">View Full →</button>
            </div>
          </div>

          {/* Day header row */}
          <div className="grid grid-cols-7 border-b border-border bg-gradient-to-r from-slate-50/80 to-gray-50/80">
            {weekDays.map((d) => {
              const ds = toStr(d);
              const isToday = ds === todayStr;
              const isPast = ds < todayStr;
              return (
                <div key={ds} className={`flex flex-col items-center py-3 border-r border-border/40 last:border-r-0 transition-colors ${isToday ? "bg-indigo-50/60" : ""}`}>
                  <span className={`text-[10px] font-bold uppercase tracking-widest ${isToday ? "text-indigo-500" : isPast ? "text-text-muted/40" : "text-text-muted"}`}>
                    {DAYS_SHORT[d.getDay()]}
                  </span>
                  <div className={`mt-1 w-8 h-8 rounded-full flex items-center justify-center ${
                    isToday ? "bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-300/40" : ""
                  }`}>
                    <span className={`text-sm font-bold ${isToday ? "text-white" : isPast ? "text-text-muted/35" : "text-text"}`}>
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
                <div key={ds} className={`border-r border-border/40 last:border-r-0 p-1.5 flex flex-col gap-1.5 h-[280px] ${
                  isToday ? "bg-indigo-50/30" : isPast ? "bg-gray-50/30" : ""
                }`}>
                  {dayEvents.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center opacity-20">
                      <CalendarIcon className="w-5 h-5 text-text-muted mb-1" />
                      <p className="text-[9px] text-text-muted font-medium">Free</p>
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
          <div className="grid grid-cols-7 border-t border-border/60 bg-gradient-to-r from-slate-50/60 to-gray-50/60">
            {weekDays.map((d) => {
              const ds = toStr(d);
              const isToday = ds === todayStr;
              const count = (eventsByDate[ds] ?? []).length;
              return (
                <div key={`f-${ds}`} className="text-center py-1.5 border-r border-border/40 last:border-r-0">
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
        </motion.div>
      </div>
    </AppShell>
  );
}
