"use client";
import { motion } from "framer-motion";

export function AttendanceMockup() {
  return (
    <div className="w-full max-w-[340px] mx-auto" style={{ fontFamily: "Inter, sans-serif" }}>
      {/* Phone frame */}
      <div className="relative mx-auto" style={{ maxWidth: 260 }}>
        <div className="relative rounded-[32px] overflow-hidden shadow-2xl border-4 border-slate-800" style={{ background: "#0F172A" }}>
          {/* Status bar */}
          <div className="flex items-center justify-between px-5 pt-3 pb-1">
            <span className="text-white text-[9px] font-semibold">9:41</span>
            <div className="w-16 h-4 rounded-full bg-slate-900" />
            <div className="flex items-center gap-1">
              <div className="w-3 h-2 border border-white/60 rounded-sm relative">
                <div className="absolute inset-0.5 bg-white/60 rounded-sm" style={{ width: "70%" }} />
              </div>
            </div>
          </div>

          {/* App content */}
          <div className="bg-slate-950 px-4 pb-6">
            {/* Header */}
            <div className="flex items-center justify-between py-3 mb-3">
              <div>
                <p className="text-white text-xs font-bold">QR Scanner</p>
                <p className="text-slate-400 text-[9px]">Point at student ID card</p>
              </div>
              <div className="w-7 h-7 rounded-xl bg-indigo-500/20 flex items-center justify-center">
                <svg viewBox="0 0 24 24" fill="none" stroke="#818CF8" strokeWidth={2} className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 013.75 9.375v-4.5zM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 01-1.125-1.125v-4.5zM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0113.5 9.375v-4.5z" />
                </svg>
              </div>
            </div>

            {/* Scanner viewfinder */}
            <div className="relative rounded-2xl overflow-hidden mb-3" style={{ aspectRatio: "1", background: "#1E293B" }}>
              {[["top-2 left-2", "border-t-2 border-l-2"], ["top-2 right-2", "border-t-2 border-r-2"], ["bottom-2 left-2", "border-b-2 border-l-2"], ["bottom-2 right-2", "border-b-2 border-r-2"]].map(([pos, border], i) => (
                <div key={i} className={`absolute ${pos} w-5 h-5 ${border} border-indigo-400 rounded-sm`} />
              ))}
              <motion.div
                className="absolute left-3 right-3 h-0.5 rounded-full"
                style={{ background: "linear-gradient(90deg, transparent, #4F46E5, transparent)" }}
                animate={{ top: ["20%", "80%", "20%"] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
              />
              <div className="absolute inset-6 grid grid-cols-7 gap-0.5 opacity-30">
                {[1,0,1,0,1,1,0, 0,1,1,0,1,0,1, 1,0,0,1,0,1,1, 0,1,0,1,1,0,0, 1,1,0,0,1,0,1, 0,0,1,1,0,1,0, 1,0,1,0,0,1,1].map((v, i) => (
                  <div key={i} className="rounded-[1px]" style={{ background: v ? "#818CF8" : "transparent", aspectRatio: "1" }} />
                ))}
              </div>
              <div className="absolute bottom-2 left-0 right-0 text-center">
                <span className="text-[8px] text-slate-400">Scanning...</span>
              </div>
            </div>

            {/* Recent scans */}
            <div className="space-y-1.5">
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-2">Recent Scans</p>
              {[
                { name: "Kasun Perera", time: "9:32 AM" },
                { name: "Amaya Silva", time: "9:30 AM" },
                { name: "Nimal R.", time: "9:28 AM" },
              ].map((s) => (
                <div key={s.name} className="flex items-center justify-between bg-slate-800/60 rounded-xl px-3 py-2">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-indigo-500/20 flex items-center justify-center">
                      <span className="text-[7px] font-bold text-indigo-400">{s.name[0]}</span>
                    </div>
                    <p className="text-[9px] font-semibold text-white">{s.name}</p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[7px] text-slate-500">{s.time}</span>
                    <span className="text-[7px] font-bold text-white px-1.5 py-0.5 rounded-md bg-emerald-500">P</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="flex justify-center mt-2">
          <div className="w-20 h-1 rounded-full bg-slate-700" />
        </div>
      </div>

      {/* Success toast — below phone, not floating */}
      <motion.div
        className="mx-auto mt-4 bg-white rounded-2xl shadow-xl border border-slate-100 px-4 py-3 flex items-center gap-3"
        style={{ maxWidth: 240 }}
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8, duration: 0.5 }}
      >
        <div className="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center flex-shrink-0">
          <svg viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth={2.5} className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
        </div>
        <div>
          <p className="text-xs font-bold text-slate-800">Marked Present</p>
          <p className="text-[9px] text-slate-400">SMS sent to parent</p>
        </div>
      </motion.div>
    </div>
  );
}
