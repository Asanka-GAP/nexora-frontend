"use client";
import { useState, useCallback, useEffect } from "react";
import { toast } from "sonner";
import { Plus, Trash2, Pencil, Clock } from "lucide-react";
import AppShell from "@/components/layout/AppShell";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
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

  const grades = [...new Set((classes ?? []).map(c => c.grade))].sort((a, b) => a - b);
  const filtered = (classes ?? []).filter(c => {
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

  const scheduleLabel = (cls: ClassItem) => {
    if (!cls.schedules?.length) return null;
    return cls.schedules.map(s => `${DAYS[s.dayOfWeek]?.slice(0, 3)} ${s.startTime.slice(0, 5)}`).join(", ");
  };

  const pageNums = Array.from({ length: totalPages }, (_, i) => i + 1)
    .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
    .reduce<(number | string)[]>((acc, p, idx, arr) => { if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push("..."); acc.push(p); return acc; }, []);

  return (
    <AppShell title="Classes">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div><h2 className="text-lg font-semibold text-text">All Classes</h2><p className="text-xs text-text-muted mt-0.5">{(classes ?? []).length} classes total</p></div>
        <Button onClick={openCreate}><Plus className="h-4 w-4" /> New Class</Button>
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
      {loading ? (
        <div className="bg-bg-card rounded-2xl shadow-sm border border-border p-8"><div className="animate-pulse space-y-4">{[...Array(5)].map((_, i) => <div key={i} className="h-10 bg-border/50 rounded-lg" />)}</div></div>
      ) : !filtered.length ? (
        <div className="bg-bg-card rounded-2xl shadow-sm border border-border p-12 text-center">
          <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-primary/10 flex items-center justify-center"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.2} stroke="currentColor" className="w-7 h-7 text-primary/40"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" /></svg></div>
          <p className="text-sm font-medium text-text-muted">No classes found</p>
        </div>
      ) : (
        <div className="bg-bg-card rounded-2xl shadow-sm border border-border overflow-hidden">
          {/* Desktop */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full">
              <thead><tr className="border-b border-border">{["Class", "Grade", "Location", "Schedule", ""].map(h => (<th key={h} className="text-left px-5 py-3.5 text-xs font-semibold text-text-muted uppercase tracking-wider">{h}</th>))}</tr></thead>
              <tbody>
                {paginated.map(cls => (
                  <tr key={cls.id} className="border-b border-border/50 hover:bg-bg/50 transition-colors">
                    <td className="px-5 py-3.5 text-sm font-medium text-text">{cls.name}</td>
                    <td className="px-5 py-3.5"><span className="text-xs font-medium px-2.5 py-1 rounded-lg bg-secondary/10 text-secondary">Grade {cls.grade}</span></td>
                    <td className="px-5 py-3.5 text-sm text-text-muted">{cls.location || "—"}</td>
                    <td className="px-5 py-3.5 text-xs text-text-muted max-w-[200px] truncate">{scheduleLabel(cls) || "No schedule"}</td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1">
                        <button onClick={() => setScheduleClass(cls)} className="p-1.5 rounded-lg text-text-muted hover:text-primary hover:bg-primary/10 transition-all" title="Manage Schedule"><Clock className="w-4 h-4" /></button>
                        <button onClick={() => openEdit(cls)} className="p-1.5 rounded-lg text-text-muted hover:text-primary hover:bg-primary/10 transition-all" title="Edit"><Pencil className="w-4 h-4" /></button>
                        <button onClick={() => setDeleteTarget(cls)} className="p-1.5 rounded-lg text-text-muted hover:text-danger hover:bg-danger/10 transition-all" title="Delete"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile */}
          <div className="lg:hidden">
            {paginated.map((cls, i) => (
              <div key={cls.id} className={`p-4 ${i % 2 === 0 ? "bg-bg-card" : "bg-bg/60"} ${i < paginated.length - 1 ? "border-b-2 border-border/80" : ""}`}>
                <div className="flex gap-3">
                  <div className="w-1 rounded-full flex-shrink-0 bg-primary" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-text text-sm truncate">{cls.name}</p>
                        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-secondary/10 text-secondary">Grade {cls.grade}</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 mb-2">
                      <div className="bg-bg rounded-lg px-2.5 py-2"><p className="text-[9px] font-semibold text-text-muted uppercase">Location</p><p className="text-xs font-medium text-text mt-0.5 truncate">{cls.location || "Not set"}</p></div>
                      <div className="bg-bg rounded-lg px-2.5 py-2"><p className="text-[9px] font-semibold text-text-muted uppercase">Schedule</p><p className="text-xs font-medium text-text mt-0.5 truncate">{cls.schedules?.length ? `${cls.schedules.length} slot${cls.schedules.length > 1 ? "s" : ""}` : "None"}</p></div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => setScheduleClass(cls)} className="flex-1 flex items-center justify-center py-2 rounded-lg text-primary bg-primary/10 hover:bg-primary/20 transition-all"><Clock className="w-4 h-4" /></button>
                      <button onClick={() => openEdit(cls)} className="flex-1 flex items-center justify-center py-2 rounded-lg text-primary bg-primary/10 hover:bg-primary/20 transition-all"><Pencil className="w-4 h-4" /></button>
                      <button onClick={() => setDeleteTarget(cls)} className="flex-1 flex items-center justify-center py-2 rounded-lg text-danger bg-danger/10 hover:bg-danger/20 transition-all"><Trash2 className="w-4 h-4" /></button>
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
      <Modal open={modalOpen} onClose={() => { setModalOpen(false); setSchedules([]); setEditingClass(null); }} title={editingClass ? "Edit Class" : "Create Class"}>
        <form onSubmit={handleSave} className="space-y-4">
          <Input id="cname" label="Class Name" placeholder="Math 101" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
          <div className="grid grid-cols-2 gap-4">
            <Input id="cgrade" label="Grade" type="number" value={String(form.grade)} onChange={e => setForm({ ...form, grade: Number(e.target.value) })} />
            <Input id="location" label="Location (optional)" placeholder="Room 201" value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} />
          </div>
          {/* Schedule rows only for create */}
          {!editingClass && (
            <div className="border-t border-border pt-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-medium text-text">Schedule <span className="text-text-muted font-normal">(optional)</span></p>
                <button type="button" onClick={addScheduleRow} className="text-xs text-primary font-medium hover:underline">+ Add time slot</button>
              </div>
              {schedules.map((s, idx) => (
                <div key={idx} className="flex items-end gap-2 mb-3">
                  <div className="flex-1">{idx === 0 && <label className="block text-xs font-medium text-text-muted mb-1">Day</label>}<select value={s.dayOfWeek} onChange={e => updateScheduleRow(idx, "dayOfWeek", Number(e.target.value))} className="w-full rounded-xl border border-border bg-bg-card px-3 py-2.5 text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/50">{DAYS.map((d, i) => <option key={i} value={i}>{d}</option>)}</select></div>
                  <div>{idx === 0 && <label className="block text-xs font-medium text-text-muted mb-1">Start</label>}<input type="time" value={s.startTime} onChange={e => updateScheduleRow(idx, "startTime", e.target.value)} className="rounded-xl border border-border bg-bg-card px-3 py-2.5 text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/50" /></div>
                  <div>{idx === 0 && <label className="block text-xs font-medium text-text-muted mb-1">End</label>}<input type="time" value={s.endTime} onChange={e => updateScheduleRow(idx, "endTime", e.target.value)} className="rounded-xl border border-border bg-bg-card px-3 py-2.5 text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/50" /></div>
                  <button type="button" onClick={() => removeScheduleRow(idx)} className="rounded-lg p-2 hover:bg-danger/10 text-text-muted hover:text-danger transition-colors mb-0.5"><Trash2 className="h-4 w-4" /></button>
                </div>
              ))}
              {schedules.length === 0 && <p className="text-xs text-text-muted">You can add schedules now or assign them later.</p>}
            </div>
          )}
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="ghost" type="button" onClick={() => { setModalOpen(false); setSchedules([]); setEditingClass(null); }}>Cancel</Button>
            <Button type="submit" loading={saving}>{editingClass ? "Update Class" : "Create Class"}</Button>
          </div>
        </form>
      </Modal>

      {/* Schedule Management Modal */}
      <Modal open={!!scheduleClass} onClose={() => setScheduleClass(null)} title={`Schedule — ${scheduleClass?.name ?? ""}`}>
        <div className="space-y-4">
          {/* Existing schedules */}
          {scheduleClass?.schedules?.length ? (
            <div className="space-y-2">
              {scheduleClass.schedules.map(s => (
                <div key={s.id} className="flex items-center justify-between rounded-xl bg-bg border border-border px-4 py-2.5">
                  <div className="flex items-center gap-3">
                    <Clock className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium text-text">{DAYS[s.dayOfWeek]}</span>
                    <span className="text-sm text-text-muted">{s.startTime.slice(0, 5)} – {s.endTime.slice(0, 5)}</span>
                  </div>
                  <button onClick={() => handleDeleteSchedule(s.id)} className="p-1.5 rounded-lg text-text-muted hover:text-danger hover:bg-danger/10 transition-all"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-text-muted text-center py-4">No schedules assigned yet</p>
          )}

          {/* Add new schedule */}
          <div className="border-t border-border pt-4">
            <p className="text-sm font-medium text-text mb-3">Add Schedule</p>
            <div className="flex items-end gap-2">
              <div className="flex-1">
                <label className="block text-xs font-medium text-text-muted mb-1">Day</label>
                <select value={newSchedule.dayOfWeek} onChange={e => setNewSchedule({ ...newSchedule, dayOfWeek: Number(e.target.value) })} className="w-full rounded-xl border border-border bg-bg-card px-3 py-2.5 text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/50">{DAYS.map((d, i) => <option key={i} value={i}>{d}</option>)}</select>
              </div>
              <div>
                <label className="block text-xs font-medium text-text-muted mb-1">Start</label>
                <input type="time" value={newSchedule.startTime} onChange={e => setNewSchedule({ ...newSchedule, startTime: e.target.value })} className="rounded-xl border border-border bg-bg-card px-3 py-2.5 text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/50" />
              </div>
              <div>
                <label className="block text-xs font-medium text-text-muted mb-1">End</label>
                <input type="time" value={newSchedule.endTime} onChange={e => setNewSchedule({ ...newSchedule, endTime: e.target.value })} className="rounded-xl border border-border bg-bg-card px-3 py-2.5 text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/50" />
              </div>
            </div>
            <Button className="w-full mt-3" onClick={handleAddSchedule} loading={addingSched}><Plus className="h-4 w-4" /> Add Schedule</Button>
          </div>
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
