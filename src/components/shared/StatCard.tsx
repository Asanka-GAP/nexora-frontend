"use client";
import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  color: string;
  accentColor?: string;
  subtitle?: string;
  change?: string;
  up?: boolean | null;
}

export default function StatCard({ title, value, icon: Icon, color, accentColor = "#4F46E5", subtitle, change, up }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      className="relative bg-white rounded-2xl p-5 shadow-[0_2px_12px_rgba(0,0,0,0.06)] border border-slate-100 hover:shadow-[0_4px_20px_rgba(0,0,0,0.1)] transition-all duration-200 overflow-hidden group">
      <svg className="absolute bottom-0 right-0 w-28 h-16 opacity-[0.06] group-hover:opacity-[0.10] transition-opacity" viewBox="0 0 120 60" fill="none">
        <path d="M0 55 Q20 45 30 35 T60 20 T90 30 T120 10" stroke={accentColor} strokeWidth="3" fill="none" />
        <path d="M0 55 Q20 45 30 35 T60 20 T90 30 T120 10 V60 H0 Z" fill={accentColor} opacity="0.3" />
      </svg>
      <div className="relative">
        <div className="flex items-start justify-between mb-3">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{title}</p>
          <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center text-white shadow-md`}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
        <p className="text-2xl font-bold text-slate-800 leading-tight">{value}</p>
        <div className="flex items-center justify-between mt-2">
          {subtitle && <p className="text-[11px] text-slate-400">{subtitle}</p>}
          {change && (
            <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded-md ${up === true ? "bg-emerald-50" : up === false ? "bg-red-50" : "bg-slate-50"}`}>
              {up === true && (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3 h-3 text-emerald-500">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
                </svg>
              )}
              {up === false && (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3 h-3 text-red-500">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6L9 12.75l4.286-4.286a11.948 11.948 0 014.306 6.43l.776 2.898m0 0l3.182-5.511m-3.182 5.51l-5.511-3.181" />
                </svg>
              )}
              {(up === null || up === undefined) && (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3 h-3 text-slate-400">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12h15" />
                </svg>
              )}
              <span className={`text-[10px] font-semibold ${up === true ? "text-emerald-600" : up === false ? "text-red-500" : "text-slate-400"}`}>{change}</span>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
