"use client";
import { motion } from "framer-motion";

export default function PageLoader({ message = "Loading..." }: { message?: string; dark?: boolean }) {
  return (
    <div className="bg-white rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.06)] border border-slate-100 p-16 flex flex-col items-center justify-center gap-4">
      <div className="flex items-center gap-2">
        {[0, 1, 2, 3].map((i) => (
          <motion.div
            key={i}
            className="w-2.5 h-2.5 rounded-full"
            style={{ background: "linear-gradient(135deg, #4F46E5, #3730A3)" }}
            animate={{ y: [0, -14, 0], scale: [1, 1.3, 1], opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.15, ease: "easeInOut" }}
          />
        ))}
      </div>
      <motion.p
        className="text-xs font-medium text-slate-400 tracking-wide"
        animate={{ opacity: [0.3, 1, 0.3] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
      >
        {message}
      </motion.p>
    </div>
  );
}
