"use client";
import { motion } from "framer-motion";
import { GraduationCap } from "lucide-react";

export default function PageLoader({ message = "Loading...", dark = false }: { message?: string; dark?: boolean }) {
  return (
    <div className={`rounded-2xl shadow-sm border p-16 flex flex-col items-center justify-center ${
      dark ? "bg-slate-900 border-slate-800" : "bg-bg-card border-border"
    }`}>
      <motion.div
        animate={{ y: [0, -14, 0], rotateZ: [0, -8, 8, 0] }}
        transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
        className="relative mb-4"
      >
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center shadow-lg shadow-blue-600/20">
          <GraduationCap className="w-8 h-8 text-white" />
        </div>
      </motion.div>
      <motion.div
        animate={{ scaleX: [1, 0.7, 1], opacity: [0.2, 0.1, 0.2] }}
        transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
        className={`w-12 h-1.5 rounded-full ${dark ? "bg-blue-400/10" : "bg-blue-900/10"}`}
      />
      <p className={`text-sm font-medium mt-4 ${dark ? "text-slate-500" : "text-text-muted"}`}>{message}</p>
    </div>
  );
}
