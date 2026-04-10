"use client";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { getTeachers, createTeacher, toggleTeacherStatus, deleteTeacher } from "@/services/api";
import type { TeacherItem } from "@/lib/types";

export default function TeachersPage() {
  const [teachers, setTeachers] = useState<TeacherItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", phone: "", subject: "" });
  const [saving, setSaving] = useState(false);

  const load = () => { getTeachers().then(setTeachers).catch(() => {}).finally(() => setLoading(false)); };
  useEffect(load, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.subject) { toast.error("Name, email and subject are required"); return; }
    setSaving(true);
    try {
      await createTeacher(form);
      toast.success("Teacher created! Credentials sent to email.");
      setModalOpen(false); setForm({ name: "", email: "", phone: "", subject: "" }); load();
    } catch (err: unknown) {
      toast.error((err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Failed to create teacher");
    } finally { setSaving(false); }
  };

  const handleToggle = async (id: string) => {
    try { await toggleTeacherStatus(id); load(); toast.success("Status updated"); }
    catch { toast.error("Failed to update status"); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this teacher?")) return;
    try { await deleteTeacher(id); load(); toast.success("Teacher deleted"); }
    catch { toast.error("Failed to delete"); }
  };

  const inputCls = "w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm placeholder:text-slate-500 outline-none focus:border-indigo-500";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div><h2 className="text-lg font-semibold text-white">Teachers</h2><p className="text-xs text-slate-500">{teachers.length} total</p></div>
        <button onClick={() => setModalOpen(true)} className="px-4 py-2 rounded-xl text-sm font-semibold text-white cursor-pointer" style={{ background: "linear-gradient(135deg, #4F46E5, #3730A3)" }}>+ Add Teacher</button>
      </div>

      {loading ? (
        <div className="space-y-3">{[...Array(3)].map((_, i) => (<div key={i} className="bg-slate-900 rounded-xl p-4 border border-slate-800 animate-pulse"><div className="h-4 bg-slate-800 rounded w-40" /></div>))}</div>
      ) : !teachers.length ? (
        <div className="bg-slate-900 rounded-2xl border border-slate-800 p-12 text-center"><p className="text-slate-500">No teachers yet. Add your first teacher.</p></div>
      ) : (
        <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-slate-800 text-left">
                <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Name</th>
                <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Subject</th>
                <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider hidden md:table-cell">Username</th>
                <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider hidden sm:table-cell">Email</th>
                <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider hidden lg:table-cell">First Login</th>
                <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Actions</th>
              </tr></thead>
              <tbody className="divide-y divide-slate-800">
                {teachers.map(t => (
                  <tr key={t.id} className="hover:bg-slate-800/50 transition-colors">
                    <td className="px-4 py-3 text-slate-200 font-medium">{t.name}</td>
                    <td className="px-4 py-3"><span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400">{t.subject || "—"}</span></td>
                    <td className="px-4 py-3 text-slate-400 hidden md:table-cell">{t.username}</td>
                    <td className="px-4 py-3 text-slate-400 hidden sm:table-cell">{t.email}</td>
                    <td className="px-4 py-3"><span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${t.status === "ACTIVE" ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"}`}>{t.status}</span></td>
                    <td className="px-4 py-3 hidden lg:table-cell"><span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${t.firstLogin ? "bg-amber-500/10 text-amber-400" : "bg-slate-800 text-slate-400"}`}>{t.firstLogin ? "Pending" : "Done"}</span></td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button onClick={() => handleToggle(t.id)} className="text-xs text-indigo-400 hover:text-indigo-300 font-medium cursor-pointer">{t.status === "ACTIVE" ? "Disable" : "Enable"}</button>
                        <button onClick={() => handleDelete(t.id)} className="text-xs text-red-400 hover:text-red-300 font-medium cursor-pointer">Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Teacher Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setModalOpen(false)} />
          <div className="relative z-10 w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
            <h2 className="text-lg font-semibold text-white mb-4">Add Teacher</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-400 block mb-1">Full Name <span className="text-red-400">*</span></label>
                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="John Doe" required className={inputCls} />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-400 block mb-1">Subject <span className="text-red-400">*</span></label>
                <input value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} placeholder="Mathematics" required className={inputCls} />
                <p className="text-[11px] text-slate-600 mt-1">This subject will auto-fill when the teacher creates classes</p>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-400 block mb-1">Email <span className="text-red-400">*</span></label>
                <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="teacher@school.com" required className={inputCls} />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-400 block mb-1">Phone <span className="text-slate-600">(optional)</span></label>
                <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="+94 77 123 4567" className={inputCls} />
              </div>
              <div className="bg-slate-800 rounded-xl p-3 border border-slate-700"><p className="text-xs text-slate-400">📧 Username and password will be auto-generated and sent to the teacher&apos;s email. They must change their password on first login.</p></div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 rounded-xl text-sm font-medium text-slate-400 hover:bg-slate-800 transition-colors cursor-pointer">Cancel</button>
                <button type="submit" disabled={saving} className="px-4 py-2 rounded-xl text-sm font-semibold text-white disabled:opacity-50 cursor-pointer" style={{ background: "linear-gradient(135deg, #4F46E5, #3730A3)" }}>{saving ? "Creating..." : "Create Teacher"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
