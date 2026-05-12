"use client";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { GraduationCap, BookOpen, CheckCircle } from "lucide-react";
import { getInstituteTeacherDashboard } from "@/services/api";
import type { InstituteTeacherDashboard } from "@/lib/types";
import { useAuth } from "@/lib/auth";
import PageSkeleton from "@/components/ui/PageSkeleton";

export default function InstituteTeacherDashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState<InstituteTeacherDashboard | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getInstituteTeacherDashboard().then(setData).finally(() => setLoading(false));
  }, []);

  if (loading) return <PageSkeleton />;
  if (!data) return <p className="text-slate-500">Failed to load dashboard.</p>;

  const stats = [
    {
      label: "MY STUDENTS",
      value: data.totalStudents,
      sub: "Across all my classes",
      gradient: "from-emerald-500 to-emerald-600",
      accentColor: "#10b981",
      icon: <GraduationCap className="w-5 h-5" />,
    },
    {
      label: "MY CLASSES",
      value: data.totalClasses,
      sub: "Assigned to me",
      gradient: "from-violet-500 to-purple-600",
      accentColor: "#8b5cf6",
      icon: <BookOpen className="w-5 h-5" />,
    },
    {
      label: "TODAY'S ATTENDANCE",
      value: data.todayAttendance,
      sub: "Students present today",
      gradient: "from-[#4F46E5] to-[#3730A3]",
      accentColor: "#4F46E5",
      icon: <CheckCircle className="w-5 h-5" />,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-slate-800">Welcome, {user?.name}</h1>
        <p className="text-slate-400 text-sm mt-1">Here's your teaching overview for today</p>
      </motion.div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {stats.map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="relative bg-white rounded-2xl p-5 shadow-[0_2px_12px_rgba(0,0,0,0.06)] border border-slate-100 hover:shadow-[0_4px_20px_rgba(0,0,0,0.1)] transition-all duration-200 overflow-hidden group"
          >
            {/* Decorative sparkline */}
            <svg className="absolute bottom-0 right-0 w-28 h-16 opacity-[0.06] group-hover:opacity-[0.1] transition-opacity" viewBox="0 0 120 60" fill="none">
              <path d="M0 55 Q20 45 30 35 T60 20 T90 30 T120 10" stroke={card.accentColor} strokeWidth="3" fill="none" />
              <path d="M0 55 Q20 45 30 35 T60 20 T90 30 T120 10 V60 H0 Z" fill={card.accentColor} opacity="0.3" />
            </svg>
            <div className="relative">
              <div className="flex items-start justify-between mb-3">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{card.label}</p>
                <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${card.gradient} flex items-center justify-center text-white shadow-md`}>
                  {card.icon}
                </div>
              </div>
              <p className="text-2xl font-bold text-slate-800 leading-tight">{card.value}</p>
              <p className="text-[11px] text-slate-400 mt-2">{card.sub}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
