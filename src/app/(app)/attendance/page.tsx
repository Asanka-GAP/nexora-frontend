"use client";
import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ScanLine, CheckCircle, Calendar, Users, Clock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import Button from "@/components/ui/Button";
import DatePicker from "@/components/shared/DatePicker";
import { useFetch } from "@/hooks/useFetch";
import { getAttendance, getTodayAttendanceCount, getClasses } from "@/services/api";
import type { AttendanceRecord, ClassItem } from "@/lib/types";
import PageSkeleton from "@/components/ui/PageSkeleton";

const PAGE_SIZE = 10;
const toStr = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const monday = (d: Date) => { const r = new Date(d); r.setDate(r.getDate() - ((r.getDay() + 6) % 7)); return r; };
const sunday = (m: Date) => { const r = new Date(m); r.setDate(r.getDate() + 6); return r; };

const PRESETS = [
  { label: "Today", from: () => toStr(new Date()), to: () => toStr(new Date()) },
  { label: "This Week", from: () => toStr(monday(new Date())), to: () => toStr(sunday(monday(new Date()))) },
  { label: "Last Week", from: () => { const m = monday(new Date()); m.setDate(m.getDate() - 7); return toStr(m); }, to: () => { const m = monday(new Date()); m.setDate(m.getDate() - 1); return toStr(m); } },
  { label: "This Month", from: () => { const d = new Date(); d.setDate(1); return toStr(d); }, to: () => { const d = new Date(); d.setMonth(d.getMonth() + 1, 0); return toStr(d); } },
  { label: "Last Month", from: () => { const d = new Date(); d.setMonth(d.getMonth() - 1, 1); return toStr(d); }, to: () => { const d = new Date(); d.setDate(0); return toStr(d); } },
];

const formatDate = (s: string) => s ? new Date(s + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "";
const getActivePreset = (f: string, t: string) => PRESETS.find(p => p.from() === f && p.to() === t)?.label ?? null;

export default function AttendancePage() {
  const router = useRouter();
  const [dateFrom, setDateFrom] = useState(PRESETS[0].from());
  const [dateTo, setDateTo] = useState(PRESETS[0].to());
  const [classFilter, setClassFilter] = useState("");
  const [classOpen, setClassOpen] = useState(false);
  const [classSearch, setClassSearch] = useState("");
  const [dateOpen, setDateOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState(""); // "" = All, "PRESENT", "ABSENT"
  const [page, setPage] = useState(1);

  const fetchRecords = useCallback(() => getAttendance({
    classId: classFilter || undefined, from: dateFrom, to: dateTo,
  }), [classFilter, dateFrom, dateTo]);
  const { data: records, loading } = useFetch(fetchRecords);

  const fetchClasses = useCallback(() => getClasses(), []);
  const { data: classes } = useFetch(fetchClasses);

  const fetchTodayCount = useCallback(() => getTodayAttendanceCount(), []);
  const { data: todayCount } = useFetch(fetchTodayCount);

  useEffect(() => { setPage(1); }, [dateFrom, dateTo, classFilter, search, statusFilter]);

  const all = records ?? [];
  const filtered = all.filter(r => {
    // Search filter
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchesSearch = r.studentName.toLowerCase().includes(q) || 
                           r.studentCode.toLowerCase().includes(q) || 
                           (r.className ?? "").toLowerCase().includes(q);
      if (!matchesSearch) return false;
    }
    
    // Status filter
    if (statusFilter && r.status !== statusFilter) {
      return false;
    }
    
    return true;
  });

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const activePreset = getActivePreset(dateFrom, dateTo);
  const dateLabel = activePreset || `${formatDate(dateFrom)} — ${formatDate(dateTo)}`;

  const uniqueStudents = new Set(filtered.map(r => r.studentId)).size;
  const uniqueClasses = new Set(filtered.map(r => r.classId)).size;
  const presentCount = filtered.filter(r => r.status === "PRESENT").length;
  const absentCount = filtered.filter(r => r.status === "ABSENT").length;

  const pageNums = Array.from({ length: totalPages }, (_, i) => i + 1)
    .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
    .reduce<(number | string)[]>((acc, p, idx, arr) => { if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push("..."); acc.push(p); return acc; }, []);

  if (loading && !records) return <PageSkeleton />;

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div><h2 className="text-lg font-semibold text-text">Attendance</h2><p className="text-xs text-text-muted mt-0.5">Scan QR codes to mark attendance automatically</p></div>
        <Button onClick={() => router.push("/scanner")}><ScanLine className="h-4 w-4" /> Open Scanner</Button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: "TODAY", value: todayCount ?? 0, sub: "Scans today", gradient: "from-[#4F46E5] to-[#3730A3]", accentColor: "#4F46E5", icon: <CheckCircle className="w-5 h-5" />, trend: "+12%", up: true },
          { label: "PRESENT", value: presentCount, sub: statusFilter ? "Filtered results" : "In selected range", gradient: "from-emerald-500 to-emerald-600", accentColor: "#10b981", icon: <CheckCircle className="w-5 h-5" />, trend: null, up: null },
          { label: "ABSENT", value: absentCount, sub: statusFilter ? "Filtered results" : "In selected range", gradient: "from-red-500 to-red-600", accentColor: "#ef4444", icon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>, trend: null, up: null },
          { label: "STUDENTS", value: uniqueStudents, sub: "Unique students", gradient: "from-violet-500 to-purple-600", accentColor: "#8b5cf6", icon: <Users className="w-5 h-5" />, trend: null, up: null },
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
                  <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded-md ${card.up ? "bg-emerald-50" : "bg-slate-50"}`}>
                    {card.up && <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3 h-3 text-emerald-500"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" /></svg>}
                    <span className={`text-[10px] font-semibold ${card.up ? "text-emerald-600" : "text-slate-400"}`}>{card.trend}</span>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-bg-card rounded-2xl shadow-sm border border-border p-4 mb-6 space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by student name, code, class..." className="w-full pl-10 pr-4 py-2.5 border border-border rounded-xl text-sm text-text bg-bg-card placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
          </div>
          {/* Class filter */}
          <div className="relative w-full sm:w-auto">
            <button onClick={() => setClassOpen(!classOpen)} className={`w-full sm:w-auto flex items-center justify-center sm:justify-start gap-2.5 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all whitespace-nowrap ${classFilter ? "border-primary/30 bg-primary/5 text-primary shadow-sm" : "border-border text-text-muted hover:bg-bg"}`}>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className={`w-4 h-4 ${classFilter ? "text-primary" : "text-text-muted"}`}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" /></svg>
              <span className="text-xs">{classFilter ? (classes ?? []).find(c => c.id === classFilter)?.name ?? "Class" : "All Classes"}</span>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={`w-3.5 h-3.5 text-text-muted transition-transform ${classOpen ? "rotate-180" : ""}`}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" /></svg>
            </button>
            <AnimatePresence>
              {classOpen && (<>
                <div className="fixed inset-0 z-30" onClick={() => { setClassOpen(false); setClassSearch(""); }} />
                <motion.div initial={{ opacity: 0, y: -6, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -6, scale: 0.97 }} transition={{ duration: 0.15 }}
                  className="absolute left-0 sm:left-auto sm:right-0 top-full mt-2 z-40 bg-bg-card rounded-2xl border border-border shadow-xl w-[calc(100vw-3.5rem)] sm:w-[260px] overflow-hidden">
                  <div className="p-2 border-b border-border">
                    <div className="relative">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>
                      <input value={classSearch} onChange={e => setClassSearch(e.target.value)} placeholder="Search classes..." autoFocus
                        className="w-full pl-9 pr-3 py-2 rounded-lg border border-border bg-bg text-sm text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/20" />
                    </div>
                  </div>
                  <div className="p-2 max-h-[240px] overflow-y-auto">
                    <button onClick={() => { setClassFilter(""); setClassOpen(false); setClassSearch(""); }}
                      className={`w-full text-left px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${!classFilter ? "text-white bg-primary shadow-sm" : "text-text hover:bg-bg"}`}>All Classes</button>
                    {(classes ?? []).filter(c => !classSearch.trim() || c.name.toLowerCase().includes(classSearch.toLowerCase())).map(c => (
                      <button key={c.id} onClick={() => { setClassFilter(c.id); setClassOpen(false); setClassSearch(""); }}
                        className={`w-full text-left px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${classFilter === c.id ? "text-white bg-primary shadow-sm" : "text-text hover:bg-bg"}`}>
                        <span className="truncate block">{c.name}</span>
                        {c.grade && <span className={`text-[10px] ${classFilter === c.id ? "text-white/70" : "text-text-muted"}`}>Grade {c.grade}</span>}
                      </button>
                    ))}
                    {(classes ?? []).filter(c => !classSearch.trim() || c.name.toLowerCase().includes(classSearch.toLowerCase())).length === 0 && (
                      <p className="text-sm text-text-muted text-center py-4">No classes found</p>
                    )}
                  </div>
                </motion.div>
              </>)}
            </AnimatePresence>
          </div>
          {/* Status filter - Segment buttons */}
          <div className="flex rounded-xl border border-border bg-bg p-1 w-full sm:w-auto">
            {[
              { key: "", label: "All", icon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m0 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m6-6h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5" /></svg> },
              { key: "PRESENT", label: "Present", icon: <CheckCircle className="w-4 h-4" /> },
              { key: "ABSENT", label: "Absent", icon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg> }
            ].map(status => (
              <button
                key={status.key}
                onClick={() => setStatusFilter(status.key)}
                className={`flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all flex-1 sm:flex-initial whitespace-nowrap ${
                  statusFilter === status.key
                    ? "bg-bg-card text-primary shadow-sm border border-border"
                    : "text-text-muted hover:text-text"
                }`}
              >
                {status.icon}
                <span className="hidden sm:inline">{status.label}</span>
                <span className="sm:hidden text-xs">{status.label}</span>
              </button>
            ))}
          </div>
          {/* Date range */}
          <div className="relative w-full sm:w-auto">
            <button onClick={() => setDateOpen(!dateOpen)} className={`w-full sm:w-auto flex items-center justify-center sm:justify-start gap-2.5 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all whitespace-nowrap ${activePreset ? "border-primary/30 bg-primary/5 text-primary shadow-sm" : "border-border text-text-muted hover:bg-bg"}`}>
              <Calendar className={`w-4 h-4 ${activePreset ? "text-primary" : "text-text-muted"}`} />
              <span className="text-xs">{dateLabel}</span>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={`w-3.5 h-3.5 text-text-muted transition-transform ${dateOpen ? "rotate-180" : ""}`}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" /></svg>
            </button>
            <AnimatePresence>
              {dateOpen && (<>
                <div className="fixed inset-0 z-30" onClick={() => setDateOpen(false)} />
                <motion.div initial={{ opacity: 0, y: -6, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -6, scale: 0.97 }} transition={{ duration: 0.15 }}
                  className="absolute left-0 sm:left-auto sm:right-0 top-full mt-2 z-40 bg-bg-card rounded-2xl border border-border shadow-xl w-[calc(100vw-3.5rem)] sm:w-[400px] overflow-hidden">
                  <div className="p-4 border-b border-border">
                    <p className="text-xs font-bold text-text-muted uppercase tracking-widest mb-3 px-1">Quick Select</p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {PRESETS.map(p => (<button key={p.label} onClick={() => { setDateFrom(p.from()); setDateTo(p.to()); }} className={`px-3 py-2.5 rounded-[10px] text-sm font-semibold transition-all ${activePreset === p.label ? "text-white shadow-sm" : "bg-bg text-text-muted hover:text-slate-700"}`} style={activePreset === p.label ? { background: "linear-gradient(135deg, #4F46E5, #3730A3)" } : {}}>{p.label}</button>))}
                    </div>
                  </div>
                  <div className="p-4 space-y-3">
                    <p className="text-xs font-bold text-text-muted uppercase tracking-widest px-1">Custom Range</p>
                    <div className="grid grid-cols-2 gap-3">
                      <div><label className="text-xs font-semibold text-text-muted mb-1.5 block">From</label><DatePicker value={dateFrom} onChange={v => setDateFrom(v)} fullWidth /></div>
                      <div><label className="text-xs font-semibold text-text-muted mb-1.5 block">To</label><DatePicker value={dateTo} onChange={v => setDateTo(v)} minDate={dateFrom} fullWidth /></div>
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
        
        {/* Active Filters Summary */}
        {(search.trim() || statusFilter || classFilter) && (
          <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-border">
            <span className="text-xs font-semibold text-text-muted">Active filters:</span>
            {search.trim() && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-primary/10 text-primary text-xs font-medium">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-3.5 h-3.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                </svg>
                Search: "{search.trim()}"
                <button onClick={() => setSearch("")} className="ml-1 hover:bg-primary/20 rounded p-0.5 transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3 h-3">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </span>
            )}
            {statusFilter && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-primary/10 text-primary text-xs font-medium">
                {statusFilter === "PRESENT" ? <CheckCircle className="w-3.5 h-3.5" /> : 
                 <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-3.5 h-3.5">
                   <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                 </svg>}
                {statusFilter === "PRESENT" ? "Present" : "Absent"}
                <button onClick={() => setStatusFilter("")} className="ml-1 hover:bg-primary/20 rounded p-0.5 transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3 h-3">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </span>
            )}
            {classFilter && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-primary/10 text-primary text-xs font-medium">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-3.5 h-3.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                </svg>
                Class: {(classes ?? []).find(c => c.id === classFilter)?.name ?? "Unknown"}
                <button onClick={() => setClassFilter("")} className="ml-1 hover:bg-primary/20 rounded p-0.5 transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3 h-3">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </span>
            )}
            <button 
              onClick={() => { setSearch(""); setStatusFilter(""); setClassFilter(""); }}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 text-xs font-medium transition-colors"
            >
              Clear all
            </button>
          </div>
        )}
      </div>

      {/* Table */}
      {!filtered.length && !loading ? (
        <div className="bg-bg-card rounded-2xl shadow-sm border border-border p-12 text-center">
          <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-primary/10 flex items-center justify-center">
            {search.trim() || statusFilter || classFilter ? (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-7 h-7 text-primary/40">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
            ) : (
              <CheckCircle className="w-7 h-7 text-primary/40" />
            )}
          </div>
          <p className="text-sm font-medium text-text-muted">
            {search.trim() || statusFilter || classFilter 
              ? "No attendance records match your filters" 
              : "No attendance records found"}
          </p>
          <p className="text-xs text-text-muted mt-1">
            {search.trim() || statusFilter || classFilter 
              ? "Try adjusting your search or filter criteria" 
              : "Scan student QR codes to mark attendance"}
          </p>
          {(search.trim() || statusFilter || classFilter) && (
            <button 
              onClick={() => { setSearch(""); setStatusFilter(""); setClassFilter(""); }}
              className="mt-3 px-4 py-2 bg-primary text-white text-sm font-medium rounded-xl hover:bg-primary-dark transition-colors"
            >
              Clear all filters
            </button>
          )}
        </div>
      ) : (
        <div className="bg-bg-card rounded-2xl shadow-sm border border-border overflow-hidden">
          {/* Desktop */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full">
              <thead><tr className="border-b border-border">{["Student", "Code", "Class", "Date", "Check-in", "Status"].map(h => (<th key={h} className="text-left px-5 py-3.5 text-xs font-semibold text-text-muted uppercase tracking-wider">{h}</th>))}</tr></thead>
              <tbody>
                {paginated.map(r => (
                  <tr key={r.id} className="border-b border-border/50 hover:bg-bg/50 transition-colors">
                    <td className="px-5 py-3.5 text-sm font-medium text-text">{r.studentName}</td>
                    <td className="px-5 py-3.5 text-sm text-text-muted font-mono">{r.studentCode}</td>
                    <td className="px-5 py-3.5"><span className={`text-xs font-semibold px-2.5 py-1 rounded-lg ${r.className ? "bg-secondary/15 text-cyan-800" : "bg-red-100 text-red-600"}`}>{r.className ?? "Deleted Class"}</span></td>
                    <td className="px-5 py-3.5 text-sm text-text-muted">{new Date(r.date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}</td>
                    <td className="px-5 py-3.5 text-sm text-text-muted">{r.checkInTime ? new Date(r.checkInTime).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }) : "—"}</td>
                    <td className="px-5 py-3.5"><span className={`text-xs font-semibold px-2.5 py-1 rounded-lg ${r.status === "ABSENT" ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-700"}`}>{r.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile */}
          <div className="lg:hidden">
            {paginated.map((r, i) => (
              <div key={r.id} className={`p-4 ${i % 2 === 0 ? "bg-bg-card" : "bg-bg/60"} ${i < paginated.length - 1 ? "border-b-2 border-border/80" : ""}`}>
                <div className="flex gap-3">
                  <div className="w-1 rounded-full flex-shrink-0" style={{ backgroundColor: r.status === "ABSENT" ? "var(--color-danger, #ef4444)" : "var(--color-success, #10b981)" }} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div><p className="font-semibold text-text text-sm truncate">{r.studentName}</p><p className="text-[10px] text-text-muted font-mono">{r.studentCode}</p></div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${r.status === "ABSENT" ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-700"}`}>{r.status}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="bg-bg rounded-lg px-2.5 py-2"><p className="text-[9px] font-semibold text-text-muted uppercase">Class</p><p className={`text-xs font-medium mt-0.5 truncate ${r.className ? "text-text" : "text-red-500"}`}>{r.className ?? "Deleted Class"}</p></div>
                      <div className="bg-bg rounded-lg px-2.5 py-2"><p className="text-[9px] font-semibold text-text-muted uppercase">Date</p><p className="text-xs font-medium text-text mt-0.5">{new Date(r.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</p></div>
                      <div className="bg-bg rounded-lg px-2.5 py-2"><p className="text-[9px] font-semibold text-text-muted uppercase">Time</p><p className="text-xs font-medium text-text mt-0.5">{r.checkInTime ? new Date(r.checkInTime).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }) : "—"}</p></div>
                    </div>
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
    </>
  );
}
