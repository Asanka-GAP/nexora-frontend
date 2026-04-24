"use client";
import { motion } from "framer-motion";

export function NotificationMockup() {
  const messages = [
    { time: "9:32 AM", text: "Dear Parent, Kasun Perera has been marked PRESENT at Mathematics class on 24/04/2025 at 09:32 AM. - Nexora", absent: false, delay: 0.2 },
    { time: "9:45 AM", text: "Dear Parent, Amaya Silva has been marked PRESENT at Science class on 24/04/2025 at 09:45 AM. - Nexora", absent: false, delay: 0.5 },
    { time: "10:02 AM", text: "Dear Parent, Nimal Rajapaksa was marked ABSENT at Mathematics class on 24/04/2025. Please contact the teacher. - Nexora", absent: true, delay: 0.8 },
  ];

  return (
    <div className="w-full max-w-[320px] mx-auto" style={{ fontFamily: "Inter, sans-serif" }}>
      {/* Phone frame */}
      <div className="rounded-[32px] overflow-hidden shadow-2xl border-4 border-slate-200 bg-white">
        {/* Status bar */}
        <div className="bg-slate-50 flex items-center justify-between px-5 pt-3 pb-1">
          <span className="text-slate-800 text-[9px] font-semibold">9:41</span>
          <div className="w-16 h-4 rounded-full bg-slate-200" />
          <div className="flex items-center gap-1">
            <div className="w-3 h-2 border border-slate-400 rounded-sm relative">
              <div className="absolute inset-0.5 bg-slate-400 rounded-sm" style={{ width: "70%" }} />
            </div>
          </div>
        </div>

        {/* SMS app header */}
        <div className="bg-white px-4 py-3 border-b border-slate-100 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0">
            <span className="text-white text-[9px] font-bold">N</span>
          </div>
          <div>
            <p className="text-xs font-bold text-slate-800">Nexora</p>
            <p className="text-[8px] text-slate-400">Attendance Notifications</p>
          </div>
        </div>

        {/* Messages */}
        <div className="bg-slate-50 px-3 py-3 space-y-3">
          {messages.map((m, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: m.delay, duration: 0.4 }} className="flex flex-col items-start">
              <div className={`max-w-[85%] rounded-2xl rounded-tl-sm px-3 py-2 shadow-sm ${m.absent ? "bg-red-50 border border-red-100" : "bg-white border border-slate-100"}`}>
                <p className="text-[8px] leading-relaxed text-slate-700">{m.text}</p>
              </div>
              <span className="text-[7px] text-slate-400 mt-1 ml-1">{m.time}</span>
            </motion.div>
          ))}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: [0, 1, 0] }} transition={{ delay: 1.5, duration: 1.5, repeat: Infinity }}
            className="flex items-center gap-1 px-3 py-2 bg-white rounded-2xl rounded-tl-sm w-fit border border-slate-100 shadow-sm"
          >
            {[0, 0.2, 0.4].map((d, i) => (
              <motion.div key={i} className="w-1.5 h-1.5 rounded-full bg-slate-400" animate={{ y: [0, -3, 0] }} transition={{ delay: d, duration: 0.6, repeat: Infinity }} />
            ))}
          </motion.div>
        </div>

        {/* Input bar */}
        <div className="bg-white px-3 py-2 border-t border-slate-100 flex items-center gap-2">
          <div className="flex-1 bg-slate-100 rounded-full px-3 py-1.5">
            <p className="text-[8px] text-slate-400">Message</p>
          </div>
          <div className="w-6 h-6 rounded-full bg-indigo-500 flex items-center justify-center flex-shrink-0">
            <svg viewBox="0 0 24 24" fill="white" className="w-3 h-3">
              <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
            </svg>
          </div>
        </div>
      </div>

      <div className="flex justify-center mt-2">
        <div className="w-20 h-1 rounded-full bg-slate-300" />
      </div>

      {/* Stat card */}
      <motion.div
        className="bg-white rounded-2xl shadow-xl border border-slate-100 p-4 mt-4"
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1, duration: 0.5 }}
      >
        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-2">Today&apos;s SMS Activity</p>
        <div className="grid grid-cols-3 gap-3">
          {[{ label: "Sent", value: "34", color: "#4F46E5" }, { label: "Present", value: "31", color: "#10B981" }, { label: "Absent", value: "3", color: "#EF4444" }].map((s) => (
            <div key={s.label} className="text-center">
              <p className="text-base font-bold" style={{ color: s.color }}>{s.value}</p>
              <p className="text-[8px] text-slate-400">{s.label}</p>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
