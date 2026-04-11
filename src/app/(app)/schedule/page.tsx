"use client";
import { useState, useCallback, useEffect } from "react";
import { toast } from "sonner";
import { Calendar, XCircle, RotateCcw, CheckCircle, Clock, BarChart3, AlertTriangle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useFetch } from "@/hooks/useFetch";
import { getSchedules, cancelSchedule, reactivateSchedule } from "@/services/api";
import type { Schedule } from "@/lib/types";
import PageSkeleton from "@/components/ui/PageSkeleton";

type StatusFilter = "ALL" | "UPCOMING" | "COMPLETED" | "CANCELLED";
const STATUSES: { id: StatusFilter; label: string }[] = [
  { id: "ALL", label: "All" }, { id: "UPCOMING", label: "Upcoming" },
  { id: "COMPLETED", label: "Completed" }, { id: "CANCELLED", label: "Cancelled" },
];
const PAGE_SIZE = 10;

const toStr = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const monday = (d: Date) => { const r = new Date(d); r.setDate(r.getDate() - ((r.getDay() + 6) % 7)); return r; };
const sunday = (m: Date) => { const r = new Date(m); r.setDate(r.getDate() + 6); return r; };

const PRESETS = [
  { label: "This Week", from: () => toStr(monday(new Date())), to: () => toStr(sunday(monday(new Date()))) },
  { label: "Last Week", from: () => { const m = monday(new Date()); m.setDate(m.getDate() - 7); return toStr(m); }, to: () => { const m = monday(new Date()); m.setDate(m.getDate() - 1); return toStr(m); } },
  { label: "Next Week", from: () => { const m = monday(new Date()); m.setDate(m.getDate() + 7); return toStr(m); }, to: () => { const m = monday(new Date()); m.setDate(m.getDate() + 13); return toStr(m); } },
  { label: "This Month", from: () => { const d = new Date(); d.setDate(1); return toStr(d); }, to: () => { const d = new Date(); d.setMonth(d.getMonth() + 1, 0); return toStr(d); } },
  { label: "Last Month", from: () => { const d = new Date(); d.setMonth(d.getMonth() - 1, 1); return toStr(d); }, to: () => { const d = new Date(); d.setDate(0); return toStr(d); } },
  { label: "Next Month", from: () => { const d = new Date(); d.setMonth(d.getMonth() + 1, 1); return toStr(d); }, to: () => { const d = new Date(); d.setMonth(d.getMonth() + 2, 0); return toStr(d); } },
];

const statusBadge = (s: string) => s === "UPCOMING" ? "bg-primary/15 text-primary-dark" : s === "COMPLETED" ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700";
const accentColor = (s: string) => s === "UPCOMING" ? "bg-primary" : s === "COMPLETED" ? "bg-success" : "bg-danger";
const formatDate = (s: string) => s ? new Date(s + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "";
const getActivePreset = (f: string, t: string) => PRESETS.find(p => p.from() === f && p.to() === t)?.label ?? null;

export default function SchedulePage() {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [dateFrom, setDateFrom] = useState(PRESETS[0].from());
  const [dateTo, setDateTo] = useState(PRESETS[0].to());
  const [dateOpen, setDateOpen] = useState(false);

  const fetchSessions = useCallback(() => getSchedules({
    status: statusFilter === "ALL" ? undefined : statusFilter, from: dateFrom, to: dateTo,
  }), [statusFilter, dateFrom, dateTo]);
  const { data: sessions, loading, refetch } = useFetch(fetchSessions);

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [cancelTarget, setCancelTarget] = useState<Schedule | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelling, setCancelling] = useState(false);
  const [reactivateTarget, setReactivateTarget] = useState<Schedule | null>(null);
  const [reactivateNote, setReactivateNote] = useState("");
  const [reactivating, setReactivating] = useState(false);

  useEffect(() => { setPage(1); }, [statusFilter, dateFrom, dateTo, search]);

  const all = sessions ?? [];
  const counts = { ALL: all.length, UPCOMING: all.filter(s => s.status === "UPCOMING").length, COMPLETED: all.filter(s => s.status === "COMPLETED").length, CANCELLED: all.filter(s => s.status === "CANCELLED").length };

  const filtered = all.filter(s => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return s.className.toLowerCase().includes(q) || (s.location?.toLowerCase().includes(q));
  });

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const activePreset = getActivePreset(dateFrom, dateTo);
  const dateLabel = activePreset || `${formatDate(dateFrom)} — ${formatDate(dateTo)}`;

  // Stat cards always show current month data
  const monthFrom = (() => { const d = new Date(); d.setDate(1); return toStr(d); })();
  const monthTo = (() => { const d = new Date(); d.setMonth(d.getMonth() + 1, 0); return toStr(d); })();
  const fetchMonthStats = useCallback(() => getSchedules({ from: monthFrom, to: monthTo }), [monthFrom, monthTo]);
  const { data: monthSessions, refetch: refetchStats } = useFetch(fetchMonthStats);
  const monthAll = monthSessions ?? [];
  const monthCounts = { ALL: monthAll.length, UPCOMING: monthAll.filter(s => s.status === "UPCOMING").length, COMPLETED: monthAll.filter(s => s.status === "COMPLETED").length, CANCELLED: monthAll.filter(s => s.status === "CANCELLED").length };
  const currentMonthName = new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" });

  const canReactivate = (s: Schedule) => {
    if (s.status !== "CANCELLED") return false;
    const now = new Date();
    const sessionEnd = new Date(s.sessionDate + "T" + s.endTime);
    return sessionEnd > now;
  };

  const handleReactivate = async () => {
    if (!reactivateTarget) return;
    setReactivating(true);
    try { await reactivateSchedule(reactivateTarget.id, reactivateNote || undefined); toast.success("Session reactivated"); setReactivateTarget(null); setReactivateNote(""); refetch(); refetchStats(); }
    catch (err: unknown) { toast.error((err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Failed to reactivate"); }
    finally { setReactivating(false); }
  };

  const handleCancel = async () => {
    if (!cancelTarget) return;
    setCancelling(true);
    try { await cancelSchedule(cancelTarget.id, cancelReason || undefined); toast.success("Session cancelled"); setCancelTarget(null); setCancelReason(""); refetch(); refetchStats(); }
    catch (err: unknown) { toast.error((err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Failed to cancel"); }
    finally { setCancelling(false); }
  };

  const pageNums = Array.from({ length: totalPages }, (_, i) => i + 1)
    .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
    .reduce<(number | string)[]>((acc, p, idx, arr) => { if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push("..."); acc.push(p); return acc; }, []);

  if (loading && !sessions) return <PageSkeleton />;

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div><h2 className="text-lg font-semibold text-text">Class Schedule</h2><p className="text-xs text-text-muted mt-0.5">{counts.UPCOMING} upcoming · {counts.COMPLETED} completed · {counts.CANCELLED} cancelled</p></div>
      </div>

      {/* Stat Cards */}
      {monthSessions && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[
            { label: "TOTAL SESSIONS", value: monthCounts.ALL, sub: currentMonthName, gradient: "from-[#4F46E5] to-[#3730A3]", accentColor: "#4F46E5", icon: <BarChart3 className="w-5 h-5" />, trend: null, up: null },
            { label: "COMPLETED", value: monthCounts.COMPLETED, sub: `${monthCounts.ALL > 0 ? Math.round((monthCounts.COMPLETED / monthCounts.ALL) * 100) : 0}% of total`, gradient: "from-emerald-500 to-emerald-600", accentColor: "#10b981", icon: <CheckCircle className="w-5 h-5" />, trend: monthCounts.COMPLETED > 0 ? `${monthCounts.COMPLETED} done` : null, up: monthCounts.COMPLETED > 0 ? true : null },
            { label: "UPCOMING", value: monthCounts.UPCOMING, sub: monthCounts.UPCOMING === 1 ? "1 class remaining" : `${monthCounts.UPCOMING} classes remaining`, gradient: "from-violet-500 to-purple-600", accentColor: "#8b5cf6", icon: <Clock className="w-5 h-5" />, trend: monthCounts.UPCOMING > 0 ? `${monthCounts.UPCOMING} left` : null, up: monthCounts.UPCOMING > 0 ? true : null },
            { label: "CANCELLED", value: monthCounts.CANCELLED, sub: monthCounts.CANCELLED > 0 ? `${Math.round((monthCounts.CANCELLED / monthCounts.ALL) * 100)}% cancellation rate` : "No cancellations", gradient: "from-red-500 to-red-600", accentColor: "#ef4444", icon: <AlertTriangle className="w-5 h-5" />, trend: monthCounts.CANCELLED > 0 ? `${monthCounts.CANCELLED} cancelled` : "Clean", up: monthCounts.CANCELLED > 0 ? false : true },
          ].map((card, i) => (
            <motion.div key={card.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
              className="relative bg-white rounded-2xl p-5 shadow-[0_2px_12px_rgba(0,0,0,0.06)] border border-slate-100 hover:shadow-[0_4px_20px_rgba(0,0,0,0.1)] transition-all duration-200 overflow-hidden group">
              <svg className="absolute bottom-0 right-0 w-28 h-16 opacity-[0.06] group-hover:opacity-[0.10] transition-opacity" viewBox="0 0 120 60" fill="none">
                <path d="M0 55 Q20 45 30 35 T60 20 T90 30 T120 10" stroke={card.accentColor} strokeWidth="3" fill="none" />
                <path d="M0 55 Q20 45 30 35 T60 20 T90 30 T120 10 V60 H0 Z" fill={card.accentColor} opacity="0.3" />
              </svg>
              <div className="relative">
                <div className="flex items-start justify-between mb-3">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{card.label}</p>
                  <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${card.gradient} flex items-center justify-center text-white shadow-md`}>{card.icon}</div>
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
                      <span className={`text-[10px] font-semibold ${card.up === true ? "text-emerald-600" : card.up === false ? "text-red-500" : "text-slate-400"}`}>{card.trend}</span>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="bg-bg-card rounded-2xl shadow-sm border border-border p-4 mb-6 space-y-3">
        {/* Search + Date picker */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by class name, location..." className="w-full pl-10 pr-4 py-2.5 border border-border rounded-xl text-sm text-text bg-bg-card placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
          </div>
          {/* Date range button */}
          <div className="relative">
            <button onClick={() => setDateOpen(!dateOpen)} className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all whitespace-nowrap ${activePreset ? "border-primary/30 bg-primary/5 text-primary shadow-sm" : "border-border text-text-muted hover:border-border hover:bg-bg"}`}>
              <Calendar className={`w-4 h-4 ${activePreset ? "text-primary" : "text-text-muted"}`} />
              <span className="text-xs">{dateLabel}</span>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={`w-3.5 h-3.5 text-text-muted transition-transform duration-200 ${dateOpen ? "rotate-180" : ""}`}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" /></svg>
            </button>
            <AnimatePresence>
              {dateOpen && (<>
                <div className="fixed inset-0 z-30" onClick={() => setDateOpen(false)} />
                <motion.div initial={{ opacity: 0, y: -6, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -6, scale: 0.97 }} transition={{ duration: 0.15 }}
                  className="fixed inset-x-4 top-1/2 -translate-y-1/2 sm:absolute sm:inset-x-auto sm:top-full sm:right-0 sm:translate-y-0 sm:mt-2 z-40 bg-bg-card rounded-2xl border border-border shadow-xl sm:w-[400px] overflow-hidden">
                  <div className="p-4 border-b border-border">
                    <p className="text-xs font-bold text-text-muted uppercase tracking-widest mb-3 px-1">Quick Select</p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {PRESETS.map(p => (<button key={p.label} onClick={() => { setDateFrom(p.from()); setDateTo(p.to()); }}
                        className={`px-3 py-2.5 rounded-[10px] text-sm font-semibold transition-all ${activePreset === p.label ? "text-white shadow-sm" : "bg-bg text-text-muted hover:text-slate-700"}`} style={activePreset === p.label ? { background: "linear-gradient(135deg, #4F46E5, #3730A3)" } : {}}>{p.label}</button>))}
                    </div>
                  </div>
                  <div className="p-4 space-y-3">
                    <p className="text-xs font-bold text-text-muted uppercase tracking-widest px-1">Custom Range</p>
                    <div className="grid grid-cols-2 gap-3">
                      <div><label className="text-xs font-semibold text-text-muted mb-1.5 block">From</label><input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="w-full px-3 py-2.5 rounded-xl border border-border text-sm text-text bg-bg focus:outline-none focus:ring-2 focus:ring-primary/20" /></div>
                      <div><label className="text-xs font-semibold text-text-muted mb-1.5 block">To</label><input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="w-full px-3 py-2.5 rounded-xl border border-border text-sm text-text bg-bg focus:outline-none focus:ring-2 focus:ring-primary/20" /></div>
                    </div>
                    <div className="flex items-center justify-between bg-primary/5 rounded-xl px-4 py-2.5">
                      <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-primary animate-pulse" /><span className="text-xs font-semibold text-primary">{formatDate(dateFrom)} → {formatDate(dateTo)}</span></div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 p-4 border-t border-border bg-bg/40">
                    <button onClick={() => { setDateFrom(PRESETS[0].from()); setDateTo(PRESETS[0].to()); setDateOpen(false); }} className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-text-muted bg-bg-card border border-border hover:bg-bg transition-all">Reset</button>
                    <button onClick={() => setDateOpen(false)} className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white bg-primary transition-all hover:shadow-md">Apply</button>
                  </div>
                </motion.div>
              </>)}
            </AnimatePresence>
          </div>
        </div>
        {/* Status tabs */}
        <div className="flex items-center bg-slate-100/80 rounded-xl p-0.5">
          {STATUSES.map(s => {
            const colors: Record<string, string> = { ALL: "linear-gradient(135deg, #4F46E5, #3730A3)", UPCOMING: "linear-gradient(135deg, #8B5CF6, #7C3AED)", COMPLETED: "linear-gradient(135deg, #10B981, #059669)", CANCELLED: "linear-gradient(135deg, #EF4444, #DC2626)" };
            return (<button key={s.id} onClick={() => setStatusFilter(s.id)} className={`flex-1 px-2 sm:px-3.5 py-1.5 rounded-[10px] text-[10px] sm:text-xs font-semibold transition-all truncate ${statusFilter === s.id ? "text-white shadow-sm" : "text-slate-500 hover:text-slate-700"}`} style={statusFilter === s.id ? { background: colors[s.id] } : {}}><span className="hidden sm:inline">{s.label} ({counts[s.id]})</span><span className="sm:hidden">{s.id === "ALL" ? "All" : s.label.slice(0, 4)} {counts[s.id]}</span></button>);
          })}
        </div>
      </div>

      {/* Table */}
      {!filtered.length && !loading ? (
        <div className="bg-bg-card rounded-2xl shadow-sm border border-border p-12 text-center">
          <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-primary/10 flex items-center justify-center"><Calendar className="w-7 h-7 text-primary/40" /></div>
          <p className="text-sm font-medium text-text-muted">No sessions found</p>
          <p className="text-xs text-text-muted mt-1">Add schedules to your classes to see sessions here</p>
        </div>
      ) : (
        <div className="bg-bg-card rounded-2xl shadow-sm border border-border overflow-hidden">
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full">
              <thead><tr className="border-b border-border">{["Date", "Class", "Grade", "Time", "Status", ""].map(h => (<th key={h} className="text-left px-5 py-3.5 text-xs font-semibold text-text-muted uppercase tracking-wider">{h}</th>))}</tr></thead>
              <tbody>
                {paginated.map(s => (
                  <tr key={s.id} className="border-b border-border/50 hover:bg-bg/50 transition-colors">
                    <td className="px-5 py-3.5 text-sm font-medium text-text">{new Date(s.sessionDate).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}</td>
                    <td className="px-5 py-3.5">
                      <p className="text-sm text-text">{s.className}</p>
                      {s.location && <p className="text-xs text-text-muted truncate max-w-[200px]">{s.location}</p>}
                    </td>
                    <td className="px-5 py-3.5"><span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-secondary/15 text-cyan-800">Grade {s.grade}</span></td>
                    <td className="px-5 py-3.5 text-sm text-text-muted">{s.startTime.slice(0, 5)} – {s.endTime.slice(0, 5)}</td>

                    <td className="px-5 py-3.5"><span className={`text-xs font-semibold px-2.5 py-1 rounded-lg ${statusBadge(s.status)}`}>{s.status}</span></td>
                    <td className="px-5 py-3.5">
                      {s.status === "UPCOMING" && (<button onClick={() => setCancelTarget(s)} className="p-1.5 rounded-lg text-text-muted hover:text-danger hover:bg-danger/10 transition-all" title="Cancel"><XCircle className="w-4 h-4" /></button>)}
                      {canReactivate(s) && (<button onClick={() => setReactivateTarget(s)} className="p-1.5 rounded-lg text-text-muted hover:text-success hover:bg-success/10 transition-all" title="Reactivate"><RotateCcw className="w-4 h-4" /></button>)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="lg:hidden">
            {paginated.map((s, i) => (
              <div key={s.id} className={`p-4 ${i % 2 === 0 ? "bg-bg-card" : "bg-bg/60"} ${i < paginated.length - 1 ? "border-b-2 border-border/80" : ""}`}>
                <div className="flex gap-3">
                  <div className={`w-1 rounded-full flex-shrink-0 ${accentColor(s.status)}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div><p className="font-semibold text-text text-sm truncate">{s.className}</p><p className="text-[10px] text-text-muted">{new Date(s.sessionDate).toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}</p>{s.location && <p className="text-[10px] text-text-muted truncate">{s.location}</p>}</div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${statusBadge(s.status)}`}>{s.status}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 mb-2">
                      <div className="bg-bg rounded-lg px-2.5 py-2"><p className="text-[9px] font-semibold text-text-muted uppercase">Grade</p><p className="text-xs font-medium text-text mt-0.5">{s.grade}</p></div>
                      <div className="bg-bg rounded-lg px-2.5 py-2"><p className="text-[9px] font-semibold text-text-muted uppercase">Time</p><p className="text-xs font-medium text-text mt-0.5">{s.startTime.slice(0, 5)} – {s.endTime.slice(0, 5)}</p></div>
                    </div>
                    {s.status === "UPCOMING" && (<button onClick={() => setCancelTarget(s)} className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium text-danger bg-danger/10 hover:bg-danger/20 transition-all"><XCircle className="w-3.5 h-3.5" />Cancel</button>)}
                    {canReactivate(s) && (<button onClick={() => setReactivateTarget(s)} className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium text-success bg-success/10 hover:bg-success/20 transition-all"><RotateCcw className="w-3.5 h-3.5" />Reactivate</button>)}
                  </div>
                </div>
              </div>
            ))}
          </div>
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-5 py-3 border-t border-border bg-bg/40">
              <p className="text-xs text-text-muted">Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}</p>
              <div className="flex items-center gap-1">
                <button onClick={() => setPage(1)} disabled={page === 1} className="px-2 py-1 text-xs rounded-md text-text-muted hover:bg-border/50 disabled:opacity-30 transition">«</button>
                <button onClick={() => setPage(page - 1)} disabled={page === 1} className="px-2 py-1 text-xs rounded-md text-text-muted hover:bg-border/50 disabled:opacity-30 transition">‹</button>
                {pageNums.map((item, idx) => typeof item === "string" ? <span key={`d${idx}`} className="px-1 text-xs text-text-muted">…</span> : <button key={item} onClick={() => setPage(item)} className={`min-w-[28px] py-1 text-xs rounded-md font-semibold transition ${page === item ? "text-white shadow-sm bg-primary" : "text-text-muted hover:bg-border/50"}`}>{item}</button>)}
                <button onClick={() => setPage(page + 1)} disabled={page === totalPages} className="px-2 py-1 text-xs rounded-md text-text-muted hover:bg-border/50 disabled:opacity-30 transition">›</button>
                <button onClick={() => setPage(totalPages)} disabled={page === totalPages} className="px-2 py-1 text-xs rounded-md text-text-muted hover:bg-border/50 disabled:opacity-30 transition">»</button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Cancel Modal */}
      {cancelTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setCancelTarget(null)} />
          <div className="relative z-10 bg-bg-card rounded-2xl shadow-2xl w-full max-w-sm p-6 border border-border">
            <div className="w-12 h-12 rounded-2xl bg-danger/10 flex items-center justify-center mx-auto mb-4"><XCircle className="w-6 h-6 text-danger" /></div>
            <h3 className="text-base font-semibold text-text text-center">Cancel Session</h3>
            <p className="text-sm text-text-muted text-center mt-1">{cancelTarget.className} — {new Date(cancelTarget.sessionDate).toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}</p>
            <div className="mt-4"><label className="block text-sm font-medium text-text mb-1">Reason (optional)</label><input value={cancelReason} onChange={e => setCancelReason(e.target.value)} placeholder="e.g. Teacher unavailable" className="w-full rounded-xl border border-border bg-bg-card px-4 py-2.5 text-sm text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/50" /></div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => { setCancelTarget(null); setCancelReason(""); }} className="flex-1 h-10 rounded-xl border border-border text-sm font-semibold text-text hover:bg-bg transition-all">Keep</button>
              <button onClick={handleCancel} disabled={cancelling} className="flex-1 h-10 rounded-xl text-sm font-semibold text-white bg-danger hover:bg-danger/90 transition-all disabled:opacity-60">{cancelling ? "Cancelling..." : "Cancel Session"}</button>
            </div>
          </div>
        </div>
      )}

      {/* Reactivate Modal */}
      {reactivateTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setReactivateTarget(null)} />
          <div className="relative z-10 bg-bg-card rounded-2xl shadow-2xl w-full max-w-sm p-6 border border-border">
            <div className="w-12 h-12 rounded-2xl bg-success/10 flex items-center justify-center mx-auto mb-4"><RotateCcw className="w-6 h-6 text-success" /></div>
            <h3 className="text-base font-semibold text-text text-center">Reactivate Session</h3>
            <p className="text-sm text-text-muted text-center mt-1">{reactivateTarget.className} — {new Date(reactivateTarget.sessionDate).toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}</p>
            <div className="mt-4"><label className="block text-sm font-medium text-text mb-1">Note (optional)</label><input value={reactivateNote} onChange={e => setReactivateNote(e.target.value)} placeholder="e.g. Rescheduled, teacher available" className="w-full rounded-xl border border-border bg-bg-card px-4 py-2.5 text-sm text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/50" /></div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => { setReactivateTarget(null); setReactivateNote(""); }} className="flex-1 h-10 rounded-xl border border-border text-sm font-semibold text-text hover:bg-bg transition-all">Cancel</button>
              <button onClick={handleReactivate} disabled={reactivating} className="flex-1 h-10 rounded-xl text-sm font-semibold text-white bg-success hover:bg-success/90 transition-all disabled:opacity-60">{reactivating ? "Reactivating..." : "Reactivate"}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
