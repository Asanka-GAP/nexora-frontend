"use client";
import { useMemo } from "react";
import { motion } from "framer-motion";
import {
  ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip,
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, Legend,
} from "recharts";
import { useTheme } from "@/lib/theme";
import type { InstituteDashboardCharts } from "@/lib/types";

const GRADE_COLORS = [
  { start: "#4F46E5", end: "#3730A3" },
  { start: "#10B981", end: "#059669" },
  { start: "#F59E0B", end: "#D97706" },
  { start: "#EF4444", end: "#DC2626" },
  { start: "#8B5CF6", end: "#7C3AED" },
  { start: "#06B6D4", end: "#0891B2" },
];

const AttendanceTooltip = ({ active, payload, label, dark }: { active?: boolean; payload?: { value: number; dataKey: string }[]; label?: string; dark?: boolean }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className={`backdrop-blur-sm rounded-2xl shadow-xl px-4 py-3 text-xs border ${dark ? "bg-[#1E293B]/95 border-[#334155]" : "bg-white/95 border-transparent"}`}>
      <p className={`font-semibold mb-1.5 ${dark ? "text-slate-300" : "text-slate-500"}`}>{label}</p>
      {payload.map(p => (
        <div key={p.dataKey} className="flex items-center gap-2 mb-0.5">
          <span className={`w-2 h-2 rounded-full ${p.dataKey === "absent" ? "bg-red-500" : "bg-[#4F46E5]"}`} />
          <span className="text-slate-400">{p.dataKey === "absent" ? "Absent" : "Present"}:</span>
          <span className={`font-bold ${dark ? "text-white" : "text-slate-700"}`}>{p.value}</span>
        </div>
      ))}
    </div>
  );
};

const BarTooltip = ({ active, payload, dark }: { active?: boolean; payload?: { value: number; payload: { name: string } }[]; dark?: boolean }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className={`backdrop-blur-sm rounded-2xl shadow-xl px-4 py-3 text-xs border ${dark ? "bg-[#1E293B]/95 border-[#334155]" : "bg-white/95 border-transparent"}`}>
      <p className={`font-bold mb-1 ${dark ? "text-white" : "text-slate-700"}`}>{payload[0].payload.name}</p>
      <div className="flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-[#4F46E5]" />
        <span className="text-slate-400">Students:</span>
        <span className={`font-bold ${dark ? "text-white" : "text-slate-700"}`}>{payload[0].value}</span>
      </div>
    </div>
  );
};

const AttendancePerTeacherTooltip = ({ active, payload, dark }: { active?: boolean; payload?: { value: number; payload: { name: string } }[]; dark?: boolean }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className={`backdrop-blur-sm rounded-2xl shadow-xl px-4 py-3 text-xs border ${dark ? "bg-[#1E293B]/95 border-[#334155]" : "bg-white/95 border-transparent"}`}>
      <p className={`font-bold mb-1 ${dark ? "text-white" : "text-slate-700"}`}>{payload[0].payload.name}</p>
      <div className="flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-emerald-500" />
        <span className="text-slate-400">Marked today:</span>
        <span className={`font-bold ${dark ? "text-white" : "text-slate-700"}`}>{payload[0].value}</span>
      </div>
    </div>
  );
};

const MonthlyFeeTooltip = ({ active, payload, label, dark }: { active?: boolean; payload?: { value: number; dataKey: string }[]; label?: string; dark?: boolean }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className={`backdrop-blur-sm rounded-2xl shadow-xl px-4 py-3 text-xs border ${dark ? "bg-[#1E293B]/95 border-[#334155]" : "bg-white/95 border-transparent"}`}>
      <p className={`font-semibold mb-1.5 ${dark ? "text-slate-300" : "text-slate-500"}`}>{label}</p>
      {payload.map(p => (
        <div key={p.dataKey} className="flex items-center gap-2 mb-0.5">
          <span className={`w-2 h-2 rounded-full ${p.dataKey === "pending" ? "bg-amber-400" : "bg-emerald-500"}`} />
          <span className="text-slate-400">{p.dataKey === "pending" ? "Pending" : "Paid"}:</span>
          <span className={`font-bold ${dark ? "text-white" : "text-slate-700"}`}>{p.value}</span>
        </div>
      ))}
    </div>
  );
};

interface Props {
  data: InstituteDashboardCharts | null;
  loading: boolean;
}

export default function InstituteDashboardCharts({ data, loading }: Props) {
  const { theme } = useTheme();
  const dk = theme === "dark";
  const grid = dk ? "#334155" : "#E2E8F0";
  const tick = dk ? "#94A3B8" : "#64748B";
  const dotBg = dk ? "#151E2F" : "#ffffff";
  const dash = "3 3";

  const attendanceData = useMemo(() => {
    if (!data?.attendanceTrend) return [];
    return data.attendanceTrend.map(r => ({
      ...r,
      date: new Date(r.date + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    }));
  }, [data]);

  const teacherBarData = data?.studentsPerTeacher ?? [];
  const attendancePerTeacherData = data?.attendancePerTeacher ?? [];
  const monthlyFeeData = data?.monthlyFeeCollection ?? [];
  const feePaid = data?.feeCollection.paid ?? 0;
  const feePending = data?.feeCollection.pending ?? 0;
  const feeTotal = feePaid + feePending;
  const feeData = [
    { name: "Paid", value: feePaid },
    { name: "Pending", value: feePending },
  ];
  const feeColors = [
    { start: "#10B981", end: "#059669" },
    { start: "#F59E0B", end: "#D97706" },
  ];

  return (
    <div className="space-y-4">
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

      {/* Attendance Trend */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className={`rounded-2xl shadow-lg border p-6 relative overflow-visible flex flex-col ${dk ? "bg-[#151E2F] border-[#1E293B]" : "bg-gradient-to-br from-white via-white to-indigo-50/30 border-slate-100/50"}`}>
        <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-indigo-100/20 to-transparent rounded-full -translate-y-12 translate-x-12" />
        <div className="relative flex flex-col flex-1">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-gradient-to-br from-[#4F46E5] to-[#3730A3] rounded-xl flex items-center justify-center shadow-md">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-5 h-5 text-white"><path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" /></svg>
            </div>
            <div>
              <h3 className={`text-lg font-bold ${dk ? "text-slate-100" : "text-slate-800"}`}>Attendance Trend</h3>
              <p className="text-xs text-slate-500">Institute-wide daily attendance</p>
            </div>
          </div>
          <div className="flex-1 min-h-[192px] [&_svg]:outline-none [&_.recharts-wrapper]:outline-none">
            {loading ? (
              <div className="h-full flex items-center justify-center text-slate-400 text-sm">Loading...</div>
            ) : attendanceData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={attendanceData} margin={{ top: 4, right: 12, left: -12, bottom: 0 }}>
                  <defs>
                    <linearGradient id="instAttendGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#4F46E5" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#4F46E5" stopOpacity={0.05} />
                    </linearGradient>
                    <linearGradient id="instAbsentGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#EF4444" stopOpacity={0.2} />
                      <stop offset="100%" stopColor="#EF4444" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray={dash} stroke={grid} strokeOpacity={0.5} />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: tick, fontWeight: "500" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: tick, fontWeight: "500" }} axisLine={false} tickLine={false} width={32} allowDecimals={false} />
                  <Tooltip content={<AttendanceTooltip dark={dk} />} />
                  <Area type="monotone" dataKey="present" stroke="#4F46E5" strokeWidth={3} fill="url(#instAttendGrad)"
                    dot={{ r: 4, fill: "#4F46E5", strokeWidth: 2, stroke: dotBg }}
                    activeDot={{ r: 6, stroke: "#4F46E5", strokeWidth: 2, fill: dotBg }} />
                  <Area type="monotone" dataKey="absent" stroke="#EF4444" strokeWidth={2} fill="url(#instAbsentGrad)"
                    dot={{ r: 3, fill: "#EF4444", strokeWidth: 2, stroke: dotBg }}
                    activeDot={{ r: 5, stroke: "#EF4444", strokeWidth: 2, fill: dotBg }} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 text-sm">No attendance data</div>
            )}
          </div>
          <div className="flex items-center gap-4 mt-3">
            <span className="flex items-center gap-1.5 text-xs text-slate-500"><span className="w-2.5 h-2.5 rounded-full bg-[#4F46E5]" />Present</span>
            <span className="flex items-center gap-1.5 text-xs text-slate-500"><span className="w-2.5 h-2.5 rounded-full bg-red-400" />Absent</span>
          </div>
        </div>
      </motion.div>

      {/* Students per Teacher + Fee Collection */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className={`rounded-2xl shadow-lg border p-6 relative overflow-hidden ${dk ? "bg-[#151E2F] border-[#1E293B]" : "bg-gradient-to-br from-white via-white to-violet-50/30 border-slate-100/50"}`}>
        <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-violet-100/20 to-transparent rounded-full -translate-y-12 translate-x-12" />
        <div className="relative space-y-6">

          {/* Students per Teacher Bar Chart */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center shadow-md">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-5 h-5 text-white"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" /></svg>
              </div>
              <div>
                <h3 className={`text-lg font-bold ${dk ? "text-slate-100" : "text-slate-800"}`}>Students per Teacher</h3>
                <p className="text-xs text-slate-500">Teacher workload overview</p>
              </div>
            </div>
            {loading ? (
              <div className="h-48 flex items-center justify-center text-slate-400 text-sm">Loading...</div>
            ) : teacherBarData.length > 0 ? (
              <div className="h-48 [&_svg]:outline-none [&_.recharts-wrapper]:outline-none">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={teacherBarData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }} barCategoryGap="20%">
                    <defs>
                      <linearGradient id="instBarGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#8B5CF6" stopOpacity={1} />
                        <stop offset="100%" stopColor="#4F46E5" stopOpacity={0.8} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray={dash} stroke={grid} strokeOpacity={0.5} vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: tick, fontWeight: "500" }} axisLine={false} tickLine={false} interval={0} angle={-20} textAnchor="end" height={40} />
                    <YAxis tick={{ fontSize: 10, fill: tick, fontWeight: "500" }} axisLine={false} tickLine={false} width={36} allowDecimals={false} />
                    <Tooltip content={<BarTooltip dark={dk} />} cursor={{ fill: dk ? "rgba(139,92,246,0.1)" : "rgba(139,92,246,0.06)" }} />
                    <Bar dataKey="students" fill="url(#instBarGrad)" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-48 flex items-center justify-center text-slate-400 text-sm">No teacher data</div>
            )}
          </div>

          <div className={`border-t ${dk ? "border-[#1E293B]" : "border-slate-100"}`} />

          {/* Fee Collection Donut */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-md">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-5 h-5 text-white"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75" /></svg>
              </div>
              <div>
                <h3 className={`text-lg font-bold ${dk ? "text-slate-100" : "text-slate-800"}`}>Fee Collection</h3>
                <p className="text-xs text-slate-500">Paid vs pending this month</p>
              </div>
            </div>
            {loading ? (
              <div className="h-40 flex items-center justify-center text-slate-400 text-sm">Loading...</div>
            ) : feeTotal > 0 ? (
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <div className="h-40 w-40 flex-shrink-0 relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <defs>
                        {feeData.map((_, i) => (
                          <linearGradient key={i} id={`feeGrad-${i}`} x1="0" y1="0" x2="1" y2="1">
                            <stop offset="0%" stopColor={feeColors[i].start} />
                            <stop offset="100%" stopColor={feeColors[i].end} />
                          </linearGradient>
                        ))}
                      </defs>
                      <Pie data={feeData} cx="50%" cy="50%" innerRadius={42} outerRadius={68} paddingAngle={3} dataKey="value">
                        {feeData.map((_, i) => (
                          <Cell key={i} fill={`url(#feeGrad-${i})`} stroke={dotBg} strokeWidth={3} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ backgroundColor: dk ? "rgba(30,41,59,0.95)" : "rgba(255,255,255,0.95)", border: "none", borderRadius: "16px", boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)", fontSize: "14px", fontWeight: "600", color: dk ? "#E2E8F0" : "#1E293B" }}
                        formatter={(value: any, _: any, props: any) => [`${value} students`, props.payload.name]}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="text-center">
                      <div className={`text-xl font-bold ${dk ? "text-slate-100" : "text-slate-800"}`}>{feeTotal}</div>
                      <div className="text-[9px] text-slate-500 font-medium">Total</div>
                    </div>
                  </div>
                </div>
                <div className="w-full sm:flex-1 grid grid-cols-1 gap-2">
                  {feeData.map((item, i) => (
                    <div key={item.name} className={`flex items-center gap-3 p-3 rounded-xl backdrop-blur-sm ${dk ? "bg-white/5" : "bg-white/60"}`}>
                      <div className="w-3 h-3 rounded-full shadow-sm flex-shrink-0"
                        style={{ background: `linear-gradient(135deg, ${feeColors[i].start}, ${feeColors[i].end})` }} />
                      <div className="flex-1 min-w-0">
                        <div className={`text-xs font-semibold ${dk ? "text-slate-200" : "text-slate-700"}`}>{item.name}</div>
                        <div className="text-[11px] text-slate-500">{item.value} students</div>
                      </div>
                      <div className={`text-xs font-bold ${i === 0 ? "text-emerald-500" : "text-amber-500"}`}>
                        {feeTotal > 0 ? Math.round((item.value / feeTotal) * 100) : 0}%
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="h-40 flex items-center justify-center text-slate-400 text-sm">No fee data</div>
            )}
          </div>

        </div>
      </motion.div>

      {/* Attendance per Teacher */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
        className={`rounded-2xl shadow-lg border p-6 relative overflow-hidden ${dk ? "bg-[#151E2F] border-[#1E293B]" : "bg-gradient-to-br from-white via-white to-emerald-50/30 border-slate-100/50"}`}>
        <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-emerald-100/20 to-transparent rounded-full -translate-y-12 translate-x-12" />
        <div className="relative">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center shadow-md">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-5 h-5 text-white"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <div>
              <h3 className={`text-lg font-bold ${dk ? "text-slate-100" : "text-slate-800"}`}>Attendance per Teacher</h3>
              <p className="text-xs text-slate-500">Students marked today by each teacher</p>
            </div>
          </div>
          {loading ? (
            <div className="h-56 flex items-center justify-center text-slate-400 text-sm">Loading...</div>
          ) : attendancePerTeacherData.length > 0 ? (
            <div className="h-56 [&_svg]:outline-none [&_.recharts-wrapper]:outline-none">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={attendancePerTeacherData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }} barCategoryGap="20%">
                  <defs>
                    <linearGradient id="attendTeacherGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10B981" stopOpacity={1} />
                      <stop offset="100%" stopColor="#059669" stopOpacity={0.8} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray={dash} stroke={grid} strokeOpacity={0.5} vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: tick, fontWeight: "500" }} axisLine={false} tickLine={false} interval={0} angle={-20} textAnchor="end" height={40} />
                  <YAxis tick={{ fontSize: 10, fill: tick, fontWeight: "500" }} axisLine={false} tickLine={false} width={36} allowDecimals={false} />
                  <Tooltip content={<AttendancePerTeacherTooltip dark={dk} />} cursor={{ fill: dk ? "rgba(16,185,129,0.1)" : "rgba(16,185,129,0.06)" }} />
                  <Bar dataKey="count" fill="url(#attendTeacherGrad)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-56 flex items-center justify-center text-slate-400 text-sm">No attendance data for today</div>
          )}
        </div>
      </motion.div>

      {/* Grade Distribution */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
        className={`rounded-2xl shadow-lg border p-6 relative overflow-hidden ${dk ? "bg-[#151E2F] border-[#1E293B]" : "bg-gradient-to-br from-white via-white to-blue-50/30 border-slate-100/50"}`}>
        <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-blue-100/20 to-transparent rounded-full -translate-y-12 translate-x-12" />
        <div className="relative">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-md">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-5 h-5 text-white"><path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 7.74-3.342" /></svg>
            </div>
            <div>
              <h3 className={`text-lg font-bold ${dk ? "text-slate-100" : "text-slate-800"}`}>Grade Distribution</h3>
              <p className="text-xs text-slate-500">Students across grades institute-wide</p>
            </div>
          </div>
          {loading ? (
            <div className="h-40 flex items-center justify-center text-slate-400 text-sm">Loading...</div>
          ) : (data?.gradeDistribution ?? []).length > 0 ? (
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="h-40 w-40 flex-shrink-0 relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <defs>
                      {(data?.gradeDistribution ?? []).map((_, i) => (
                        <linearGradient key={i} id={`gradeInstGrad-${i}`} x1="0" y1="0" x2="1" y2="1">
                          <stop offset="0%" stopColor={GRADE_COLORS[i % GRADE_COLORS.length].start} />
                          <stop offset="100%" stopColor={GRADE_COLORS[i % GRADE_COLORS.length].end} />
                        </linearGradient>
                      ))}
                    </defs>
                    <Pie data={data?.gradeDistribution ?? []} cx="50%" cy="50%" innerRadius={42} outerRadius={68} paddingAngle={3} dataKey="count">
                      {(data?.gradeDistribution ?? []).map((_, i) => (
                        <Cell key={i} fill={`url(#gradeInstGrad-${i})`} stroke={dotBg} strokeWidth={3} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ backgroundColor: dk ? "rgba(30,41,59,0.95)" : "rgba(255,255,255,0.95)", border: "none", borderRadius: "16px", boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)", fontSize: "14px", fontWeight: "600", color: dk ? "#E2E8F0" : "#1E293B" }}
                      formatter={(value: any, _: any, props: any) => [`${value} students`, props.payload.grade]}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="text-center">
                    <div className={`text-xl font-bold ${dk ? "text-slate-100" : "text-slate-800"}`}>
                      {(data?.gradeDistribution ?? []).reduce((s, g) => s + g.count, 0)}
                    </div>
                    <div className="text-[9px] text-slate-500 font-medium">Total</div>
                  </div>
                </div>
              </div>
              <div className="w-full sm:flex-1 grid grid-cols-2 gap-1.5">
                {(data?.gradeDistribution ?? []).map((item, i) => (
                  <div key={item.grade} className={`flex items-center gap-2 p-2 rounded-lg backdrop-blur-sm ${dk ? "bg-white/5" : "bg-white/60"}`}>
                    <div className="w-2.5 h-2.5 rounded-full shadow-sm flex-shrink-0"
                      style={{ background: `linear-gradient(135deg, ${GRADE_COLORS[i % GRADE_COLORS.length].start}, ${GRADE_COLORS[i % GRADE_COLORS.length].end})` }} />
                    <div className="min-w-0">
                      <div className={`text-[11px] font-semibold truncate ${dk ? "text-slate-200" : "text-slate-700"}`}>
                        <span className="hidden sm:inline">{item.grade}</span>
                        <span className="sm:hidden">G{String(item.gradeNum).padStart(2, "0")}</span>
                      </div>
                      <div className="text-[10px] text-slate-500">{item.count} students</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="h-40 flex items-center justify-center text-slate-400 text-sm">No grade data</div>
          )}
        </div>
      </motion.div>
    </div>

    {/* Monthly Fee Collection - full width */}
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
      className={`rounded-2xl shadow-lg border p-6 relative overflow-hidden ${dk ? "bg-[#151E2F] border-[#1E293B]" : "bg-gradient-to-br from-white via-white to-amber-50/30 border-slate-100/50"}`}>
      <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-amber-100/20 to-transparent rounded-full -translate-y-12 translate-x-12" />
      <div className="relative">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl flex items-center justify-center shadow-md">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-5 h-5 text-white"><path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" /></svg>
          </div>
          <div>
            <h3 className={`text-lg font-bold ${dk ? "text-slate-100" : "text-slate-800"}`}>Monthly Fee Collection</h3>
            <p className="text-xs text-slate-500">Paid vs pending trend over months</p>
          </div>
        </div>
        {loading ? (
          <div className="h-64 flex items-center justify-center text-slate-400 text-sm">Loading...</div>
        ) : monthlyFeeData.length > 0 ? (
          <div className="h-64 [&_svg]:outline-none [&_.recharts-wrapper]:outline-none">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyFeeData} margin={{ top: 4, right: 12, left: -12, bottom: 0 }} barCategoryGap="25%" barGap={4}>
                <defs>
                  <linearGradient id="monthlyPaidGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10B981" stopOpacity={1} />
                    <stop offset="100%" stopColor="#059669" stopOpacity={0.8} />
                  </linearGradient>
                  <linearGradient id="monthlyPendingGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#F59E0B" stopOpacity={1} />
                    <stop offset="100%" stopColor="#D97706" stopOpacity={0.8} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray={dash} stroke={grid} strokeOpacity={0.5} vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: tick, fontWeight: "500" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: tick, fontWeight: "500" }} axisLine={false} tickLine={false} width={32} allowDecimals={false} />
                <Tooltip content={<MonthlyFeeTooltip dark={dk} />} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: "11px", paddingTop: "12px" }}
                  formatter={(value) => <span style={{ color: tick }}>{value === "paid" ? "Paid" : "Pending"}</span>} />
                <Bar dataKey="paid" fill="url(#monthlyPaidGrad)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="pending" fill="url(#monthlyPendingGrad)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-64 flex items-center justify-center text-slate-400 text-sm">No monthly fee data</div>
        )}
      </div>
    </motion.div>
    </div>
  );
}
