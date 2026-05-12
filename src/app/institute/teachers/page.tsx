"use client";
import { useEffect, useState } from "react";
import { getInstituteTeachers, createInstituteTeacher, toggleInstituteTeacherStatus, deleteInstituteTeacher } from "@/services/api";
import type { InstituteTeacherResponse } from "@/lib/types";
import { toast } from "sonner";

const inputCls = "mt-1 w-full px-4 py-2.5 rounded-xl bg-bg border border-border text-text text-sm placeholder:text-text-muted outline-none focus:border-indigo-400 focus:shadow-[0_0_0_3px_rgba(79,70,229,0.08)] transition-all";
const cancelBtnCls = "flex-1 py-2.5 rounded-xl text-sm font-medium text-text-muted bg-bg hover:bg-border transition-colors cursor-pointer";
const primaryBtnStyle = { background: "linear-gradient(135deg, #4F46E5, #3730A3)" };

export default function InstituteTeachersPage() {
  const [teachers, setTeachers] = useState<InstituteTeacherResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", phone: "", subject: "" });
  const [saving, setSaving] = useState(false);

  const load = () => getInstituteTeachers().then(setTeachers).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await createInstituteTeacher(form);
      toast.success("Teacher created");
      setShowModal(false);
      setForm({ name: "", email: "", phone: "", subject: "" });
      load();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to create teacher");
    } finally { setSaving(false); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-text">Teachers</h2>
          <p className="text-text-muted text-sm mt-1">{teachers.length} teacher{teachers.length !== 1 ? "s" : ""}</p>
        </div>
        <button onClick={() => setShowModal(true)} className="px-4 py-2.5 rounded-xl text-sm font-semibold text-white cursor-pointer transition-all hover:opacity-90 shadow-md" style={primaryBtnStyle}>
          + Add Teacher
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40"><div className="animate-spin w-7 h-7 border-2 border-indigo-500 border-t-transparent rounded-full" /></div>
      ) : (
        <div className="bg-bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-bg">
                <th className="text-left px-6 py-4 text-text-muted font-medium">Name</th>
                <th className="text-left px-6 py-4 text-text-muted font-medium hidden md:table-cell">Email</th>
                <th className="text-left px-6 py-4 text-text-muted font-medium hidden lg:table-cell">Subject</th>
                <th className="text-left px-6 py-4 text-text-muted font-medium">Status</th>
                <th className="text-right px-6 py-4 text-text-muted font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {teachers.length === 0 && <tr><td colSpan={5} className="text-center py-12 text-text-muted">No teachers yet</td></tr>}
              {teachers.map(t => (
                <tr key={t.id} className="border-b border-border hover:bg-bg transition-colors">
                  <td className="px-6 py-4">
                    <p className="font-medium text-text">{t.name}</p>
                    <p className="text-xs text-text-muted">{t.username}</p>
                  </td>
                  <td className="px-6 py-4 text-text-muted hidden md:table-cell">{t.email}</td>
                  <td className="px-6 py-4 text-text-muted hidden lg:table-cell">{t.subject}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${t.status === "ACTIVE" ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-600"}`}>
                      {t.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => { toggleInstituteTeacherStatus(t.id).then(load); }} className="px-3 py-1.5 rounded-lg text-xs font-medium text-text-muted hover:bg-bg border border-border transition-colors cursor-pointer">
                        {t.status === "ACTIVE" ? "Deactivate" : "Activate"}
                      </button>
                      <button onClick={() => { if (!confirm("Delete this teacher?")) return; deleteInstituteTeacher(t.id).then(() => { toast.success("Deleted"); load(); }); }} className="px-3 py-1.5 rounded-lg text-xs font-medium text-red-500 hover:bg-red-50 transition-colors cursor-pointer">
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-bg-card border border-border rounded-2xl w-full max-w-md p-6 shadow-xl">
            <h3 className="text-lg font-bold text-text mb-5">Add Teacher</h3>
            <form onSubmit={handleCreate} className="space-y-4">
              {(["name", "email", "phone", "subject"] as const).map(field => (
                <div key={field}>
                  <label className="text-sm font-medium text-text-muted capitalize">{field}</label>
                  <input type={field === "email" ? "email" : "text"} value={form[field]} onChange={e => setForm(p => ({ ...p, [field]: e.target.value }))} required={field !== "phone"} placeholder={`Enter ${field}`} className={inputCls} />
                </div>
              ))}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className={cancelBtnCls}>Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60 cursor-pointer" style={primaryBtnStyle}>
                  {saving ? "Creating..." : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
