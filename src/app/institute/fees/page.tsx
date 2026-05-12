"use client";
import { useEffect, useState } from "react";
import { getFeePayments, updateFeePaymentStatus, getInstituteClasses, setClassFee } from "@/services/api";
import type { FeePaymentResponse, InstituteClassResponse } from "@/lib/types";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { CreditCard, CheckCircle, Clock, AlertCircle } from "lucide-react";

const inputCls = "mt-1 w-full px-4 py-2.5 rounded-xl bg-bg border border-border text-text text-sm placeholder:text-text-muted outline-none focus:border-indigo-400 focus:shadow-[0_0_0_3px_rgba(79,70,229,0.08)] transition-all";
const selectCls = "mt-1 w-full px-4 py-2.5 rounded-xl bg-bg border border-border text-text text-sm outline-none focus:border-indigo-400 transition-all";
const cancelBtnCls = "flex-1 py-2.5 rounded-xl text-sm font-medium text-text-muted bg-bg hover:bg-border transition-colors cursor-pointer";
const primaryBtnStyle = { background: "linear-gradient(135deg, #4F46E5, #3730A3)" };

const STATUS_BADGE: Record<string, string> = {
  PAID: "bg-emerald-100 text-emerald-700",
  PENDING: "bg-amber-100 text-amber-700",
  OVERDUE: "bg-red-100 text-red-600",
  WAIVED: "bg-slate-100 text-slate-500",
};

export default function InstituteFeesPage() {
  const now = new Date();
  const defaultMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const [yearMonth, setYearMonth] = useState(defaultMonth);
  const [payments, setPayments] = useState<FeePaymentResponse[]>([]);
  const [classes, setClasses] = useState<InstituteClassResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFeeModal, setShowFeeModal] = useState(false);
  const [feeForm, setFeeForm] = useState({ classId: "", amount: "", feeLabel: "" });
  const [savingFee, setSavingFee] = useState(false);

  const load = () => { setLoading(true); Promise.all([getFeePayments(yearMonth).then(setPayments), getInstituteClasses().then(setClasses)]).finally(() => setLoading(false)); };
  useEffect(() => { load(); }, [yearMonth]);

  const handleStatusChange = async (paymentId: string, status: string) => {
    try { await updateFeePaymentStatus(paymentId, { status }); toast.success("Payment status updated"); load(); }
    catch { toast.error("Failed to update"); }
  };

  const handleSetFee = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingFee(true);
    try { await setClassFee(feeForm.classId, { amount: Number(feeForm.amount), feeLabel: feeForm.feeLabel || undefined }); toast.success("Fee set successfully"); setShowFeeModal(false); setFeeForm({ classId: "", amount: "", feeLabel: "" }); }
    catch (err: any) { toast.error(err?.response?.data?.message || "Failed"); }
    finally { setSavingFee(false); }
  };

  const summary = [
    { label: "TOTAL", value: payments.length, gradient: "from-indigo-500 to-purple-600", accentColor: "#4F46E5", icon: <CreditCard className="w-5 h-5" />, sub: "Fee records" },
    { label: "PAID", value: payments.filter(p => p.status === "PAID").length, gradient: "from-emerald-500 to-emerald-600", accentColor: "#10b981", icon: <CheckCircle className="w-5 h-5" />, sub: "Collected" },
    { label: "PENDING", value: payments.filter(p => p.status === "PENDING").length, gradient: "from-amber-500 to-orange-500", accentColor: "#f59e0b", icon: <Clock className="w-5 h-5" />, sub: "Awaiting payment" },
    { label: "OVERDUE", value: payments.filter(p => p.status === "OVERDUE").length, gradient: "from-red-500 to-rose-500", accentColor: "#ef4444", icon: <AlertCircle className="w-5 h-5" />, sub: "Past due" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold text-text">Fees</h2>
          <p className="text-text-muted text-sm mt-1">Manage student fee payments</p>
        </div>
        <button onClick={() => setShowFeeModal(true)} className="px-4 py-2.5 rounded-xl text-sm font-semibold text-text-muted bg-bg-card border border-border hover:bg-bg transition-colors cursor-pointer shadow-sm">
          Set Class Fee
        </button>
      </div>

      <div className="flex items-center gap-3">
        <label className="text-sm font-medium text-text-muted">Month</label>
        <input type="month" value={yearMonth} onChange={e => setYearMonth(e.target.value)} className="px-4 py-2.5 rounded-xl bg-bg-card border border-border text-text text-sm outline-none focus:border-indigo-400 transition-all" />
      </div>

      {/* Summary stat cards — same style as dashboard */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {summary.map((card, i) => (
          <motion.div key={card.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
            className="relative bg-bg-card border border-border rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow overflow-hidden group">
            <svg className="absolute bottom-0 right-0 w-24 h-14 opacity-[0.06] group-hover:opacity-[0.1] transition-opacity" viewBox="0 0 120 60" fill="none">
              <path d="M0 55 Q20 45 30 35 T60 20 T90 30 T120 10" stroke={card.accentColor} strokeWidth="3" fill="none" />
              <path d="M0 55 Q20 45 30 35 T60 20 T90 30 T120 10 V60 H0 Z" fill={card.accentColor} opacity="0.3" />
            </svg>
            <div className="relative">
              <div className="flex items-start justify-between mb-3">
                <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">{card.label}</p>
                <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${card.gradient} flex items-center justify-center text-white shadow-md`}>{card.icon}</div>
              </div>
              <p className="text-2xl font-bold text-text">{card.value}</p>
              <p className="text-[11px] text-text-muted mt-1">{card.sub}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40"><div className="animate-spin w-7 h-7 border-2 border-indigo-500 border-t-transparent rounded-full" /></div>
      ) : (
        <div className="bg-bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-bg">
                <th className="text-left px-6 py-4 text-text-muted font-medium">Student</th>
                <th className="text-left px-6 py-4 text-text-muted font-medium hidden md:table-cell">Class</th>
                <th className="text-left px-6 py-4 text-text-muted font-medium">Amount</th>
                <th className="text-left px-6 py-4 text-text-muted font-medium">Status</th>
                <th className="text-right px-6 py-4 text-text-muted font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {payments.length === 0 && <tr><td colSpan={5} className="text-center py-12 text-text-muted">No fee records for this month.</td></tr>}
              {payments.map(p => (
                <tr key={p.id} className="border-b border-border hover:bg-bg transition-colors">
                  <td className="px-6 py-4"><p className="font-medium text-text">{p.studentName}</p><p className="text-xs text-text-muted">{p.studentCode}</p></td>
                  <td className="px-6 py-4 text-text-muted hidden md:table-cell">{p.className}</td>
                  <td className="px-6 py-4 text-text font-medium">Rs. {p.amount.toLocaleString()}</td>
                  <td className="px-6 py-4"><span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS_BADGE[p.status] || ""}`}>{p.status}</span></td>
                  <td className="px-6 py-4 text-right">
                    <select value={p.status} onChange={e => handleStatusChange(p.id, e.target.value)}
                      className="px-3 py-1.5 rounded-lg bg-bg border border-border text-text text-xs outline-none focus:border-indigo-400 transition-colors cursor-pointer">
                      <option value="PENDING">Pending</option>
                      <option value="PAID">Paid</option>
                      <option value="OVERDUE">Overdue</option>
                      <option value="WAIVED">Waived</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showFeeModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-bg-card border border-border rounded-2xl w-full max-w-md p-6 shadow-xl">
            <h3 className="text-lg font-bold text-text mb-5">Set Class Fee</h3>
            <form onSubmit={handleSetFee} className="space-y-4">
              <div><label className="text-sm font-medium text-text-muted">Class</label><select value={feeForm.classId} onChange={e => setFeeForm(p => ({ ...p, classId: e.target.value }))} required className={selectCls}><option value="">Select class</option>{classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
              <div><label className="text-sm font-medium text-text-muted">Monthly Fee (Rs.)</label><input type="number" value={feeForm.amount} onChange={e => setFeeForm(p => ({ ...p, amount: e.target.value }))} required placeholder="e.g. 2500" className={inputCls} /></div>
              <div><label className="text-sm font-medium text-text-muted">Label (optional)</label><input value={feeForm.feeLabel} onChange={e => setFeeForm(p => ({ ...p, feeLabel: e.target.value }))} placeholder="e.g. Monthly Tuition" className={inputCls} /></div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowFeeModal(false)} className={cancelBtnCls}>Cancel</button>
                <button type="submit" disabled={savingFee} className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60 cursor-pointer" style={primaryBtnStyle}>{savingFee ? "Saving..." : "Save Fee"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
