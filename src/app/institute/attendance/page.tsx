"use client";
import { useEffect, useState } from "react";
import { getInstituteAttendance } from "@/services/api";
import type { InstituteAttendanceRecord } from "@/lib/types";

const primaryBtnStyle = { background: "linear-gradient(135deg, #4F46E5, #3730A3)" };

export default function InstituteAttendancePage() {
  const [records, setRecords] = useState<InstituteAttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const today = new Date().toISOString().split("T")[0];
  const [from, setFrom] = useState(today);
  const [to, setTo] = useState(today);

  const load = () => { setLoading(true); getInstituteAttendance({ from, to }).then(setRecords).finally(() => setLoading(false)); };
  useEffect(() => { load(); }, []);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-text">Attendance</h2>
        <p className="text-text-muted text-sm mt-1">View attendance across all classes</p>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label className="text-xs font-medium text-text-muted block mb-1">From</label>
          <input type="date" value={from} onChange={e => setFrom(e.target.value)} className="px-4 py-2.5 rounded-xl bg-bg-card border border-border text-text text-sm outline-none focus:border-indigo-400 transition-all" />
        </div>
        <div>
          <label className="text-xs font-medium text-text-muted block mb-1">To</label>
          <input type="date" value={to} onChange={e => setTo(e.target.value)} className="px-4 py-2.5 rounded-xl bg-bg-card border border-border text-text text-sm outline-none focus:border-indigo-400 transition-all" />
        </div>
        <button onClick={load} className="px-4 py-2.5 rounded-xl text-sm font-semibold text-white cursor-pointer hover:opacity-90 transition-all shadow-md" style={primaryBtnStyle}>Filter</button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40"><div className="animate-spin w-7 h-7 border-2 border-indigo-500 border-t-transparent rounded-full" /></div>
      ) : (
        <div className="bg-bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
          <div className="px-6 py-4 border-b border-border bg-bg">
            <p className="text-sm text-text-muted">{records.length} record{records.length !== 1 ? "s" : ""}</p>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-bg">
                <th className="text-left px-6 py-4 text-text-muted font-medium">Student</th>
                <th className="text-left px-6 py-4 text-text-muted font-medium hidden md:table-cell">Class</th>
                <th className="text-left px-6 py-4 text-text-muted font-medium">Date</th>
                <th className="text-left px-6 py-4 text-text-muted font-medium hidden lg:table-cell">Check-in</th>
                <th className="text-left px-6 py-4 text-text-muted font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {records.length === 0 && <tr><td colSpan={5} className="text-center py-12 text-text-muted">No attendance records</td></tr>}
              {records.map(r => (
                <tr key={r.id} className="border-b border-border hover:bg-bg transition-colors">
                  <td className="px-6 py-4"><p className="font-medium text-text">{r.studentName}</p><p className="text-xs text-text-muted">{r.studentCode}</p></td>
                  <td className="px-6 py-4 text-text-muted hidden md:table-cell">{r.className}</td>
                  <td className="px-6 py-4 text-text-muted">{r.date}</td>
                  <td className="px-6 py-4 text-text-muted hidden lg:table-cell">{r.checkInTime ? new Date(r.checkInTime).toLocaleTimeString() : "—"}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${r.status === "PRESENT" ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-600"}`}>{r.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
