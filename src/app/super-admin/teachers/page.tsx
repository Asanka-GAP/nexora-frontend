"use client";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { getTeachers, createTeacher, toggleTeacherStatus, deleteTeacher, getTeacherBilling } from "@/services/api";
import type { TeacherItem, CurrentMonthUsage, BillingHistory } from "@/lib/types";

export default function TeachersPage() {
  const [teachers, setTeachers] = useState<TeacherItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", phone: "", subject: "" });
  const [saving, setSaving] = useState(false);
  const [billingModalOpen, setBillingModalOpen] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState<{ id: string; name: string } | null>(null);
  const [billingData, setBillingData] = useState<{ teacherName: string; currentMonth: CurrentMonthUsage; billingHistory: BillingHistory } | null>(null);
  const [billingLoading, setBillingLoading] = useState(false);

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

  const handleViewBilling = async (teacher: { id: string; name: string }) => {
    setSelectedTeacher(teacher);
    setBillingModalOpen(true);
    setBillingLoading(true);
    try {
      const data = await getTeacherBilling(teacher.id);
      setBillingData(data);
    } catch (error) {
      toast.error("Failed to load billing data");
      setBillingData(null);
    } finally {
      setBillingLoading(false);
    }
  };

  const formatCurrency = (amount: number) => `LKR ${amount.toFixed(2)}`;

  const inputCls = "w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm placeholder:text-slate-500 outline-none focus:border-indigo-500";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div><h2 className="text-lg font-semibold text-white">Teachers</h2><p className="text-xs text-slate-500">{teachers.length} total</p></div>
        <button onClick={() => setModalOpen(true)} className="px-4 py-2 rounded-xl text-sm font-semibold text-white cursor-pointer" style={{ background: "linear-gradient(135deg, #4F46E5, #3730A3)" }}>+ Add Teacher</button>
      </div>

      {loading ? (
        <p className="text-slate-500 text-center py-12">Loading...</p>
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
                        <button onClick={() => handleViewBilling({ id: t.id, name: t.name })} className="text-xs text-emerald-400 hover:text-emerald-300 font-medium cursor-pointer">Billing</button>
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

      {/* Billing Modal */}
      {billingModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setBillingModalOpen(false)} />
          <div className="relative z-10 w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-2xl shadow-xl max-h-[90vh] overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-white">Billing History</h2>
                <p className="text-sm text-slate-400">{selectedTeacher?.name}</p>
              </div>
              <button onClick={() => setBillingModalOpen(false)} className="text-slate-400 hover:text-white transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              {billingLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
                  <span className="ml-3 text-slate-400">Loading billing data...</span>
                </div>
              ) : !billingData ? (
                <div className="text-center py-12">
                  <p className="text-slate-400">Failed to load billing data</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Current Month Stats */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                      { label: "Total Cost", value: formatCurrency(billingData.currentMonth.totalCurrentCost), sub: billingData.currentMonth.monthDisplay, color: "from-indigo-500 to-purple-500" },
                      { label: "SMS Units", value: billingData.currentMonth.currentUnits, sub: `${billingData.currentMonth.messagesSent} messages`, color: "from-emerald-500 to-teal-500" },
                      { label: "SMS Cost", value: formatCurrency(billingData.currentMonth.currentSmsCost), sub: "@ LKR 1.30/unit", color: "from-violet-500 to-purple-500" },
                      { label: "Software", value: formatCurrency(billingData.currentMonth.softwareCost), sub: "Monthly fee", color: "from-amber-500 to-orange-500" },
                    ].map((stat, i) => (
                      <div key={i} className="bg-slate-800 rounded-xl p-4 border border-slate-700">
                        <div className="flex items-start justify-between mb-2">
                          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{stat.label}</p>
                          <div className={`w-6 h-6 rounded-lg bg-gradient-to-br ${stat.color} flex items-center justify-center`}>
                            <span className="text-white text-xs font-bold">{i + 1}</span>
                          </div>
                        </div>
                        <p className="text-xl font-bold text-white">{stat.value}</p>
                        <p className="text-[10px] text-slate-500 mt-1">{stat.sub}</p>
                      </div>
                    ))}
                  </div>

                  {/* Billing History Table */}
                  {billingData.billingHistory.monthlyBills.length > 0 && (
                    <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
                      <div className="px-4 py-3 border-b border-slate-700">
                        <h3 className="font-semibold text-white text-sm">Monthly History</h3>
                        <p className="text-xs text-slate-400">{billingData.billingHistory.monthlyBills.length} months</p>
                      </div>
                      
                      {/* Desktop Table */}
                      <div className="hidden lg:block overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-slate-700">
                              <th className="text-left py-3 px-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Month</th>
                              <th className="text-right py-3 px-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Messages</th>
                              <th className="text-right py-3 px-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">SMS Units</th>
                              <th className="text-right py-3 px-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">SMS Cost</th>
                              <th className="text-right py-3 px-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Software</th>
                              <th className="text-right py-3 px-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Total</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-700">
                            {billingData.billingHistory.monthlyBills.slice(0, 10).map((bill) => (
                              <tr key={bill.month} className="hover:bg-slate-700/50 transition-colors">
                                <td className="py-3 px-4">
                                  <div>
                                    <div className="font-medium text-slate-200">{bill.monthDisplay}</div>
                                    <div className="text-xs text-slate-500">{bill.month}</div>
                                  </div>
                                </td>
                                <td className="text-right py-3 px-4">
                                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                                    bill.messagesSent === 0 ? "bg-slate-700 text-slate-400" :
                                    bill.messagesSent < 50 ? "bg-emerald-500/10 text-emerald-400" :
                                    bill.messagesSent < 150 ? "bg-amber-500/10 text-amber-400" :
                                    "bg-red-500/10 text-red-400"
                                  }`}>
                                    {bill.messagesSent}
                                  </span>
                                </td>
                                <td className="text-right py-3 px-4">
                                  <div className="font-medium text-slate-200">{bill.smsUnits}</div>
                                  <div className="text-xs text-slate-500">units</div>
                                </td>
                                <td className="text-right py-3 px-4 font-medium text-slate-200">{formatCurrency(bill.smsCost)}</td>
                                <td className="text-right py-3 px-4 font-medium text-slate-200">{formatCurrency(bill.softwareCost)}</td>
                                <td className="text-right py-3 px-4 font-bold text-lg text-indigo-400">{formatCurrency(bill.totalCost)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* Mobile Cards */}
                      <div className="lg:hidden divide-y divide-slate-700">
                        {billingData.billingHistory.monthlyBills.slice(0, 10).map((bill, i) => (
                          <div key={bill.month} className="p-4">
                            <div className="flex items-start justify-between mb-3">
                              <div>
                                <p className="font-medium text-slate-200">{bill.monthDisplay}</p>
                                <p className="text-xs text-slate-500">{bill.month}</p>
                              </div>
                              <div className="text-right">
                                <p className="font-bold text-lg text-indigo-400">{formatCurrency(bill.totalCost)}</p>
                                <p className="text-xs text-slate-500">Total</p>
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              <div className="bg-slate-700/50 rounded-lg p-3">
                                <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Messages</p>
                                <p className="text-sm font-medium text-slate-200 mt-1">{bill.messagesSent}</p>
                              </div>
                              <div className="bg-slate-700/50 rounded-lg p-3">
                                <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">SMS Units</p>
                                <p className="text-sm font-medium text-slate-200 mt-1">{bill.smsUnits}</p>
                              </div>
                              <div className="bg-slate-700/50 rounded-lg p-3">
                                <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">SMS Cost</p>
                                <p className="text-sm font-medium text-slate-200 mt-1">{formatCurrency(bill.smsCost)}</p>
                              </div>
                              <div className="bg-slate-700/50 rounded-lg p-3">
                                <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Software</p>
                                <p className="text-sm font-medium text-slate-200 mt-1">{formatCurrency(bill.softwareCost)}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {billingData.billingHistory.monthlyBills.length === 0 && (
                    <div className="bg-slate-800 rounded-xl border border-slate-700 p-8 text-center">
                      <p className="text-slate-400">No billing history available</p>
                      <p className="text-xs text-slate-500 mt-1">This teacher hasn't used SMS services yet</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
