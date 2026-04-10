"use client";
import { useState, useCallback, useMemo } from "react";
import {
  ChevronLeft, ChevronRight, Clock, MapPin, CalendarDays,
  BookOpen, GraduationCap, Sparkles, Calendar,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import AppShell from "@/components/layout/AppShell";
import { useFetch } from "@/hooks/useFetch";
import { getSchedules } from "@/services/api";
import type { Schedule } from "@/lib/types";

type View = "week" | "month";

const DAYS_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const DAYS_FULL = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const STATUS_STYLES: Record<string, {
  card: string; badge: string; badgeText: string; dot: string; glow: string; gradient: string;
}> = {
  UPCOMING: {
    card: "bg-gradient-to-br from-indigo-50 via-blue-50 to-violet-50 border-indigo-200/60 hover:border-indigo-300 hover:shadow-indigo-100",
    badge: "bg-indigo-100 text-indigo-700", badgeText: "Upcoming",
    dot: "bg-indigo-500", glow: "shadow-indigo-200/50",
    gradient: "from-indigo-500 to-blue-500",
  },
  COMPLETED: {
    card: "bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 border-emerald-200/60 hover:border-emerald-300 hover:shadow-emerald-100",
    badge: "bg-emerald-100 text-emerald-700", badgeText: "Done",
    dot: "bg-emerald-500", glow: "shadow-emerald-200/50",
    gradient: "from-emerald-500 to-teal-500",
  },
  CANCELLED: {
    card: "bg-gradient-to-br from-red-50 via-rose-50 to-pink-50 border-red-200/60 hover:border-red-300 hover:shadow-red-100",
    badge: "bg-red-100 text-red-700", badgeText: "Cancelled",
    dot: "bg-red-500", glow: "shadow-red-200/50",
    gradient: "from-red-500 to-rose-500",
  },
};

const toStr = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

const startOfWeek = (d: Date) => {
  const r = new Date(d);
  r.setDate(r.getDate() - r.getDay());
  return r;
};

const formatTime = (t: string) => {
  const [h, m] = t.split(":").map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`;
};

const formatShortTime = (t: string) => {
  const [h] = t.split(":").map(Number);
  return `${h % 12 || 12}${h >= 12 ? "p" : "a"}`;
};

export default function CalendarPage() {
  const [view, setView] = useState<View>("week");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState<Schedule | null>(null);

  const { from, to, weekDays, monthGrid } = useMemo(() => {
    if (view === "week") {
      const ws = startOfWeek(currentDate);
      const we = new Date(ws);
      we.setDate(we.getDate() + 6);
      const days = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(ws);
        d.setDate(d.getDate() + i);
        return d;
      });
      return { from: toStr(ws), to: toStr(we), weekDays: days, monthGrid: [] as Date[][] };
    }
    const first = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const last = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    const gridStart = startOfWeek(first);
    const gridEnd = new Date(last);
    gridEnd.setDate(gridEnd.getDate() + (6 - gridEnd.getDay()));
    const weeks: Date[][] = [];
    const cur = new Date(gridStart);
    while (cur <= gridEnd) {
      const week: Date[] = [];
      for (let i = 0; i < 7; i++) { week.push(new Date(cur)); cur.setDate(cur.getDate() + 1); }
      weeks.push(week);
    }
    return { from: toStr(gridStart), to: toStr(gridEnd), weekDays: [] as Date[], monthGrid: weeks };
  }, [view, currentDate]);

  const fetchSchedules = useCallback(() => getSchedules({ from, to }), [from, to]);
  const { data: schedules, loading } = useFetch(fetchSchedules);

  const eventsByDate = useMemo(() => {
    const map: Record<string, Schedule[]> = {};
    (schedules ?? []).forEach((s) => { (map[s.sessionDate] ??= []).push(s); });
    Object.values(map).forEach((arr) => arr.sort((a, b) => a.startTime.localeCompare(b.startTime)));
    return map;
  }, [schedules]);

  const navigate = (dir: number) => {
    const d = new Date(currentDate);
    if (view === "week") d.setDate(d.getDate() + dir * 7);
    else d.setMonth(d.getMonth() + dir);
    setCurrentDate(d);
  };

  const todayStr = toStr(new Date());
  const totalEvents = schedules?.length ?? 0;
  const upcomingCount = schedules?.filter(s => s.status === "UPCOMING").length ?? 0;

  const headerLabel = view === "week"
    ? (() => {
        const ws = startOfWeek(currentDate);
        const we = new Date(ws); we.setDate(we.getDate() + 6);
        const opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" };
        return ws.getMonth() === we.getMonth()
          ? `${ws.toLocaleDateString("en-US", { month: "long", day: "numeric" })} – ${we.getDate()}, ${we.getFullYear()}`
          : `${ws.toLocaleDateString("en-US", opts)} – ${we.toLocaleDateString("en-US", opts)}, ${we.getFullYear()}`;
      })()
    : currentDate.toLocaleDateString("en-US", { month: "long", year: "numeric" });

  return (
    <AppShell title="Calendar">
      {/* ── Hero Header ── */}
      <div className="relative mb-6 rounded-2xl overflow-hidden bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 p-6 shadow-xl">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/20 blur-2xl" />
          <div className="absolute -bottom-10 -left-10 w-32 h-32 rounded-full bg-white/20 blur-2xl" />
        </div>
        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg">
              <CalendarDays className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight">{headerLabel}</h1>
              <p className="text-sm text-white/70 mt-0.5">
                {totalEvents} session{totalEvents !== 1 ? "s" : ""} · {upcomingCount} upcoming
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setCurrentDate(new Date())}
              className="px-4 py-2 text-sm font-semibold text-white bg-white/15 backdrop-blur-sm rounded-xl border border-white/20 hover:bg-white/25 transition-all">
              Today
            </button>
            <div className="flex items-center bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 overflow-hidden">
              <button onClick={() => navigate(-1)} className="p-2 hover:bg-white/10 transition">
                <ChevronLeft className="w-5 h-5 text-white" />
              </button>
              <div className="w-px h-6 bg-white/20" />
              <button onClick={() => navigate(1)} className="p-2 hover:bg-white/10 transition">
                <ChevronRight className="w-5 h-5 text-white" />
              </button>
            </div>
            <div className="flex bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 overflow-hidden">
              {(["week", "month"] as View[]).map((v) => (
                <button key={v} onClick={() => setView(v)}
                  className={`px-4 py-2 text-sm font-semibold capitalize transition-all ${view === v ? "bg-white text-indigo-700 shadow-lg" : "text-white/80 hover:bg-white/10"}`}>
                  {v}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Legend ── */}
      <div className="flex items-center gap-5 mb-4 px-1">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 shadow-[0_0_0_3px_rgba(99,102,241,0.2)]" />
          <span className="text-xs font-medium text-text-muted">Upcoming</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_0_3px_rgba(16,185,129,0.2)]" />
          <span className="text-xs font-medium text-text-muted">Done</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-[0_0_0_3px_rgba(239,68,68,0.2)]" />
          <span className="text-xs font-medium text-text-muted">Cancelled</span>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-7 gap-3">
          {[...Array(7)].map((_, i) => (
            <div key={i} className="bg-bg-card rounded-2xl border border-border p-4 animate-pulse">
              <div className="h-4 w-12 bg-border/60 rounded-lg mb-3 mx-auto" />
              <div className="h-8 w-8 bg-border/60 rounded-full mb-4 mx-auto" />
              <div className="space-y-2">
                <div className="h-16 bg-border/40 rounded-xl" />
                <div className="h-16 bg-border/40 rounded-xl" />
              </div>
            </div>
          ))}
        </div>
      ) : view === "week" ? (
        /* ── WEEK VIEW (fixed height, no scroll) ── */
        <div className="bg-bg-card rounded-2xl border border-border overflow-hidden shadow-sm">
          {/* Day header row */}
          <div className="grid grid-cols-7 border-b border-border bg-gradient-to-r from-slate-50/80 to-gray-50/80">
            {weekDays.map((d) => {
              const isToday = toStr(d) === todayStr;
              const isPast = toStr(d) < todayStr;
              return (
                <div key={toStr(d)} className={`flex flex-col items-center py-4 border-r border-border/40 last:border-r-0 transition-colors ${isToday ? "bg-indigo-50/60" : ""}`}>
                  <span className={`text-[11px] font-bold uppercase tracking-widest ${isToday ? "text-indigo-500" : isPast ? "text-text-muted/40" : "text-text-muted"}`}>
                    {DAYS_SHORT[d.getDay()]}
                  </span>
                  <div className={`mt-1.5 w-9 h-9 rounded-full flex items-center justify-center ${
                    isToday
                      ? "bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-300/40"
                      : ""
                  }`}>
                    <span className={`text-base font-bold ${isToday ? "text-white" : isPast ? "text-text-muted/35" : "text-text"}`}>
                      {d.getDate()}
                    </span>
                  </div>
                  {isToday && <div className="w-1 h-1 rounded-full bg-indigo-400 mt-1 animate-pulse" />}
                </div>
              );
            })}
          </div>

          {/* Events body — fixed rows, no scroll */}
          <div className="grid grid-cols-7">
            {weekDays.map((d, idx) => {
              const dateStr = toStr(d);
              const isToday = dateStr === todayStr;
              const isPast = dateStr < todayStr;
              const dayEvents = eventsByDate[dateStr] ?? [];
              return (
                <div
                  key={dateStr}
                  className={`border-r border-border/40 last:border-r-0 p-2 flex flex-col gap-2 h-[420px] ${
                    isToday ? "bg-indigo-50/30" : isPast ? "bg-gray-50/30" : ""
                  }`}
                >
                  {dayEvents.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center opacity-25">
                      <Calendar className="w-6 h-6 text-text-muted mb-1.5" />
                      <p className="text-[10px] text-text-muted font-medium">No classes</p>
                    </div>
                  ) : (
                    dayEvents.map((ev, evIdx) => {
                      const s = STATUS_STYLES[ev.status] ?? STATUS_STYLES.UPCOMING;
                      return (
                        <motion.button
                          key={ev.id}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.03 + evIdx * 0.04, duration: 0.25 }}
                          onClick={() => setSelectedEvent(ev)}
                          className={`w-full text-left rounded-xl border p-2.5 cursor-pointer transition-all duration-200 shadow-sm hover:shadow-lg hover:-translate-y-0.5 group ${s.card}`}
                        >
                          <div className={`h-1 w-8 rounded-full bg-gradient-to-r ${s.gradient} mb-2 group-hover:w-12 transition-all duration-300`} />
                          <p className="text-[11px] font-bold truncate leading-tight text-gray-800">{ev.className}</p>
                          <div className="flex items-center gap-1 mt-1.5">
                            <Clock className="w-3 h-3 text-gray-400 flex-shrink-0" />
                            <p className="text-[10px] text-gray-500 font-medium truncate">
                              {formatTime(ev.startTime)} – {formatTime(ev.endTime)}
                            </p>
                          </div>
                          {ev.location && (
                            <div className="flex items-center gap-1 mt-1">
                              <MapPin className="w-3 h-3 text-gray-400 flex-shrink-0" />
                              <p className="text-[10px] text-gray-500 truncate">{ev.location}</p>
                            </div>
                          )}
                          {ev.grade && (
                            <div className="mt-2">
                              <span className={`inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full ${s.badge}`}>
                                <GraduationCap className="w-2.5 h-2.5" />
                                Grade {ev.grade}
                              </span>
                            </div>
                          )}
                        </motion.button>
                      );
                    })
                  )}
                </div>
              );
            })}
          </div>

          {/* Footer summary row */}
          <div className="grid grid-cols-7 border-t border-border/60 bg-gradient-to-r from-slate-50/60 to-gray-50/60">
            {weekDays.map((d) => {
              const dateStr = toStr(d);
              const isToday = dateStr === todayStr;
              const count = (eventsByDate[dateStr] ?? []).length;
              return (
                <div key={`f-${dateStr}`} className="text-center py-2 border-r border-border/40 last:border-r-0">
                  {count > 0 ? (
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                      isToday ? "bg-indigo-100 text-indigo-600" : "bg-gray-100 text-gray-400"
                    }`}>
                      {count} class{count !== 1 ? "es" : ""}
                    </span>
                  ) : (
                    <span className="text-[10px] text-gray-300 font-medium">—</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* ── MONTH VIEW ── */
        <div className="bg-bg-card rounded-2xl border border-border overflow-hidden shadow-sm">
          {/* Day headers */}
          <div className="grid grid-cols-7 bg-gradient-to-r from-gray-50 to-slate-50">
            {DAYS_SHORT.map((d) => (
              <div key={d} className="text-center py-3 text-[11px] font-bold text-text-muted uppercase tracking-widest border-r border-border/50 last:border-r-0">
                {d}
              </div>
            ))}
          </div>
          {/* Weeks */}
          {monthGrid.map((week, wi) => (
            <div key={wi} className="grid grid-cols-7 border-t border-border/50">
              {week.map((d) => {
                const dateStr = toStr(d);
                const isToday = dateStr === todayStr;
                const isCurrentMonth = d.getMonth() === currentDate.getMonth();
                const dayEvents = eventsByDate[dateStr] ?? [];
                return (
                  <div
                    key={dateStr}
                    className={`min-h-[110px] border-r border-border/50 last:border-r-0 p-2 transition-colors ${
                      isToday ? "bg-indigo-50/60" : isCurrentMonth ? "bg-white" : "bg-gray-50/50"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className={`text-xs font-semibold inline-flex items-center justify-center ${
                        isToday
                          ? "w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-sm"
                          : isCurrentMonth ? "text-text" : "text-text-muted/30"
                      }`}>
                        {d.getDate()}
                      </span>
                      {dayEvents.length > 0 && (
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                          isToday ? "bg-indigo-100 text-indigo-600" : "bg-gray-100 text-gray-400"
                        }`}>
                          {dayEvents.length}
                        </span>
                      )}
                    </div>
                    <div className="space-y-1">
                      {dayEvents.slice(0, 3).map((ev) => {
                        const s = STATUS_STYLES[ev.status] ?? STATUS_STYLES.UPCOMING;
                        return (
                          <button
                            key={ev.id}
                            onClick={() => setSelectedEvent(ev)}
                            className={`w-full text-left rounded-lg px-2 py-1 text-[10px] font-semibold truncate border transition-all hover:shadow-sm hover:-translate-y-px ${s.card}`}
                          >
                            <span className="opacity-60">{formatShortTime(ev.startTime)}–{formatShortTime(ev.endTime)}</span>{" "}
                            {ev.className}
                          </button>
                        );
                      })}
                      {dayEvents.length > 3 && (
                        <p className="text-[10px] text-indigo-500 font-bold pl-2 cursor-pointer hover:text-indigo-700">
                          +{dayEvents.length - 3} more
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      )}

      {/* ── Event Detail Modal ── */}
      <AnimatePresence>
        {selectedEvent && (() => {
          const s = STATUS_STYLES[selectedEvent.status] ?? STATUS_STYLES.UPCOMING;
          return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/40 backdrop-blur-md" onClick={() => setSelectedEvent(null)}
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className="relative z-10 bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden border border-gray-100"
              >
                {/* Gradient header */}
                <div className={`bg-gradient-to-r ${s.gradient} p-6 pb-8 relative`}>
                  <div className="absolute inset-0 opacity-20">
                    <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full bg-white/30 blur-xl" />
                  </div>
                  <div className="relative">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <BookOpen className="w-4 h-4 text-white/80" />
                          <span className="text-xs font-semibold text-white/80 uppercase tracking-wider">Class Session</span>
                        </div>
                        <h3 className="text-lg font-bold text-white truncate">{selectedEvent.className}</h3>
                      </div>
                      {selectedEvent.grade && (
                        <span className="flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-full bg-white/20 text-white backdrop-blur-sm flex-shrink-0">
                          <GraduationCap className="w-3.5 h-3.5" />
                          Grade {selectedEvent.grade}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="p-6 -mt-4">
                  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center flex-shrink-0">
                        <CalendarDays className="w-4.5 h-4.5 text-indigo-500" />
                      </div>
                      <div>
                        <p className="text-[10px] font-semibold text-text-muted uppercase tracking-wider">Date</p>
                        <p className="text-sm font-semibold text-text">
                          {new Date(selectedEvent.sessionDate + "T00:00:00").toLocaleDateString("en-US", {
                            weekday: "long", month: "long", day: "numeric", year: "numeric",
                          })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-purple-50 flex items-center justify-center flex-shrink-0">
                        <Clock className="w-4.5 h-4.5 text-purple-500" />
                      </div>
                      <div>
                        <p className="text-[10px] font-semibold text-text-muted uppercase tracking-wider">Time</p>
                        <p className="text-sm font-semibold text-text">
                          {formatTime(selectedEvent.startTime)} – {formatTime(selectedEvent.endTime)}
                        </p>
                      </div>
                    </div>
                    {selectedEvent.location && (
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-rose-50 flex items-center justify-center flex-shrink-0">
                          <MapPin className="w-4.5 h-4.5 text-rose-500" />
                        </div>
                        <div>
                          <p className="text-[10px] font-semibold text-text-muted uppercase tracking-wider">Location</p>
                          <p className="text-sm font-semibold text-text">{selectedEvent.location}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Status badge */}
                  <div className="flex items-center justify-center mt-4">
                    <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-4 py-2 rounded-full ${s.badge}`}>
                      <div className={`w-2 h-2 rounded-full ${s.dot} ${selectedEvent.status === "UPCOMING" ? "animate-pulse" : ""}`} />
                      {s.badgeText}
                    </span>
                  </div>

                  <button
                    onClick={() => setSelectedEvent(null)}
                    className="w-full mt-4 py-3 rounded-xl text-sm font-bold text-text-muted bg-gray-50 border border-gray-200 hover:bg-gray-100 hover:border-gray-300 transition-all"
                  >
                    Close
                  </button>
                </div>
              </motion.div>
            </div>
          );
        })()}
      </AnimatePresence>
    </AppShell>
  );
}
