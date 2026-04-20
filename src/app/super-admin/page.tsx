"use client";
import { useState, useEffect } from "react";
import { Users, BookOpen, GraduationCap, MessageSquare } from "lucide-react";
import { getAdminDashboard } from "@/services/api";
import type { AdminDashboard } from "@/lib/types";

export default function SuperAdminDashboardPage() {
  const [data, setData] = useState<AdminDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [copiedToken, setCopiedToken] = useState(false);

  useEffect(() => {
    getAdminDashboard().then(setData).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const copyApiToken = async (token: string) => {
    try {
      await navigator.clipboard.writeText(token);
      setCopiedToken(true);
      setTimeout(() => setCopiedToken(false), 2000);
    } catch (err) {
      console.error('Failed to copy token:', err);
    }
  };

  if (loading) return <p className="text-slate-500 text-center py-12">Loading...</p>;

  if (!data) return <p className="text-slate-500">Failed to load dashboard</p>;

  const stats = [
    { label: "TEACHERS", value: data.totalTeachers, sub: `${data.activeTeachers} active`, color: "from-indigo-500 to-purple-500", icon: <Users className="w-4 h-4 text-white" /> },
    { label: "CLASSES", value: data.totalClasses, sub: "Across all teachers", color: "from-blue-500 to-cyan-500", icon: <BookOpen className="w-4 h-4 text-white" /> },
    { label: "STUDENTS", value: data.totalStudents, sub: "Total enrolled", color: "from-emerald-500 to-teal-500", icon: <GraduationCap className="w-4 h-4 text-white" /> },
    { label: "SMS BALANCE", value: data.smsBalance, sub: data.smsBalanceExpiry ? `Expires: ${data.smsBalanceExpiry}` : "Units remaining", color: "from-pink-500 to-rose-500", icon: <MessageSquare className="w-4 h-4 text-white" /> },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-5">
        {stats.map((s, i) => (
          <div key={i} className="bg-slate-900 rounded-2xl p-5 border border-slate-800">
            <div className="flex items-start justify-between mb-3">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{s.label}</p>
              <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${s.color} flex items-center justify-center flex-shrink-0`}>
                {s.icon}
              </div>
            </div>
            <p className="text-2xl font-bold text-white">{s.value}</p>
            <p className="text-[11px] text-slate-500 mt-1">{s.sub}</p>
          </div>
        ))}
      </div>

      {data.smsProfile && (
        <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-800">
            <h2 className="font-semibold text-white text-sm">SMS Service Provider</h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Account Holder</p>
                <p className="text-sm font-medium text-slate-200">
                  {data.smsProfile.firstName} {data.smsProfile.lastName || ''}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Email</p>
                <p className="text-sm text-slate-300">{data.smsProfile.email}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Timezone</p>
                <p className="text-sm text-slate-300">{data.smsProfile.timezone}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Last Access</p>
                <p className="text-sm text-slate-300">
                  {new Date(data.smsProfile.lastAccessAt).toLocaleString()}
                </p>
              </div>
              <div className="md:col-span-2">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">API Token</p>
                <div className="flex items-center gap-2 p-3 bg-slate-800 rounded-lg border border-slate-700">
                  <code className="text-xs text-slate-300 font-mono flex-1 break-all">
                    {data.smsProfile.apiToken}
                  </code>
                  <button
                    onClick={() => copyApiToken(data?.smsProfile?.apiToken??"")}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded transition-colors flex-shrink-0"
                  >
                    {copiedToken ? 'Copied!' : 'Copy'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

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