"use client";
import { useState, useCallback, useEffect, useRef } from "react";
import { toast } from "sonner";
import { Plus, Trash2, Pencil, Clock, Users, MapPin, BookOpen, Layers, CalendarDays, GraduationCap } from "lucide-react";
import { motion } from "framer-motion";
import AppShell from "@/components/layout/AppShell";
import Button from "@/components/ui/Button";

import Modal from "@/components/ui/Modal";
import { useFetch } from "@/hooks/useFetch";
import { getClasses, createClass, updateClass, deleteClassApi, addScheduleToClass, deleteScheduleFromClass } from "@/services/api";
import { DAYS } from "@/lib/utils";
import type { ClassItem } from "@/lib/types";

interface ScheduleEntry { dayOfWeek: number; startTime: string; endTime: string; }
const emptyForm = { name: "", grade: 1, location: "" };
const PAGE_SIZE = 8;

export default function ClassesPage() {
  const fetchClasses = useCallback(() => getClasses(), []);
  const { data: classes, loading, refetch } = useFetch(fetchClasses);
  const [search, setSearch] = useState("");
  const [filterGrade, setFilterGrade] = useState<number | "ALL">("ALL");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<ClassItem | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [schedules, setSchedules] = useState<ScheduleEntry[]>([]);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ClassItem | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [scheduleClass, setScheduleClass] = useState<ClassItem | null>(null);
  const [newSchedule, setNewSchedule] = useState<ScheduleEntry>({ dayOfWeek: 1, startTime: "08:00", endTime: "09:00" });
  const [addingSched, setAddingSched] = useState(false);
  const [page, setPage] = useState(1);

  const all = classes ?? [];
  const totalStudents = all.reduce((sum, c) => sum + (c.studentCount ?? 0), 0);
  const totalSchedules = all.reduce((sum, c) => sum + (c.schedules?.length ?? 0), 0);
  const grades = [...new Set(all.map(c => c.grade))].sort((a, b) => a - b);
  const filtered = all.filter(c => {
    if (filterGrade !== "ALL" && c.grade !== filterGrade) return false;
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return c.name.toLowerCase().includes(q) || (c.location?.toLowerCase().includes(q));
  });
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  useEffect(() => { setPage(1); }, [search, filterGrade]);

  const openCreate = () => { setEditingClass(null); setForm(emptyForm); setSchedules([]); setModalOpen(true); };
  const openEdit = (cls: ClassItem) => { setEditingClass(cls); setForm({ name: cls.name, grade: cls.grade, location: cls.location || "" }); setSchedules([]); setModalOpen(true); };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name) { toast.error("Class name is required"); return; }
    setSaving(true);
    try {
      if (editingClass) {
        await updateClass(editingClass.id, { name: form.name, grade: Number(form.grade), location: form.location || undefined });
        toast.success("Class updated");
      } else {
        await createClass({ name: form.name, grade: Number(form.grade), location: form.location || undefined, schedules: schedules.length > 0 ? schedules : undefined });
        toast.success("Class created");
      }
      setModalOpen(false); setForm(emptyForm); setSchedules([]); setEditingClass(null); refetch();
    } catch { toast.error(editingClass ? "Failed to update class" : "Failed to create class"); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try { await deleteClassApi(deleteTarget.id); toast.success(`${deleteTarget.name} deleted`); setDeleteTarget(null); refetch(); }
    catch { toast.error("Failed to delete class"); }
    finally { setDeleting(false); }
  };

  const handleAddSchedule = async () => {
    if (!scheduleClass) return;
    setAddingSched(true);
    try { await addScheduleToClass(scheduleClass.id, newSchedule); toast.success("Schedule added"); setNewSchedule({ dayOfWeek: 1, startTime: "08:00", endTime: "09:00" }); refetch(); setScheduleClass({ ...scheduleClass, ...(await getClasses()).find(c => c.id === scheduleClass.id) } as ClassItem); }
    catch { toast.error("Failed to add schedule"); }
    finally { setAddingSched(false); }
  };

  const handleDeleteSchedule = async (scheduleId: string) => {
    if (!scheduleClass) return;
    try { await deleteScheduleFromClass(scheduleClass.id, scheduleId); toast.success("Schedule removed"); refetch(); setScheduleClass({ ...scheduleClass, schedules: scheduleClass.schedules.filter(s => s.id !== scheduleId) }); }
    catch { toast.error("Failed to remove schedule"); }
  };

  const addScheduleRow = () => setSchedules([...schedules, { dayOfWeek: 1, startTime: "08:00", endTime: "09:00" }]);
  const removeScheduleRow = (idx: number) => setSchedules(schedules.filter((_, i) => i !== idx));
  const updateScheduleRow = (idx: number, key: keyof ScheduleEntry, val: string | number) =>
    setSchedules(schedules.map((s, i) => i === idx ? { ...s, [key]: val } : s));

  const parse24 = (t: string) => {
    const [h, m] = t.split(":").map(Number);
    return { h12: h === 0 ? 12 : h > 12 ? h - 12 : h, min: m, ampm: h < 12 ? "AM" as const : "PM" as const };
  };
  const to24 = (h12: number, min: number, ampm: "AM" | "PM") => {
    const h = ampm === "AM" ? (h12 === 12 ? 0 : h12) : (h12 === 12 ? 12 : h12 + 12);
    return `${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
  };

  const TimeInput = ({ value, min, max, pad, onCommit }: { value: number; min: number; max: number; pad?: boolean; onCommit: (n: number) => void }) => {
    const [draft, setDraft] = useState(pad ? String(value).padStart(2, "0") : String(value));
    const ref = useRef<HTMLInputElement>(null);
    useEffect(() => { if (document.activeElement !== ref.current) setDraft(pad ? String(value).padStart(2, "0") : String(value)); }, [value, pad]);
    return (
      <input ref={ref} type="text" inputMode="numeric" maxLength={2} value={draft}
        onChange={e => {
          const v = e.target.value.replace(/\D/g, "").slice(0, 2);
          if (v === "") { setDraft(""); return; }
          const n = parseInt(v, 10);
          if (n > max) return;
          setDraft(v);
        }}
        onBlur={() => { const n = parseInt(draft, 10); const clamped = isNaN(n) || n < min ? value : Math.min(max, n); onCommit(clamped); setDraft(pad ? String(clamped).padStart(2, "0") : String(clamped)); }}
        onKeyDown={e => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }}
        className="w-11 h-11 rounded-xl bg-bg border border-border text-center text-sm font-bold text-text tabular-nums focus:outline-none focus:ring-2 focus:ring-blue-700/20 focus:border-blue-700" />
    );
  };

  const TimePicker = ({ value, onChange }: { value: string; onChange: (v: string) => void }) => {
    const p = parse24(value);
    return (
      <div className="flex items-center gap-1">
        <TimeInput value={p.h12} min={1} max={12} onCommit={h => onChange(to24(h, p.min, p.ampm))} />
        <span className="text-base font-bold text-text-muted/30">:</span>
        <TimeInput value={p.min} min={0} max={59} pad onCommit={m => onChange(to24(p.h12, m, p.ampm))} />
        <div className="flex flex-col gap-0.5 ml-1">
          <button type="button" onClick={() => onChange(to24(p.h12, p.min, "AM"))}
            className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all ${p.ampm === "AM" ? "bg-blue-700 text-white shadow-sm" : "bg-bg border border-border text-text-muted hover:border-blue-600"}`}>AM</button>
          <button type="button" onClick={() => onChange(to24(p.h12, p.min, "PM"))}
            className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all ${p.ampm === "PM" ? "bg-blue-700 text-white shadow-sm" : "bg-bg border border-border text-text-muted hover:border-blue-600"}`}>PM</button>
        </div>
      </div>
    );
  };

  const pageNums = Array.from({ length: totalPages }, (_, i) => i + 1)
    .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
    .reduce<(number | string)[]>((acc, p, idx, arr) => { if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push("..."); acc.push(p); return acc; }, []);

  return (
    <AppShell title="Classes">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div><h2 className="text-lg font-semibold text-text">All Classes</h2><p className="text-xs text-text-muted mt-0.5">{all.length} classes total</p></div>
        <Button onClick={openCreate}><Plus className="h-4 w-4" /> New Class</Button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: "CLASSES", value: all.length, sub: "Total classes", gradient: "from-blue-600 to-indigo-600", icon: <BookOpen className="w-5 h-5" /> },
          { label: "STUDENTS", value: totalStudents, sub: "Total enrolled", gradient: "from-emerald-600 to-teal-600", icon: <Users className="w-5 h-5" /> },
          { label: "GRADES", value: grades.length, sub: "Grades covered", gradient: "from-amber-500 to-orange-500", icon: <Layers className="w-5 h-5" /> },
          { label: "SCHEDULES", value: totalSchedules, sub: "Time slots", gradient: "from-violet-600 to-purple-600", icon: <CalendarDays className="w-5 h-5" /> },
        ].map((card, i) => (
          <motion.div key={card.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
            className={`bg-gradient-to-br ${card.gradient} rounded-2xl p-5 shadow-lg hover:shadow-xl transition-shadow duration-200 hover:-translate-y-0.5`}>
            <div className="flex items-start justify-between mb-4">
              <p className="text-xs font-bold text-white/70 uppercase tracking-widest">{card.label}</p>
              <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center text-white">{card.icon}</div>
            </div>
            <p className="text-3xl font-bold text-white leading-tight">{card.value}</p>
            <p className="text-xs text-white/60 mt-1">{card.sub}</p>
          </motion.div>
        ))}
      </div>

      {/* Search & Filters */}
      <div className="bg-bg-card rounded-2xl shadow-sm border border-border p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
          <div className="relative flex-1">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, location..." className="w-full pl-10 pr-4 py-2.5 border border-border rounded-xl text-sm text-text bg-bg-card placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
          </div>
          {(search || filterGrade !== "ALL") && (<div className="flex items-center gap-2 flex-shrink-0"><span className="text-[11px] font-medium text-text-muted">{filtered.length} found</span><button onClick={() => { setSearch(""); setFilterGrade("ALL"); }} className="text-[11px] font-semibold text-primary hover:underline">Clear all</button></div>)}
        </div>
        {grades.length > 1 && (<div className="flex flex-wrap gap-1.5 mt-3">{(["ALL" as const, ...grades]).map(g => (<button key={g} onClick={() => setFilterGrade(g)} className={`px-3.5 py-2 rounded-xl text-xs font-medium transition-all whitespace-nowrap ${filterGrade === g ? "text-white shadow-md bg-primary" : "bg-bg text-text-muted hover:bg-border/50"}`}>{g === "ALL" ? "All Grades" : `Grade ${g}`}</button>))}</div>)}
      </div>

      {/* Table */}
      {!filtered.length && !loading ? (
        <div className="bg-bg-card rounded-2xl shadow-sm border border-border p-12 text-center">
          <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-primary/10 flex items-center justify-center"><BookOpen className="w-7 h-7 text-primary/40" /></div>
          <p className="text-sm font-medium text-text-muted">No classes found</p>
        </div>
      ) : (
        <div className="bg-bg-card rounded-2xl shadow-sm border border-border overflow-hidden">
          {/* Desktop */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-bg/60">
                  {["Class", "Grade", "Schedule", "Students", ""].map(h => (
                    <th key={h} className="text-left px-5 py-3.5 text-[10px] font-bold text-text-muted uppercase tracking-widest border-b border-border">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginated.map((cls, i) => (
                  <motion.tr key={cls.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                    className="border-b border-border/40 hover:bg-primary/[0.02] transition-colors group">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-100 to-sky-50 flex items-center justify-center flex-shrink-0">
                          <BookOpen className="w-4 h-4 text-blue-500" />
                        </div>
                        <div className="min-w-0">
                          <span className="text-sm font-semibold text-text">{cls.name}</span>
                          {cls.location && <p className="text-xs text-text-muted truncate max-w-[200px]">{cls.location}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700">Grade {cls.grade}</span>
                    </td>

                    <td className="px-5 py-4">
                      {cls.schedules?.length ? (
                        <div className="flex flex-wrap gap-1">
                          {cls.schedules.slice(0, 3).map(s => (
                            <span key={s.id} className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-bg text-text-muted">
                              {DAYS[s.dayOfWeek]?.slice(0, 3)} {s.startTime.slice(0, 5)}
                            </span>
                          ))}
                          {cls.schedules.length > 3 && (
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-bg text-text-muted">+{cls.schedules.length - 3}</span>
                          )}
                        </div>
                      ) : <span className="text-xs text-text-muted/50">No schedule</span>}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-sky-50 flex items-center justify-center">
                          <Users className="w-3.5 h-3.5 text-sky-600" />
                        </div>
                        <span className="text-sm font-bold text-text">{cls.studentCount}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-0.5">
                        <button onClick={() => setScheduleClass(cls)} className="p-2 rounded-xl text-text-muted hover:text-primary hover:bg-primary/10 transition-all" title="Manage Schedule"><Clock className="w-4 h-4" /></button>
                        <button onClick={() => openEdit(cls)} className="p-2 rounded-xl text-text-muted hover:text-primary hover:bg-primary/10 transition-all" title="Edit"><Pencil className="w-4 h-4" /></button>
                        <button onClick={() => setDeleteTarget(cls)} className="p-2 rounded-xl text-text-muted hover:text-danger hover:bg-danger/10 transition-all" title="Delete"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile */}
          <div className="lg:hidden">
            {paginated.map((cls, i) => (
              <div key={cls.id} className={`p-4 ${i % 2 === 0 ? "bg-bg-card" : "bg-bg/60"} ${i < paginated.length - 1 ? "border-b-2 border-border/80" : ""}`}>
                <div className="flex gap-3">
                  <div className="w-1 rounded-full flex-shrink-0 bg-blue-500" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div><p className="font-semibold text-text text-sm truncate">{cls.name}</p>{cls.location && <p className="text-xs text-text-muted truncate">{cls.location}</p>}</div>
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0 bg-emerald-100 text-emerald-700">Grade {cls.grade}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 mb-3">
                      <div className="bg-bg rounded-lg px-2.5 py-2"><p className="text-[10px] font-semibold text-text-muted uppercase">Students</p><p className="text-sm font-bold text-text mt-0.5">{cls.studentCount}</p></div>
                      <div className="bg-bg rounded-lg px-2.5 py-2"><p className="text-[10px] font-semibold text-text-muted uppercase">Schedules</p><p className="text-sm font-medium text-text mt-0.5">{cls.schedules?.length || 0} slots</p></div>
                      <div className="bg-bg rounded-lg px-2.5 py-2"><p className="text-[10px] font-semibold text-text-muted uppercase">Next</p><p className="text-sm font-medium text-text mt-0.5 truncate">{cls.schedules?.[0] ? `${DAYS[cls.schedules[0].dayOfWeek]?.slice(0, 3)}` : "—"}</p></div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button onClick={() => setScheduleClass(cls)} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-primary bg-primary/[0.06] hover:bg-primary/[0.12] transition-all"><Clock className="w-4 h-4" /><span className="text-xs font-semibold hidden sm:inline">Schedule</span></button>
                      <button onClick={() => openEdit(cls)} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-primary bg-primary/[0.06] hover:bg-primary/[0.12] transition-all"><Pencil className="w-4 h-4" /><span className="text-xs font-semibold hidden sm:inline">Edit</span></button>
                      <button onClick={() => setDeleteTarget(cls)} className="flex-1 flex items-center justify-center py-2 rounded-xl text-danger bg-danger/[0.06] hover:bg-danger/[0.12] transition-all"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
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

      {/* Create / Edit Modal */}
      <Modal open={modalOpen} onClose={() => { setModalOpen(false); setSchedules([]); setEditingClass(null); }} title="" className="max-w-xl p-0 !rounded-none !border-0">
        <form onSubmit={handleSave}>
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-700 to-blue-800 px-6 py-5">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-white/20 flex items-center justify-center">
                {editingClass
                  ? <span className="text-white font-bold text-lg">{editingClass.name.charAt(0).toUpperCase()}</span>
                  : <BookOpen className="w-5 h-5 text-white" />}
              </div>
              <div>
                <h2 className="text-white font-semibold text-base">{editingClass ? "Edit Class" : "New Class"}</h2>
                <p className="text-white/60 text-xs mt-0.5">{editingClass ? `Grade ${editingClass.grade}` : "Fill in the details below"}</p>
              </div>
            </div>
          </div>

          <div className="px-6 py-5 space-y-5 max-h-[60vh] overflow-y-auto">
            {/* Class Info */}
            <div>
              <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-3">Class Information</p>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="cname" className="block text-xs font-semibold text-text-muted mb-1.5">Class Name</label>
                    <div className="relative">
                      <BookOpen className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted/50 pointer-events-none" />
                      <input id="cname" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Math 101"
                        className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-border bg-bg-card text-sm text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="cgrade" className="block text-xs font-semibold text-text-muted mb-1.5">Grade</label>
                    <div className="relative">
                      <GraduationCap className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted/50 pointer-events-none" />
                      <input id="cgrade" type="number" value={String(form.grade)} onChange={e => setForm({ ...form, grade: Number(e.target.value) })}
                        className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-border bg-bg-card text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
                    </div>
                  </div>
                </div>
                <div>
                  <label htmlFor="cloc" className="block text-xs font-semibold text-text-muted mb-1.5">Location <span className="text-text-muted/40">(optional)</span></label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted/50 pointer-events-none" />
                    <textarea id="cloc" value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} placeholder="Room 201" rows={1}
                      className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-border bg-bg-card text-sm text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none" />
                  </div>
                </div>
              </div>
            </div>

            {/* Schedule — only for create */}
            {!editingClass && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Schedule <span className="font-medium normal-case tracking-normal text-text-muted/50">(optional)</span></p>
                  <button type="button" onClick={addScheduleRow} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-semibold text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-sm hover:shadow transition-all">
                    <Plus className="w-3 h-3" /> Add Slot
                  </button>
                </div>
                {schedules.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-6 rounded-xl border border-dashed border-border">
                    <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center mb-2">
                      <Clock className="w-5 h-5 text-blue-600" />
                    </div>
                    <p className="text-xs text-text-muted">No schedule yet. Add time slots or do it later.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {schedules.map((s, idx) => (
                      <div key={idx} className="rounded-xl border border-border bg-bg/30 p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center">
                              <span className="text-[10px] font-bold text-white">{idx + 1}</span>
                            </div>
                            <p className="text-xs font-semibold text-text">Time Slot {idx + 1}</p>
                          </div>
                          <button type="button" onClick={() => removeScheduleRow(idx)} className="p-1.5 rounded-lg text-text-muted/40 hover:text-danger hover:bg-danger/10 transition-all" title="Remove"><Trash2 className="w-3.5 h-3.5" /></button>
                        </div>
                        {/* Day chips */}
                        <div className="mb-3">
                          <label className="block text-[10px] font-bold text-text-muted uppercase tracking-wider mb-2">Day</label>
                          <div className="flex flex-wrap gap-1.5">
                            {DAYS.map((d, i) => (
                              <button key={i} type="button" onClick={() => updateScheduleRow(idx, "dayOfWeek", i)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                                  s.dayOfWeek === i
                                    ? "bg-blue-700 text-white shadow-sm"
                                    : "bg-bg text-text-muted hover:bg-border/60"
                                }`}>
                                {d.slice(0, 3)}
                              </button>
                            ))}
                          </div>
                        </div>
                        {/* Time range */}
                        <div className="flex items-center gap-3 justify-center">
                          <div className="text-center">
                            <label className="block text-[10px] font-bold text-text-muted uppercase tracking-wider mb-2">Start</label>
                            <TimePicker value={s.startTime} onChange={v => updateScheduleRow(idx, "startTime", v)} />
                          </div>
                          <div className="pt-5">
                            <div className="w-4 h-px bg-border" />
                          </div>
                          <div className="text-center">
                            <label className="block text-[10px] font-bold text-text-muted uppercase tracking-wider mb-2">End</label>
                            <TimePicker value={s.endTime} onChange={v => updateScheduleRow(idx, "endTime", v)} />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border bg-bg/40">
            <Button variant="ghost" type="button" onClick={() => { setModalOpen(false); setSchedules([]); setEditingClass(null); }}>Cancel</Button>
            <Button type="submit" loading={saving} className="!bg-blue-700 hover:!bg-blue-800 !shadow-blue-700/20">{editingClass ? "Update Class" : "Create Class"}</Button>
          </div>
        </form>
      </Modal>

      {/* Schedule Management Modal */}
      <Modal open={!!scheduleClass} onClose={() => setScheduleClass(null)} title="" className="max-w-lg p-0">
        {/* Header */}
        <div className="bg-gradient-to-r from-sky-600 to-cyan-700 px-6 py-5 rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-white/20 flex items-center justify-center">
              <Clock className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-white font-semibold text-base">Schedule</h2>
              <p className="text-white/60 text-xs mt-0.5">{scheduleClass?.name}{scheduleClass?.location ? ` · ${scheduleClass.location}` : ""}</p>
            </div>
          </div>
        </div>

        <div className="px-6 py-5 space-y-5 max-h-[60vh] overflow-y-auto">
          {/* Existing schedules */}
          <div>
            <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-3">Current Schedule</p>
            {scheduleClass?.schedules?.length ? (
              <div className="space-y-2">
                {scheduleClass.schedules.map((s, i) => (
                  <div key={s.id} className="flex items-center gap-3 rounded-xl border border-border bg-bg/50 px-4 py-3 group hover:border-sky-200 transition-all">
                    <div className="w-9 h-9 rounded-lg bg-sky-50 flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-bold text-sky-600">{i + 1}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-text">{DAYS[s.dayOfWeek]}</p>
                      <p className="text-xs text-text-muted">{s.startTime.slice(0, 5)} – {s.endTime.slice(0, 5)}</p>
                    </div>
                    <button onClick={() => handleDeleteSchedule(s.id)} className="p-2 rounded-lg text-danger/40 hover:text-danger hover:bg-danger/10 transition-all"><Trash2 className="w-4 h-4" /></button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 rounded-xl border border-dashed border-border">
                <div className="w-10 h-10 rounded-xl bg-sky-50 flex items-center justify-center mb-2">
                  <CalendarDays className="w-5 h-5 text-sky-400" />
                </div>
                <p className="text-xs font-medium text-text-muted">No schedules assigned yet</p>
              </div>
            )}
          </div>

          {/* Add new schedule */}
          <div>
            <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-3">Add New Slot</p>
            <div className="rounded-xl border border-border bg-bg/30 p-4 space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-text-muted uppercase tracking-wider mb-2">Day</label>
                <div className="flex flex-wrap gap-1.5">
                  {DAYS.map((d, i) => (
                    <button key={i} type="button" onClick={() => setNewSchedule({ ...newSchedule, dayOfWeek: i })}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                        newSchedule.dayOfWeek === i
                          ? "bg-sky-500 text-white shadow-sm"
                          : "bg-bg text-text-muted hover:bg-border/60"
                      }`}>
                      {d.slice(0, 3)}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-3 justify-center">
                <div className="text-center">
                  <label className="block text-[10px] font-bold text-text-muted uppercase tracking-wider mb-2">Start</label>
                  <TimePicker value={newSchedule.startTime} onChange={v => setNewSchedule({ ...newSchedule, startTime: v })} />
                </div>
                <div className="pt-5">
                  <div className="w-4 h-px bg-border" />
                </div>
                <div className="text-center">
                  <label className="block text-[10px] font-bold text-text-muted uppercase tracking-wider mb-2">End</label>
                  <TimePicker value={newSchedule.endTime} onChange={v => setNewSchedule({ ...newSchedule, endTime: v })} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border bg-bg/40">
          <Button variant="ghost" onClick={() => setScheduleClass(null)}>Close</Button>
          <Button onClick={handleAddSchedule} loading={addingSched}><Plus className="h-4 w-4" /> Add Slot</Button>
        </div>
      </Modal>

      {/* Delete Confirmation */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setDeleteTarget(null)} />
          <div className="relative z-10 bg-bg-card rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center border border-border">
            <div className="w-12 h-12 rounded-2xl bg-danger/10 flex items-center justify-center mx-auto mb-4"><Trash2 className="w-6 h-6 text-danger" /></div>
            <h3 className="text-base font-semibold text-text">Delete Class</h3>
            <p className="text-sm text-text-muted mt-1">Permanently delete <span className="font-semibold text-text">{deleteTarget.name}</span>? This will also remove all schedules.</p>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setDeleteTarget(null)} className="flex-1 h-10 rounded-xl border border-border text-sm font-semibold text-text hover:bg-bg transition-all">Cancel</button>
              <button onClick={handleDelete} disabled={deleting} className="flex-1 h-10 rounded-xl text-sm font-semibold text-white bg-danger hover:bg-danger/90 transition-all disabled:opacity-60">{deleting ? "Deleting..." : "Delete"}</button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
