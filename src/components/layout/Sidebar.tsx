"use client";
import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard, Users, BookOpen, ScanLine, Calendar, CalendarDays, X, CheckSquare, Settings, LogOut, CreditCard,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/lib/auth";
import { useTheme } from "@/lib/theme";

const COLLAPSED_W = 68;
const EXPANDED_W = 240;

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/students", label: "Students", icon: Users },
  { href: "/classes", label: "Classes", icon: BookOpen },
  { href: "/schedule", label: "Schedule", icon: Calendar },
  { href: "/calendar", label: "Calendar", icon: CalendarDays },
  { href: "/attendance", label: "Attendance", icon: CheckSquare },
  { href: "/billing", label: "Billing", icon: CreditCard },
  { href: "/scanner", label: "Scanner", icon: ScanLine },
  { href: "/settings", label: "Settings", icon: Settings },
];

interface SidebarProps {
  open: boolean;
  onClose: () => void;
  onOpen: () => void;
}

export default function Sidebar({ open, onClose, onOpen }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [hovered, setHovered] = useState(false);
  const [mobileDropdown, setMobileDropdown] = useState(false);
  const leaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dropRef = useRef<HTMLDivElement>(null);

  const handleMouseEnter = () => { if (leaveTimer.current) clearTimeout(leaveTimer.current); setHovered(true); };
  const handleMouseLeave = () => { leaveTimer.current = setTimeout(() => setHovered(false), 120); };

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) setMobileDropdown(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const userName = user?.name || "Teacher";

  const SidebarInner = ({ forMobile = false }: { forMobile?: boolean }) => {
    const show = hovered || forMobile;
    return (
      <div className="flex flex-col h-full overflow-hidden">
        <div className="flex items-center gap-3 px-4 py-5 border-b border-border overflow-hidden">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center shadow-md flex-shrink-0"
            style={{ background: "linear-gradient(135deg, #4F46E5, #3730A3)" }}>
            <span className="text-white font-black text-base">N</span>
          </div>
          <AnimatePresence>
            {show && (
              <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }}
                transition={{ duration: 0.18 }} className="overflow-hidden whitespace-nowrap">
                <p className="font-bold text-text text-base leading-tight">Nexora</p>
                <p className="text-xs text-text-muted leading-tight">Attendance System</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <nav className="flex-1 px-2.5 py-4 space-y-0.5 overflow-y-auto overflow-x-hidden">
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(href + "/");
            return (
              <Link key={href} href={href} onClick={onClose}>
                <div
                  className={cn(
                    "relative flex items-center rounded-xl transition-all duration-150 group cursor-pointer overflow-hidden",
                    show ? "gap-3 px-2.5 py-2.5" : "w-10 h-10 justify-center mx-auto",
                    active ? "text-white shadow-md" : "text-text-muted hover:bg-bg"
                  )}
                  style={active ? { background: "linear-gradient(135deg, #4F46E5, #3730A3)", boxShadow: "0 4px 14px rgba(79,70,229,0.35)" } : {}}
                >
                  <Icon className={cn("flex-shrink-0 h-5 w-5 transition-colors", active ? "text-white" : "text-text-muted group-hover:text-[#4F46E5]")} />
                  <AnimatePresence>
                    {show && (
                      <motion.span initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -6 }}
                        transition={{ duration: 0.15 }}
                        className={cn("text-sm font-medium whitespace-nowrap", active ? "text-white" : "text-text group-hover:text-text")}>
                        {label}
                      </motion.span>
                    )}
                  </AnimatePresence>
                  {!show && (
                    <div className="absolute left-full ml-3 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-white whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-150 translate-x-1 group-hover:translate-x-0 shadow-lg z-50"
                      style={{ background: "linear-gradient(135deg, #4F46E5, #3730A3)" }}>
                      {label}
                      <span className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent" style={{ borderRightColor: "#4F46E5" }} />
                    </div>
                  )}
                </div>
              </Link>
            );
          })}
        </nav>

        {/* Mobile sidebar footer — user + logout */}
        {forMobile && (
          <div className="px-3 py-4 border-t border-border">
            <div className="flex items-center gap-3 px-2.5 py-2 mb-1">
              <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ background: "linear-gradient(135deg, #4F46E5, #3730A3)" }}>
                <span className="text-white text-xs font-bold">{userName[0]?.toUpperCase()}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-text truncate">{userName}</p>
                <p className="text-[10px] text-text-muted">Teacher</p>
              </div>
              <button onClick={toggleTheme}
                className="p-2 rounded-xl text-text-muted hover:bg-bg hover:text-text transition-all" title={theme === "dark" ? "Light mode" : "Dark mode"}>
                {theme === "dark"
                  ? <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" /></svg>
                  : <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 006.002-2.082 9.718 9.718 0 003-3.916z" /></svg>
                }
              </button>
            </div>
            <button onClick={() => { logout(); router.push("/login"); onClose(); }}
              className="w-full flex items-center gap-3 px-2.5 py-2.5 rounded-xl text-text-muted hover:bg-red-500/10 hover:text-red-500 transition-all">
              <LogOut className="w-4 h-4" />
              <span className="text-sm font-medium">Logout</span>
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      {/* Desktop sidebar */}
      <motion.aside
        onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}
        animate={{ width: hovered ? EXPANDED_W : COLLAPSED_W }}
        transition={{ type: "spring", stiffness: 320, damping: 30 }}
        className="hidden lg:flex flex-col h-screen sticky top-0 bg-bg-card border-r border-border shadow-sm flex-shrink-0 overflow-hidden z-20">
        <SidebarInner />
      </motion.aside>

      {/* Mobile top bar */}
      <div className={`lg:hidden fixed top-0 left-0 right-0 z-30 backdrop-blur-xl border-b border-border flex items-center justify-between px-3 h-14 ${theme === "dark" ? "bg-[#0B1120]/90" : "bg-white/80"}`}
        style={{ boxShadow: theme === "dark" ? "0 1px 8px rgba(0,0,0,0.3)" : "0 1px 8px rgba(0,0,0,0.06)" }}>
        {/* Left — hamburger */}
        <button onClick={onOpen} className="w-9 h-9 rounded-xl flex items-center justify-center text-text hover:bg-bg active:scale-95 transition-all">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
          </svg>
        </button>

        {/* Center — logo */}
        <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, #4F46E5, #3730A3)" }}>
            <span className="text-white font-black text-xs">N</span>
          </div>
          <span className="font-bold text-text text-sm">Nexora</span>
        </div>

        {/* Right — calendar + theme toggle + user avatar */}
        <div className="flex items-center gap-1.5">
          <Link href="/calendar"
            className="w-8 h-8 rounded-lg flex items-center justify-center text-text-muted hover:text-primary hover:bg-bg transition-all"
            title="Calendar">
            <CalendarDays className="w-4 h-4" />
          </Link>
          <button onClick={toggleTheme}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-text-muted hover:text-primary hover:bg-bg transition-all"
            title={theme === "dark" ? "Light mode" : "Dark mode"}>
            {theme === "dark"
              ? <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" /></svg>
              : <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 006.002-2.082 9.718 9.718 0 003-3.916z" /></svg>
            }
          </button>
          <div className="relative" ref={dropRef}>
          <button onClick={() => setMobileDropdown(v => !v)}
            className="w-9 h-9 rounded-full flex items-center justify-center active:scale-95 transition-transform"
            style={{ background: "linear-gradient(135deg, #4F46E5, #3730A3)" }}>
            <span className="text-white text-xs font-bold">{userName[0]?.toUpperCase() ?? "U"}</span>
          </button>
          <AnimatePresence>
            {mobileDropdown && (
              <motion.div initial={{ opacity: 0, y: -8, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -8, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 mt-2 w-56 bg-bg-card rounded-2xl shadow-xl border border-border overflow-hidden z-50">
                {/* User info */}
                <div className="px-4 py-3 border-b border-border">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ background: "linear-gradient(135deg, #4F46E5, #3730A3)" }}>
                      <span className="text-white text-sm font-bold">{userName[0]?.toUpperCase()}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-text truncate">{userName}</p>
                      <p className="text-[11px] text-text-muted">Teacher</p>
                    </div>
                  </div>
                </div>
                {/* Actions */}
                <div className="py-1.5">
                  <Link href="/settings" onClick={() => setMobileDropdown(false)}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-text hover:bg-bg transition-colors">
                    <Settings className="w-4 h-4 text-text-muted" />
                    Settings
                  </Link>
                  <button onClick={() => { logout(); router.push("/login"); setMobileDropdown(false); }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-500/10 transition-colors">
                    <LogOut className="w-4 h-4" />
                    Logout
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        </div>
      </div>

      {/* Mobile sidebar overlay */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="lg:hidden fixed inset-0 bg-black/30 z-40 backdrop-blur-sm" onClick={onClose} />
            <motion.aside initial={{ x: -280 }} animate={{ x: 0 }} exit={{ x: -280 }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
              className="lg:hidden fixed left-0 top-0 bottom-0 w-[260px] bg-bg-card z-50 shadow-2xl">
              <button onClick={onClose}
                className="absolute top-4 right-4 p-1.5 rounded-lg text-text-muted hover:bg-bg transition-colors">
                <X className="h-4 w-4" />
              </button>
              <SidebarInner forMobile />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
