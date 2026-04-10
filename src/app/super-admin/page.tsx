"use client";
import { useState, useEffect } from "react";
import { getAdminDashboard } from "@/services/api";
import type { AdminDashboard } from "@/lib/types";

export default function SuperAdminDashboardPage() {
  const [data, setData] = useState<AdminDashboard | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAdminDashboard().then(setData).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-5">
      {[...Array(4)].map((_, i) => (<div key={i} className="bg-slate-900 rounded-2xl p-5 border border-slate-800 animate-pulse"><div className="h-3 bg-slate-800 rounded w-24 mb-3" /><div className="h-7 bg-slate-800 rounded w-20 mb-2" /></div>))}
    </div>
  );

  if (!data) return <p className="text-slate-500">Failed to load dashboard</p>;

  const stats = [
    { label: "TEACHERS", value: data.totalTeachers, sub: `${data.activeTeachers} active`, color: "from-indigo-500 to-purple-500" },
    { label: "CLASSES", value: data.totalClasses, sub: "Across all teachers", color: "from-blue-500 to-cyan-500" },
    { label: "STUDENTS", value: data.totalStudents, sub: "Total enrolled", color: "from-emerald-500 to-teal-500" },
    { label: "ACTIVE RATE", value: data.totalTeachers > 0 ? `${Math.round((data.activeTeachers / data.totalTeachers) * 100)}%` : "0%", sub: `${data.activeTeachers} of ${data.totalTeachers}`, color: "from-orange-500 to-amber-500" },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-5">
        {stats.map((s, i) => (
          <div key={i} className="bg-slate-900 rounded-2xl p-5 border border-slate-800">
            <div className="flex items-start justify-between mb-3">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{s.label}</p>
              <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${s.color} flex items-center justify-center flex-shrink-0`}><span className="text-white text-xs font-bold">{i + 1}</span></div>
            </div>
            <p className="text-2xl font-bold text-white">{s.value}</p>
            <p className="text-[11px] text-slate-500 mt-1">{s.sub}</p>
          </div>
        ))}
      </div>

      <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-800"><h2 className="font-semibold text-white text-sm">Recent Teachers</h2></div>
        <div className="divide-y divide-slate-800">
          {!data.recentTeachers.length ? (<p className="text-xs text-slate-500 text-center py-8">No teachers yet</p>) :
            data.recentTeachers.map(t => (
              <div key={t.id} className="flex items-center justify-between px-6 py-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-slate-200 truncate">{t.name}</p>
                  <p className="text-[10px] text-slate-500">{t.subject} · {t.email} · {new Date(t.createdAt).toLocaleDateString()}</p>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ml-3 ${t.status === "ACTIVE" ? "bg-emerald-500/10 text-emerald-400" : "bg-slate-800 text-slate-400"}`}>{t.status}</span>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
