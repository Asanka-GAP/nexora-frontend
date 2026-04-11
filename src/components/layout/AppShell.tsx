"use client";
import { useState } from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";

interface AppShellProps {
  title: string;
  children: React.ReactNode;
}

export default function AppShell({ title, children }: AppShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} onOpen={() => setSidebarOpen(true)} />
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <Header title={title} onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 p-6 lg:p-8 pt-20 lg:pt-6 pb-4 overflow-y-auto overflow-x-hidden">
          {children}
        </main>
        <footer className="px-8 py-3 flex items-center justify-between text-xs text-slate-400 bg-white flex-shrink-0" style={{ borderTop: "1px solid #f1f5f9", boxShadow: "0 -4px 12px rgba(0,0,0,0.06)" }}>
          <span>© {new Date().getFullYear()} <span className="font-semibold" style={{ color: "#4F46E5" }}>Nexora</span>. All rights reserved.</span>
          <span className="hidden sm:block">Smart Student Attendance System 📚</span>
        </footer>
      </div>
    </div>
  );
}
