"use client";
import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Calendar as CalIcon, ChevronLeft, ChevronRight } from "lucide-react";

const toStr = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

const MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const CAL_DAYS = ["Su","Mo","Tu","We","Th","Fr","Sa"];

interface DatePickerProps {
  value: string;
  onChange: (v: string) => void;
  label?: string;
  minDate?: string;
  fullWidth?: boolean;
}

export default function DatePicker({ value, onChange, label, minDate, fullWidth }: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const current = value ? new Date(value + "T00:00:00") : new Date();
  const [viewMonth, setViewMonth] = useState(current.getMonth());
  const [viewYear, setViewYear] = useState(current.getFullYear());

  useEffect(() => {
    if (open) {
      const d = value ? new Date(value + "T00:00:00") : new Date();
      setViewMonth(d.getMonth());
      setViewYear(d.getFullYear());
    }
  }, [open, value]);

  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const prevMonthDays = new Date(viewYear, viewMonth, 0).getDate();
  const cells: { day: number; current: boolean; dateStr: string }[] = [];
  for (let i = firstDay - 1; i >= 0; i--) { const d = prevMonthDays - i; cells.push({ day: d, current: false, dateStr: toStr(new Date(viewYear, viewMonth - 1, d)) }); }
  for (let d = 1; d <= daysInMonth; d++) cells.push({ day: d, current: true, dateStr: toStr(new Date(viewYear, viewMonth, d)) });
  const remaining = 42 - cells.length;
  for (let d = 1; d <= remaining; d++) cells.push({ day: d, current: false, dateStr: toStr(new Date(viewYear, viewMonth + 1, d)) });

  const prev = () => { if (viewMonth === 0) { setViewMonth(11); setViewYear(viewYear - 1); } else setViewMonth(viewMonth - 1); };
  const next = () => { if (viewMonth === 11) { setViewMonth(0); setViewYear(viewYear + 1); } else setViewMonth(viewMonth + 1); };

  const isDisabled = (dateStr: string) => minDate ? dateStr < minDate : false;

  return (
    <div ref={ref} className={fullWidth ? "relative w-full" : "relative"}>
      <button type="button" onClick={() => setOpen(!open)}
        className={`flex items-center gap-2 pl-3 pr-3.5 py-2.5 rounded-xl border bg-white transition-all cursor-pointer ${fullWidth ? "w-full" : ""} ${open ? "border-indigo-400 ring-2 ring-indigo-100" : "border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/30"}`}>
        <CalIcon className="w-4 h-4 text-indigo-500 flex-shrink-0" />
        <span className={`text-sm font-semibold ${value ? "text-slate-800" : "text-slate-400"} ${fullWidth ? "flex-1 text-left" : ""}`}>
          {value ? new Date(value + "T00:00:00").toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) : "Select a date"}
        </span>
      </button>
      {open && (<>
        <div className="fixed inset-0 z-40 bg-black/20" onClick={() => setOpen(false)} />
        <motion.div initial={{ opacity: 0, y: 6, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.15 }}
          className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-white rounded-2xl border border-slate-100 shadow-xl p-4 w-[280px]">
          {label && <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-3">{label}</p>}
          <div className="flex items-center justify-between mb-3">
            <button type="button" onClick={prev} className="p-1.5 rounded-lg hover:bg-slate-50 transition"><ChevronLeft className="w-4 h-4 text-slate-400" /></button>
            <span className="text-sm font-bold text-slate-800">{MONTH_NAMES[viewMonth]} {viewYear}</span>
            <button type="button" onClick={next} className="p-1.5 rounded-lg hover:bg-slate-50 transition"><ChevronRight className="w-4 h-4 text-slate-400" /></button>
          </div>
          <div className="grid grid-cols-7 mb-1">{CAL_DAYS.map(d => <div key={d} className="text-center text-[10px] font-bold text-slate-300 py-1">{d}</div>)}</div>
          <div className="grid grid-cols-7 gap-px">
            {cells.map((c, i) => {
              const isSelected = c.dateStr === value;
              const isToday = c.dateStr === toStr(new Date());
              const disabled = isDisabled(c.dateStr);
              return (
                <button key={i} type="button" disabled={disabled}
                  onClick={() => { if (!disabled) { onChange(c.dateStr); setOpen(false); } }}
                  className={`h-8 rounded-lg text-xs font-medium transition-all ${disabled ? "text-slate-200 cursor-not-allowed" : isSelected ? "text-white font-bold shadow-sm" : isToday ? "ring-1 ring-indigo-400 text-indigo-600 font-bold" : c.current ? "text-slate-700 hover:bg-indigo-50 hover:text-indigo-700" : "text-slate-300"}`}
                  style={isSelected ? { background: "linear-gradient(135deg, #4F46E5, #3730A3)" } : {}}>{c.day}</button>
              );
            })}
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex justify-between">
            <button type="button" onClick={() => { const t = toStr(new Date()); if (!isDisabled(t)) { onChange(t); setOpen(false); } }} className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 transition">Today</button>
            <button type="button" onClick={() => setOpen(false)} className="text-[11px] font-semibold text-slate-400 hover:text-slate-600 transition">Close</button>
          </div>
        </motion.div>
      </>)}
    </div>
  );
}
