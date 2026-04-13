"use client";
import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Calendar, CheckCircle, ChevronDown } from "lucide-react";
import { getStudentAttendance } from "@/services/api";
import type { Student, AttendanceRecord } from "@/lib/types";
import DatePicker from "@/components/shared/DatePicker";

const STATUS_STYLES: Record<string, { bg: string; text: string; dot: string }> = {
  PRESENT: { bg: "bg-emerald-100", text: "text-emerald-700", dot: "bg-emerald-500" },
  ABSENT: { bg: "bg-red-100", text: "text-red-700", dot: "bg-red-500" },
  LATE: { bg: "bg-amber-100", text: "text-amber-700", dot: "bg-amber-500" },
};

const toStr = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const daysAgo = (n: number) => { const d = new Date(); d.setDate(d.getDate() - n); return toStr(d); };
const monthStart = () => { const d = new Date(); d.setDate(1); return toStr(d); };

const PRESETS = [
  { label: "Last 7 Days", from: () => daysAgo(6), to: () => toStr(new Date()) },
  { label: "Last 30 Days", from: () => daysAgo(29), to: () => toStr(new Date()) },
  { label: "This Month", from: () => monthStart(), to: () => toStr(new Date()) },
  { label: "All Time", from: () => "", to: () => "" },
];

interface Props {
  student: Student | null;
  onClose: () => void;
}

export default function AttendanceDrawer({ student, onClose }: Props) {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [activePreset, setActivePreset] = useState("All Time");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [dateOpen, setDateOpen] = useState(false);

  const fetchRecords = useCallback(async () => {
    if (!student) return;
    setLoading(true);
    try {
      const params = dateFrom && dateTo ? { from: dateFrom, to: dateTo } : undefined;
      const data = await getStudentAttendance(student.id, params);
      setRecords(data ?? []);
    } catch {
      setRecords([]);
    } finally {
      setLoading(false);
    }
  }, [student, dateFrom, dateTo]);

  useEffect(() => {
    if (student) {
      setActivePreset("All Time");
      setDateFrom("");
      setDateTo("");
    }
  }, [student]);

  useEffect(() => { fetchRecords(); }, [fetchRecords]);

  const applyPreset = (p: typeof PRESETS[0]) => {
    setActivePreset(p.label);
    setDateFrom(p.from());
    setDateTo(p.to());
    setDateOpen(false);
  };

  const totalPresent = records.filter(r => r.status === "PRESENT").length;

  return (
    <AnimatePresence>
      {student && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/30 backdrop-blur-[2px] z-40" onClick={onClose} />
          <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-white shadow-2xl z-50 flex flex-col">

            {/* Header */}
            <div className="bg-gradient-to-r from-[#4F46E5] to-[#3730A3] px-6 py-5">
              <div className="flex items-center justify-between mb-3">
                <p className="text-[10px] font-semibold text-white/50 uppercase tracking-widest">Attendance History</p>
                <button onClick={onClose} className="p-2 rounded-xl text-white/40 hover:bg-white/10 hover:text-white transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <h2 className="text-xl font-bold text-white leading-tight">{student.fullName}</h2>
              <div className="flex items-center gap-2 mt-1.5">
                <span className="text-xs font-mono text-white/60 bg-white/10 px-2 py-0.5 rounded-md">{student.studentCode}</span>
                <span className="text-white/30">·</span>
                <span className="text-xs text-white/60">Grade {student.currentGrade}</span>
                {records.length > 0 && (
                  <>
                    <span className="text-white/30">·</span>
                    <span className="text-xs text-white/60">{records.length} records</span>
                  </>
                )}
              </div>
            </div>

            {/* Attendance Health Bar */}
            {!loading && records.length > 0 && (() => {
              const total = records.length;
              const present = totalPresent;
              const pct = Math.round((present / total) * 100);
              const barColor = pct >= 75 ? "bg-emerald-500" : pct >= 50 ? "bg-amber-500" : "bg-red-500";
              const statusColor = pct >= 75 ? "text-emerald-600" : pct >= 50 ? "text-amber-600" : "text-red-600";
              const statusLabel = pct >= 75 ? "Good" : pct >= 50 ? "Low" : "Critical";
              return (
                <div className="px-6 py-3 border-b border-slate-100">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs text-slate-500">
                      <span className="font-bold text-slate-800">{pct}%</span> attendance rate
                    </span>
                    <span className={`text-[10px] font-semibold ${statusColor}`}>{statusLabel}</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all duration-500 ${barColor}`} style={{ width: `${pct}%` }} />
                  </div>
                  <div className="flex items-center justify-between mt-1.5">
                    <span className="text-[10px] text-slate-400">{present} present out of {total}</span>
                    <span className="text-[10px] text-slate-400">{total - present} missed</span>
                  </div>
                </div>
              );
            })()}

            {/* Date Filter */}
            <div className="px-6 py-3 border-b border-slate-100">
              <div className="relative">
                <button onClick={() => setDateOpen(!dateOpen)}
                  className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium hover:bg-slate-50 transition-all">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    <span className="text-xs text-slate-600">{activePreset}</span>
                  </div>
                  <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${dateOpen ? "rotate-180" : ""}`} />
                </button>
                <AnimatePresence>
                  {dateOpen && (
                    <>
                      <div className="fixed inset-0 z-30" onClick={() => setDateOpen(false)} />
                      <motion.div initial={{ opacity: 0, y: -6, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -6, scale: 0.97 }} transition={{ duration: 0.15 }}
                        className="absolute left-0 right-0 top-full mt-2 z-40 bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden">
                        <div className="p-4 border-b border-slate-100">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 px-1">Quick Select</p>
                          <div className="grid grid-cols-2 gap-2">
                            {PRESETS.map(p => (
                              <button key={p.label} onClick={() => applyPreset(p)}
                                className={`px-3 py-2.5 rounded-[10px] text-sm font-semibold transition-all ${activePreset === p.label ? "text-white shadow-sm" : "bg-slate-50 text-slate-500 hover:text-slate-700"}`}
                                style={activePreset === p.label ? { background: "linear-gradient(135deg, #4F46E5, #3730A3)" } : {}}>
                                {p.label}
                              </button>
                            ))}
                          </div>
                        </div>
                        <div className="p-4 space-y-3">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Custom Range</p>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="text-xs font-semibold text-slate-500 mb-1.5 block">From</label>
                              <DatePicker value={dateFrom} onChange={v => { setDateFrom(v); setActivePreset("Custom"); }} fullWidth />
                            </div>
                            <div>
                              <label className="text-xs font-semibold text-slate-500 mb-1.5 block">To</label>
                              <DatePicker value={dateTo} onChange={v => { setDateTo(v); setActivePreset("Custom"); }} minDate={dateFrom} fullWidth />
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 p-4 border-t border-slate-100 bg-slate-50/40">
                          <button onClick={() => { setDateFrom(""); setDateTo(""); setActivePreset("All Time"); setDateOpen(false); }}
                            className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-slate-500 bg-white border border-slate-200 hover:bg-slate-50 transition-all">Reset</button>
                          <button onClick={() => setDateOpen(false)}
                            className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:shadow-md"
                            style={{ background: "linear-gradient(135deg, #4F46E5, #3730A3)" }}>Apply</button>
                        </div>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Timeline Records */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
              {loading ? (
                <div className="space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="animate-pulse flex gap-3">
                      <div className="w-3 h-3 rounded-full bg-slate-200 mt-1.5" />
                      <div className="flex-1 space-y-2">
                        <div className="h-3 bg-slate-200 rounded w-32" />
                        <div className="h-3 bg-slate-200 rounded w-48" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : records.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center mb-3">
                    <CheckCircle className="w-7 h-7 text-slate-300" />
                  </div>
                  <p className="text-sm font-medium text-slate-500">No attendance records</p>
                  <p className="text-xs text-slate-400 mt-1">Try a different date range</p>
                </div>
              ) : (
                <div className="relative">
                  {/* Vertical timeline line */}
                  <div className="absolute left-[5px] top-2 bottom-2 w-0.5 bg-slate-100" />
                  <div className="space-y-4">
                    {records.map((r) => {
                      const style = STATUS_STYLES[r.status] || { bg: "bg-slate-100", text: "text-slate-600", dot: "bg-slate-400" };
                      return (
                        <div key={r.id} className="relative pl-7">
                          {/* Timeline dot */}
                          <div className={`absolute left-0 top-1.5 w-3 h-3 rounded-full border-2 border-white shadow-sm ${style.dot}`} />
                          {/* Card */}
                          <div className="bg-slate-50 rounded-xl p-3">
                            <div className="flex items-center justify-between mb-1">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${style.bg} ${style.text}`}>
                                {r.status}
                              </span>
                              <span className="text-[10px] text-slate-400">
                                {new Date(r.date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" })}
                              </span>
                            </div>
                            <p className="text-sm font-bold text-slate-700">{r.className}</p>
                            {r.checkInTime && (
                              <p className="text-[10px] text-slate-400 mt-1">
                                Check-in: {new Date(r.checkInTime).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
