"use client";
import { useEffect, useState, useCallback } from "react";
import { getClassrooms, createClassroom, updateClassroom, toggleClassroomStatus, deleteClassroom, getInstituteClasses } from "@/services/api";
import type { ClassroomResponse, InstituteClassResponse } from "@/lib/types";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { DoorOpen, CheckCircle, Users, BookOpen, Plus, Pencil, Trash2, MapPin } from "lucide-react";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import PageSkeleton from "@/components/ui/PageSkeleton";

const PAGE_SIZE = 10;
type StatusFilter = "ALL" | "ACTIVE" | "INACTIVE";
const emptyForm = { name: "", capacity: "", location: "" };

export default function ClassroomsPage() {
  const [rooms, setRooms] = useState<ClassroomResponse[]>([]);
  const [classes, setClasses] = useState<InstituteClassResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<StatusFilter>("ALL");
  const [page, setPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<ClassroomResponse | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ClassroomResponse | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([
      getClassrooms().then(setRooms),
      getInstituteClasses().then(setClasses),
    ]).finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setPage(1); }, [search, filterStatus]);

  const openAdd = () => { setEditing(null); setForm(emptyForm); setShowModal(true); };
  const openEdit = (r: ClassroomResponse) => { setEditing(r); setForm({ name: r.name, capacity: r.capacity?.toString() || "", location: r.location || "" }); setShowModal(true); };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { toast.error("Room name is required"); return; }
    setSaving(true);
    try {
      const payload = { name: form.name.trim(), capacity: form.capacity ? Number(form.capacity) : undefined, location: form.location.trim() || undefined };
      if (editing) { await updateClassroom(editing.id, payload); toast.success("Classroom updated"); }
      else { await createClassroom(payload); toast.success("Classroom created"); }
      setShowModal(false); load();
    } catch (err: any) { toast.error(err?.response?.data?.message || "Failed"); }
    finally { setSaving(false); }
  };

  const handleToggle = async (r: ClassroomResponse) => {
    setRooms(prev => prev.map(x => x.id === r.id ? { ...x, isActive: !x.isActive } : x));
    try { await toggleClassroomStatus(r.id); toast.success(r.isActive ? "Deactivated" : "Activated"); }
    catch { toast.error("Failed to update status"); setRooms(prev => prev.map(x => x.id === r.id ? { ...x, isActive: r.isActive } : x)); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try { await deleteClassroom(deleteTarget.id); toast.success("Classroom deleted"); setDeleteTarget(null); load(); }
    catch { toast.error("Failed to delete"); }
    finally { setDeleting(false); }
  };

  // Stats
  const activeCount = rooms.filter(r => r.isActive).length;
  const totalCapacity = rooms.reduce((sum, r) => sum + (r.capacity || 0), 0);
  const usedRoomIds = new Set(classes.filter(c => c.classroomId).map(c => c.classroomId));
  const inUseCount = rooms.filter(r => usedRoomIds.has(r.id)).length;

  // Filter + search
  const filtered = rooms.filter(r => {
    if (filterStatus === "ACTIVE" && !r.isActive) return false;
    if (filterStatus === "INACTIVE" && r.isActive) return false;
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return r.name.toLowerCase().includes(q) || (r.location?.toLowerCase().includes(q) ?? false);
  });

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const pageNums = Array.from({ length: totalPages }, (_, i) => i + 1)
    .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
    .reduce<(number | string)[]>((acc, p, idx, arr) => { if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push("..."); acc.push(p); return acc; }, []);

  if (loading && !rooms.length) return <PageSkeleton />;

  return (
    <>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h2 className="text-lg font-semibold text-text">Classrooms</h2>
          <p className="text-xs text-text-muted mt-0.5">{rooms.length} room{rooms.length !== 1 ? "s" : ""} total</p>
        </div>
        <Button size="sm" onClick={openAdd} className="text-xs"><Plus className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Add Classroom</span><span className="sm:hidden">Add</span></Button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: "TOTAL ROOMS", value: rooms.length, sub: "All classrooms", gradient: "from-[#4F46E5] to-[#3730A3]", accentColor: "#4F46E5", icon: <DoorOpen className="w-5 h-5" /> },
          { label: "ACTIVE", value: activeCount, sub: `${rooms.length ? Math.round((activeCount / rooms.length) * 100) : 0}% available`, gradient: "from-emerald-500 to-emerald-600", accentColor: "#10b981", icon: <CheckCircle className="w-5 h-5" /> },
          { label: "TOTAL CAPACITY", value: totalCapacity || "—", sub: totalCapacity ? "Seats across all rooms" : "No capacity set", gradient: "from-violet-500 to-purple-600", accentColor: "#8b5cf6", icon: <Users className="w-5 h-5" /> },
          { label: "ROOMS IN USE", value: inUseCount, sub: `${rooms.length - inUseCount} unassigned`, gradient: "from-amber-500 to-orange-500", accentColor: "#f59e0b", icon: <BookOpen className="w-5 h-5" /> },
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
              <p className="text-[11px] text-slate-400 mt-2">{card.sub}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Search + Filter */}
      <div className="bg-bg-card rounded-2xl shadow-sm border border-border p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
          <div className="relative flex-1">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or location..."
              className="w-full pl-10 pr-4 py-2.5 border border-border rounded-xl text-sm text-text bg-bg-card placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
          </div>
          {(search || filterStatus !== "ALL") && (
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className="text-[11px] font-medium text-text-muted">{filtered.length} found</span>
              <button onClick={() => { setSearch(""); setFilterStatus("ALL"); }} className="text-[11px] font-semibold text-primary hover:underline">Clear all</button>
            </div>
          )}
        </div>
        <div className="flex items-center gap-3 mt-3">
          <div className="flex items-center bg-slate-100/80 rounded-xl p-0.5">
            {(["ALL", "ACTIVE", "INACTIVE"] as StatusFilter[]).map(s => (
              <button key={s} onClick={() => setFilterStatus(s)}
                className={`relative px-3.5 py-1.5 rounded-[10px] text-xs font-semibold transition-all whitespace-nowrap ${filterStatus === s ? "text-white shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
                style={filterStatus === s ? { background: s === "INACTIVE" ? "linear-gradient(135deg, #EF4444, #DC2626)" : s === "ACTIVE" ? "linear-gradient(135deg, #10B981, #059669)" : "linear-gradient(135deg, #4F46E5, #3730A3)" } : {}}>
                {s === "ALL" ? "All" : s === "ACTIVE" ? "● Active" : "● Inactive"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Table */}
      {!filtered.length && !loading ? (
        <div className="bg-bg-card rounded-2xl shadow-sm border border-border p-12 text-center">
          <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-primary/10 flex items-center justify-center"><DoorOpen className="w-7 h-7 text-primary/40" /></div>
          <p className="text-sm font-medium text-text-muted">No classrooms found</p>
        </div>
      ) : (
        <div className="bg-bg-card rounded-2xl shadow-sm border border-border overflow-hidden">

          {/* Desktop Table */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  {["Classroom", "Location", "Capacity", "Classes Assigned", "Status", "Action"].map(h => (
                    <th key={h} className="text-left px-5 py-3.5 text-xs font-semibold text-text-muted uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginated.map(r => {
                  const assignedClasses = classes.filter(c => c.classroomId === r.id);
                  return (
                    <tr key={r.id} className="border-b border-border/50 hover:bg-bg/50 transition-colors">
                      <td className="px-5 py-3.5">
                        <p className="text-sm font-medium text-text">{r.name}</p>
                      </td>
                      <td className="px-5 py-3.5">
                        {r.location ? (
                          <div className="flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-text-muted flex-shrink-0" />
                            <span className="text-sm text-text-muted">{r.location}</span>
                          </div>
                        ) : <span className="text-xs text-text-muted">—</span>}
                      </td>
                      <td className="px-5 py-3.5">
                        {r.capacity ? (
                          <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-secondary/15 text-cyan-800">{r.capacity}</span>
                        ) : <span className="text-xs text-text-muted">—</span>}
                      </td>
                      <td className="px-5 py-3.5">
                        {assignedClasses.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {assignedClasses.slice(0, 3).map(c => (
                              <span key={c.id} className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700">{c.name}</span>
                            ))}
                            {assignedClasses.length > 3 && (
                              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-500">+{assignedClasses.length - 3}</span>
                            )}
                          </div>
                        ) : <span className="text-xs text-text-muted">—</span>}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <button onClick={() => handleToggle(r)} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${r.isActive ? "bg-emerald-500" : "bg-red-500"}`}>
                            <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${r.isActive ? "translate-x-6" : "translate-x-1"}`} />
                          </button>
                          <span className={`text-xs font-semibold ${r.isActive ? "text-emerald-700" : "text-red-600"}`}>{r.isActive ? "Active" : "Inactive"}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-1">
                          <button onClick={() => openEdit(r)} className="p-1.5 text-text-muted hover:text-primary transition-colors" title="Edit"><Pencil className="w-4 h-4" /></button>
                          <button onClick={() => setDeleteTarget(r)} className="p-1.5 text-text-muted hover:text-danger transition-colors" title="Delete"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="lg:hidden">
            {paginated.map((r, i) => {
              const assignedClasses = classes.filter(c => c.classroomId === r.id);
              return (
                <div key={r.id} className={`p-4 ${i % 2 === 0 ? "bg-bg-card" : "bg-bg/60"} ${i < paginated.length - 1 ? "border-b-2 border-border/80" : ""}`}>
                  <div className="flex gap-3">
                    <div className={`w-1 flex-shrink-0 rounded-full self-stretch ${r.isActive ? "bg-success" : "bg-danger"}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div>
                          <p className="font-semibold text-text text-sm">{r.name}</p>
                          {r.location && (
                            <div className="flex items-center gap-1 mt-0.5">
                              <MapPin className="w-3 h-3 text-text-muted" />
                              <p className="text-[10px] text-text-muted">{r.location}</p>
                            </div>
                          )}
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${r.isActive ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>
                          {r.isActive ? "Active" : "Inactive"}
                        </span>
                      </div>

                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-text-muted">Status</span>
                        <div className="flex items-center gap-2">
                          <button onClick={() => handleToggle(r)} className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${r.isActive ? "bg-emerald-500" : "bg-red-500"}`}>
                            <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-sm transition-transform ${r.isActive ? "translate-x-[18px]" : "translate-x-0.5"}`} />
                          </button>
                          <span className={`text-xs font-semibold ${r.isActive ? "text-emerald-700" : "text-red-600"}`}>{r.isActive ? "Active" : "Inactive"}</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 mb-2">
                        <div className="bg-white rounded-lg px-2.5 py-2 shadow-[0_1px_4px_rgba(0,0,0,0.08)] border border-slate-100">
                          <p className="text-[9px] font-semibold text-text-muted uppercase">Capacity</p>
                          <p className="text-xs font-medium text-text mt-0.5">{r.capacity ?? "—"}</p>
                        </div>
                        <div className="bg-white rounded-lg px-2.5 py-2 shadow-[0_1px_4px_rgba(0,0,0,0.08)] border border-slate-100">
                          <p className="text-[9px] font-semibold text-text-muted uppercase">Classes</p>
                          <p className="text-xs font-medium text-text mt-0.5">{assignedClasses.length}</p>
                        </div>
                      </div>

                      {assignedClasses.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-2">
                          {assignedClasses.slice(0, 3).map(c => (
                            <span key={c.id} className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700">{c.name}</span>
                          ))}
                          {assignedClasses.length > 3 && (
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-500">+{assignedClasses.length - 3}</span>
                          )}
                        </div>
                      )}

                      <div className="flex items-center gap-2">
                        <button onClick={() => openEdit(r)} className="flex-1 flex items-center justify-center py-2 rounded-lg text-primary bg-primary/10 hover:bg-primary/20 transition-all"><Pencil className="w-4 h-4" /></button>
                        <button onClick={() => setDeleteTarget(r)} className="flex-1 flex items-center justify-center py-2 rounded-lg text-danger bg-danger/10 hover:bg-danger/20 transition-all"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-5 py-3 border-t border-border bg-bg/40">
              <p className="text-xs text-text-muted">Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}</p>
              <div className="flex items-center gap-1">
                <button onClick={() => setPage(1)} disabled={page === 1} className="px-2 py-1 text-xs rounded-md text-text-muted hover:bg-border/50 disabled:opacity-30 transition">«</button>
                <button onClick={() => setPage(page - 1)} disabled={page === 1} className="px-2 py-1 text-xs rounded-md text-text-muted hover:bg-border/50 disabled:opacity-30 transition">‹</button>
                {pageNums.map((item, idx) => typeof item === "string"
                  ? <span key={`d${idx}`} className="px-1 text-xs text-text-muted">…</span>
                  : <button key={item} onClick={() => setPage(item)} className={`min-w-[28px] py-1 text-xs rounded-md font-semibold transition ${page === item ? "text-white shadow-sm bg-primary" : "text-text-muted hover:bg-border/50"}`}>{item}</button>
                )}
                <button onClick={() => setPage(page + 1)} disabled={page === totalPages} className="px-2 py-1 text-xs rounded-md text-text-muted hover:bg-border/50 disabled:opacity-30 transition">›</button>
                <button onClick={() => setPage(totalPages)} disabled={page === totalPages} className="px-2 py-1 text-xs rounded-md text-text-muted hover:bg-border/50 disabled:opacity-30 transition">»</button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Create / Edit Modal */}
      <Modal open={showModal} onClose={() => setShowModal(false)} title="" className="max-w-md p-0">
        <form onSubmit={handleSave}>
          <div className="bg-gradient-to-r from-primary to-primary-dark px-6 py-5 rounded-t-2xl">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-white/20 flex items-center justify-center">
                {editing ? <span className="text-white font-bold text-lg">{editing.name.charAt(0).toUpperCase()}</span> : <DoorOpen className="w-5 h-5 text-white" />}
              </div>
              <div>
                <h2 className="text-white font-semibold text-base">{editing ? "Edit Classroom" : "New Classroom"}</h2>
                <p className="text-white/60 text-xs mt-0.5">{editing ? editing.name : "Fill in the details below"}</p>
              </div>
            </div>
          </div>
          <div className="px-6 py-5 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-text-muted mb-1.5">Room Name <span className="text-danger">*</span></label>
              <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Room A" required
                className="w-full px-4 py-2.5 rounded-xl border border-border bg-bg-card text-sm text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-text-muted mb-1.5">Capacity</label>
                <input type="number" min="1" value={form.capacity} onChange={e => setForm(p => ({ ...p, capacity: e.target.value }))} placeholder="e.g. 30"
                  className="w-full px-4 py-2.5 rounded-xl border border-border bg-bg-card text-sm text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-text-muted mb-1.5">Location</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted/50 pointer-events-none" />
                  <input value={form.location} onChange={e => setForm(p => ({ ...p, location: e.target.value }))} placeholder="e.g. 2nd Floor"
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-border bg-bg-card text-sm text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border bg-bg/40">
            <Button variant="ghost" type="button" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button type="submit" loading={saving}>{editing ? "Update" : "Create"}</Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setDeleteTarget(null)} />
          <div className="relative z-10 bg-bg-card rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center border border-border">
            <div className="w-12 h-12 rounded-2xl bg-danger/10 flex items-center justify-center mx-auto mb-4"><Trash2 className="w-6 h-6 text-danger" /></div>
            <h3 className="text-base font-semibold text-text">Delete Classroom</h3>
            <p className="text-sm text-text-muted mt-1">Permanently delete <span className="font-semibold text-text">{deleteTarget.name}</span>?</p>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setDeleteTarget(null)} className="flex-1 h-10 rounded-xl border border-border text-sm font-semibold text-text hover:bg-bg transition-all">Cancel</button>
              <button onClick={handleDelete} disabled={deleting} className="flex-1 h-10 rounded-xl text-sm font-semibold text-white bg-danger hover:bg-danger/90 transition-all disabled:opacity-60">{deleting ? "Deleting..." : "Delete"}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
