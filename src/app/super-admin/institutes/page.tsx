"use client";
import { useEffect, useState } from "react";
import { getInstitutes, createInstitute, toggleInstituteStatus, deleteInstitute } from "@/services/api";
import type { InstituteResponse } from "@/lib/types";
import { toast } from "sonner";

export default function SuperAdminInstitutesPage() {
  const [institutes, setInstitutes] = useState<InstituteResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "", phone: "", address: "" });

  const load = () => getInstitutes().then(setInstitutes).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await createInstitute({ name: form.name, email: form.email, password: form.password, phone: form.phone || undefined, address: form.address || undefined });
      toast.success("Institute created");
      setShowModal(false);
      setForm({ name: "", email: "", password: "", phone: "", address: "" });
      load();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to create institute");
    } finally { setSaving(false); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Institutes</h2>
          <p className="text-slate-400 text-sm mt-0.5">{institutes.length} institute{institutes.length !== 1 ? "s" : ""}</p>
        </div>
        <button onClick={() => setShowModal(true)} className="px-4 py-2.5 rounded-xl text-sm font-semibold text-white cursor-pointer hover:opacity-90 transition-all" style={{ background: "linear-gradient(135deg, #4F46E5, #3730A3)" }}>
          + Add Institute
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40"><div className="animate-spin w-7 h-7 border-2 border-indigo-500 border-t-transparent rounded-full" /></div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800">
                <th className="text-left px-6 py-4 text-slate-400 font-medium">Institute</th>
                <th className="text-left px-6 py-4 text-slate-400 font-medium hidden md:table-cell">Email</th>
                <th className="text-left px-6 py-4 text-slate-400 font-medium hidden lg:table-cell">Phone</th>
                <th className="text-left px-6 py-4 text-slate-400 font-medium">Status</th>
                <th className="text-right px-6 py-4 text-slate-400 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {institutes.length === 0 && <tr><td colSpan={5} className="text-center py-12 text-slate-500">No institutes yet</td></tr>}
              {institutes.map(inst => (
                <tr key={inst.id} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                  <td className="px-6 py-4">
                    <p className="font-medium text-white">{inst.name}</p>
                    {inst.address && <p className="text-xs text-slate-500">{inst.address}</p>}
                  </td>
                  <td className="px-6 py-4 text-slate-300 hidden md:table-cell">{inst.email}</td>
                  <td className="px-6 py-4 text-slate-300 hidden lg:table-cell">{inst.phone || "—"}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${inst.status === "ACTIVE" ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"}`}>
                      {inst.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={async () => { await toggleInstituteStatus(inst.id); load(); }} className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:bg-slate-700 transition-colors cursor-pointer">
                        {inst.status === "ACTIVE" ? "Deactivate" : "Activate"}
                      </button>
                      <button onClick={async () => { if (!confirm("Delete this institute and all its data?")) return; await deleteInstitute(inst.id); toast.success("Deleted"); load(); }} className="px-3 py-1.5 rounded-lg text-xs font-medium text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer">
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
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md p-6">
            <h3 className="text-lg font-bold text-white mb-5">Create Institute</h3>
            <form onSubmit={handleCreate} className="space-y-4">
              {([
                { key: "name", label: "Institute Name", required: true },
                { key: "email", label: "Admin Email", required: true, type: "email" },
                { key: "password", label: "Admin Password", required: true, type: "password" },
                { key: "phone", label: "Phone", required: false },
                { key: "address", label: "Address", required: false },
              ] as const).map(f => (
                <div key={f.key}>
                  <label className="text-sm font-medium text-slate-400">{f.label}</label>
                  <input
                    type={(f as any).type || "text"}
                    value={form[f.key]}
                    onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                    required={f.required}
                    placeholder={`Enter ${f.label.toLowerCase()}`}
                    className="mt-1 w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm placeholder:text-slate-500 outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>
              ))}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-2.5 rounded-xl text-sm font-medium text-slate-400 bg-slate-800 hover:bg-slate-700 transition-colors cursor-pointer">Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60 cursor-pointer" style={{ background: "linear-gradient(135deg, #4F46E5, #3730A3)" }}>
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
