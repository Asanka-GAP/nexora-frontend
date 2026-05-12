"use client";
import { useEffect, useState, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/lib/auth";
import { useTheme } from "@/lib/theme";
import { Sun, Moon, X, LogOut, LayoutDashboard, Users, GraduationCap, BookOpen, DoorOpen, CheckSquare, CreditCard, CalendarDays } from "lucide-react";
import { cn } from "@/lib/utils";

const COLLAPSED_W = 68;
const EXPANDED_W = 240;

const navItems = [
  { href: "/institute/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/institute/teachers", label: "Teachers", icon: Users },
  { href: "/institute/students", label: "Students", icon: GraduationCap },
  { href: "/institute/classes", label: "Classes", icon: BookOpen },
  { href: "/institute/classrooms", label: "Classrooms", icon: DoorOpen },
  { href: "/institute/calendar", label: "Calendar", icon: CalendarDays },
  { href: "/institute/attendance", label: "Attendance", icon: CheckSquare },
  { href: "/institute/fees", label: "Fees", icon: CreditCard },
];

const pageMeta: Record<string, { title: string; subtitle: string }> = {
  "/institute/dashboard": { title: "Dashboard", subtitle: "Here's your institute overview for today." },
  "/institute/teachers": { title: "Teachers", subtitle: "Manage institute teachers." },
  "/institute/students": { title: "Students", subtitle: "Manage student records and enrollment." },
  "/institute/classes": { title: "Classes", subtitle: "Manage classes and subjects." },
  "/institute/classrooms": { title: "Classrooms", subtitle: "Manage physical classrooms." },
  "/institute/calendar": { title: "Calendar", subtitle: "View and manage class sessions." },
  "/institute/attendance": { title: "Attendance", subtitle: "View attendance records." },
  "/institute/fees": { title: "Fees", subtitle: "Manage student fee payments." },
};

export default function InstituteLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const leaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const dk = theme === "dark";

  useEffect(() => {
    if (!loading && (!user || user.role !== "INSTITUTE_ADMIN")) router.push("/login");
  }, [user, loading, router]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setDropdownOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  if (loading || !user || user.role !== "INSTITUTE_ADMIN") {
    return (
      <div className="h-screen flex items-center justify-center bg-bg">
        <div className="animate-spin w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  const handleMouseEnter = () => { if (leaveTimer.current) clearTimeout(leaveTimer.current); setHovered(true); };
  const handleMouseLeave = () => { leaveTimer.current = setTimeout(() => setHovered(false), 120); };
  const show = hovered;
  const meta = pageMeta[pathname] ?? { title: "Institute", subtitle: "" };
  const userName = user.name || "Admin";
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "morning" : hour < 17 ? "afternoon" : "evening";

  const SidebarInner = ({ forMobile = false }: { forMobile?: boolean }) => {
    const expanded = forMobile || hovered;
    return (
      <div className="flex flex-col h-full overflow-hidden">
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 py-5 border-b border-border overflow-hidden">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center shadow-md flex-shrink-0"
            style={{ background: "linear-gradient(135deg, #4F46E5, #3730A3)" }}>
            <span className="text-white font-black text-base">N</span>
          </div>
          <AnimatePresence>
            {expanded && (
              <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }}
                transition={{ duration: 0.18 }} className="overflow-hidden whitespace-nowrap">
                <p className="font-bold text-text text-base leading-tight">Nexora</p>
                <p className="text-xs text-text-muted leading-tight">Institute Portal</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-2.5 py-4 space-y-0.5 overflow-y-auto overflow-x-hidden">
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(href + "/");
            return (
              <Link key={href} href={href} onClick={() => setSidebarOpen(false)}>
                <div className={cn(
                  "relative flex items-center rounded-xl transition-all duration-150 group cursor-pointer overflow-hidden",
                  expanded ? "gap-3 px-2.5 py-2.5" : "w-10 h-10 justify-center mx-auto",
                  active ? "text-white shadow-md" : "text-text-muted hover:bg-bg"
                )}
                  style={active ? { background: "linear-gradient(135deg, #4F46E5, #3730A3)", boxShadow: "0 4px 14px rgba(79,70,229,0.35)" } : {}}>
                  <Icon className={cn("flex-shrink-0 h-5 w-5 transition-colors", active ? "text-white" : "text-text-muted group-hover:text-[#4F46E5]")} />
                  <AnimatePresence>
                    {expanded && (
                      <motion.span initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -6 }}
                        transition={{ duration: 0.15 }}
                        className={cn("text-sm font-medium whitespace-nowrap", active ? "text-white" : "text-text group-hover:text-text")}>
                        {label}
                      </motion.span>
                    )}
                  </AnimatePresence>
                  {!expanded && (
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

        {/* Footer — mobile only */}
        {forMobile && (
          <div className="px-3 py-4 border-t border-border">
            <div className="flex items-center gap-3 px-2.5 py-2 mb-1">
              <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ background: "linear-gradient(135deg, #4F46E5, #3730A3)" }}>
                <span className="text-white text-xs font-bold">{userName[0]?.toUpperCase()}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-text truncate">{userName}</p>
                <p className="text-[10px] text-text-muted">Institute Admin</p>
              </div>
            </div>
            <button onClick={() => { logout(); router.push("/login"); setSidebarOpen(false); }}
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
    <div className="flex h-screen bg-bg overflow-hidden">
      {/* Desktop collapsible sidebar */}
      <motion.aside
        onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}
        animate={{ width: hovered ? EXPANDED_W : COLLAPSED_W }}
        transition={{ type: "spring", stiffness: 320, damping: 30 }}
        className="hidden lg:flex flex-col h-screen sticky top-0 bg-bg-card border-r border-border shadow-sm flex-shrink-0 overflow-hidden z-20">
        <SidebarInner />
      </motion.aside>

      {/* Mobile top bar */}
      <div className={`lg:hidden fixed top-0 left-0 right-0 z-30 backdrop-blur-xl border-b border-border flex items-center justify-between px-3 h-14 ${dk ? "bg-[#0B1120]/90" : "bg-white/80"}`}
        style={{ boxShadow: dk ? "0 1px 8px rgba(0,0,0,0.3)" : "0 1px 8px rgba(0,0,0,0.06)" }}>
        <button onClick={() => setSidebarOpen(true)} className="w-9 h-9 rounded-xl flex items-center justify-center text-text hover:bg-bg active:scale-95 transition-all">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
          </svg>
        </button>
        <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "linear-gradient(135deg, #4F46E5, #3730A3)" }}>
            <span className="text-white font-black text-xs">N</span>
          </div>
          <span className="font-bold text-text text-sm">Nexora</span>
        </div>
        <div className="flex items-center gap-1.5">
          <button onClick={toggleTheme} className="w-8 h-8 rounded-lg flex items-center justify-center text-text-muted hover:text-primary hover:bg-bg transition-all">
            {dk ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
          <button onClick={() => setDropdownOpen(v => !v)}
            className="w-9 h-9 rounded-full flex items-center justify-center active:scale-95 transition-transform"
            style={{ background: "linear-gradient(135deg, #4F46E5, #3730A3)" }}>
            <span className="text-white text-xs font-bold">{userName[0]?.toUpperCase()}</span>
          </button>
        </div>
      </div>

      {/* Mobile sidebar overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="lg:hidden fixed inset-0 bg-black/30 z-40 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
            <motion.aside initial={{ x: -280 }} animate={{ x: 0 }} exit={{ x: -280 }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
              className="lg:hidden fixed left-0 top-0 bottom-0 w-[260px] bg-bg-card z-50 shadow-2xl">
              <button onClick={() => setSidebarOpen(false)}
                className="absolute top-4 right-4 p-1.5 rounded-lg text-text-muted hover:bg-bg transition-colors">
                <X className="h-4 w-4" />
              </button>
              <SidebarInner forMobile />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Desktop header */}
        <div className="hidden lg:flex flex-col flex-shrink-0 z-20">
          <div className="bg-bg-card border-b border-border shadow-sm">
            <div className="flex items-center justify-between px-8 py-4">
              <div>
                <h2 className="text-xl font-bold text-text">
                  {pathname === "/institute/dashboard"
                    ? `Good ${greeting}, ${userName.split(" ")[0]} 👋`
                    : meta.title}
                </h2>
                {meta.subtitle && <p className="text-xs text-text-muted mt-0.5">{meta.subtitle}</p>}
              </div>
              <div className="flex items-center gap-3">
                <p className="text-xs text-text-muted">
                  {new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
                </p>
                <button onClick={toggleTheme}
                  className="w-9 h-9 rounded-xl flex items-center justify-center border border-border text-text-muted hover:text-primary hover:border-primary/30 hover:bg-primary/5 transition-all">
                  {dk ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                </button>
                <div className="relative" ref={dropdownRef}>
                  <button onClick={() => setDropdownOpen(v => !v)}
                    className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm transition-transform hover:scale-105"
                    style={{ background: "linear-gradient(135deg, #4F46E5, #3730A3)" }}>
                    <span className="text-white text-sm font-bold">{userName[0]?.toUpperCase()}</span>
                  </button>
                  {dropdownOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-bg-card rounded-xl shadow-lg border border-border py-2 z-50">
                      <div className="px-4 py-2.5 border-b border-border">
                        <p className="text-sm font-semibold text-text truncate">{userName}</p>
                        <p className="text-xs text-text-muted">Institute Admin</p>
                      </div>
                      <button onClick={() => { logout(); router.push("/login"); }}
                        className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-text hover:bg-primary/5 hover:text-primary transition-colors">
                        <LogOut className="w-4 h-4" />
                        Logout
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <main className="flex-1 p-6 lg:p-8 pt-20 lg:pt-6 pb-4 overflow-y-auto overflow-x-hidden">
          {children}
        </main>

        <footer className="px-8 py-3 flex items-center justify-between text-xs text-text-muted bg-bg-card flex-shrink-0 border-t border-border">
          <span>© {new Date().getFullYear()} <span className="font-semibold" style={{ color: "#4F46E5" }}>Nexora</span>. All rights reserved.</span>
          <span className="hidden sm:block">Smart Student Attendance System 📚</span>
        </footer>
      </div>
    </div>
  );
}
