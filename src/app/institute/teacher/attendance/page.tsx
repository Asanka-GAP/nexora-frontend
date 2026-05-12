"use client";
import { useEffect, useState } from "react";
import { getInstituteTeacherAttendance, markInstituteAttendance, getInstituteTeacherClasses } from "@/services/api";
import type { InstituteAttendanceRecord, InstituteClassResponse } from "@/lib/types";
import { toast } from "sonner";
import PageSkeleton from "@/components/ui/PageSkeleton";

const primaryBtnStyle = { background: "linear-gradient(135deg, #4F46E5, #3730A3)" };

export default function InstituteTeacherAttendancePage() {
  const [records, setRecords] = useState<InstituteAttendanceRecord[]>([]);
  const [classes, setClasses] = useState<InstituteClassResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [marking, setMarking] = useState(false);
  const [markForm, setMarkForm] = useState({ studentCode: "", classId: "" });
  const today = new Date().toISOString().split("T")[0];

  const load = () => {
    setLoading(true);
    Promise.all([
      getInstituteTeacherAttendance({ from: today, to: today }).then(setRecords),
      getInstituteTeacherClasses().then(setClasses),
    ]).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleMark = async (e: React.FormEvent) => {
    e.preventDefault();
    setMarking(true);
    try {
      const res = await markInstituteAttendance(markForm);
      toast.success(res.message || "Attendance marked");
      setMarkForm(p => ({ ...p, studentCode: "" }));
      load();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to mark attendance");
    } finally { setMarking(false); }
  };

  if (loading && records.length === 0 && classes.length === 0) return <PageSkeleton />;

  return (
    <div className="space-y-6">
      {/* Mark attendance card */}
      <div className="bg-bg-card border border-border rounded-2xl p-6 shadow-sm">
        <h3 className="text-base font-semibold text-text mb-4">Mark Attendance</h3>
        <form onSubmit={handleMark} className="flex flex-wrap gap-3 items-end">
          <div>
            <label className="text-xs font-medium text-text-muted block mb-1">Student Code / QR</label>
            <input
              value={markForm.studentCode}
              onChange={e => setMarkForm(p => ({ ...p, studentCode: e.target.value }))}
              required placeholder="Scan or enter student code" autoFocus
              className="px-4 py-2.5 rounded-xl bg-bg border border-border text-text text-sm placeholder:text-text-muted outline-none focus:border-indigo-400 focus:shadow-[0_0_0_3px_rgba(79,70,229,0.08)] transition-all w-64"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-text-muted block mb-1">Class</label>
            <select value={markForm.classId} onChange={e => setMarkForm(p => ({ ...p, classId: e.target.value }))} required
              className="px-4 py-2.5 rounded-xl bg-bg border border-border text-text text-sm outline-none focus:border-indigo-400 transition-all">
              <option value="">Select class</option>
              {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <button type="submit" disabled={marking} className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60 cursor-pointer transition-all shadow-md" style={primaryBtnStyle}>
            {marking ? "Marking..." : "Mark Present"}
          </button>
        </form>
      </div>

      {/* Today's records */}
      <div className="bg-bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-border bg-bg">
          <p className="text-sm font-medium text-text">Today's Records <span className="text-text-muted font-normal">({records.length})</span></p>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-bg">
              <th className="text-left px-6 py-3 text-text-muted font-medium">Student</th>
              <th className="text-left px-6 py-3 text-text-muted font-medium hidden md:table-cell">Class</th>
              <th className="text-left px-6 py-3 text-text-muted font-medium">Check-in</th>
              <th className="text-left px-6 py-3 text-text-muted font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {records.length === 0 && <tr><td colSpan={4} className="text-center py-10 text-text-muted">No attendance marked today</td></tr>}
            {records.map(r => (
              <tr key={r.id} className="border-b border-border hover:bg-bg transition-colors">
                <td className="px-6 py-3"><p className="font-medium text-text">{r.studentName}</p><p className="text-xs text-text-muted">{r.studentCode}</p></td>
                <td className="px-6 py-3 text-text-muted hidden md:table-cell">{r.className}</td>
                <td className="px-6 py-3 text-text-muted">{r.checkInTime ? new Date(r.checkInTime).toLocaleTimeString() : "—"}</td>
                <td className="px-6 py-3"><span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">{r.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
