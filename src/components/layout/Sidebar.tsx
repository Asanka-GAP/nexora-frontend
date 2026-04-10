"use client";
import { useState, useRef } from "react";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard, Users, BookOpen, ScanLine, Calendar, CalendarDays, X, GraduationCap, CheckSquare,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

const COLLAPSED_W = 68;
const EXPANDED_W = 256;

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/students", label: "Students", icon: Users },
  { href: "/classes", label: "Classes", icon: BookOpen },
  { href: "/schedule", label: "Schedule", icon: Calendar },
  { href: "/calendar", label: "Calendar", icon: CalendarDays },
  { href: "/attendance", label: "Attendance", icon: CheckSquare },
  { href: "/scanner", label: "Scanner", icon: ScanLine },
];

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export default function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname();
  const [hovered, setHovered] = useState(false);
  const leaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleMouseEnter = () => {
    if (leaveTimer.current) clearTimeout(leaveTimer.current);
    setHovered(true);
  };

  const handleMouseLeave = () => {
    leaveTimer.current = setTimeout(() => setHovered(false), 120);
  };

  const SidebarInner = ({ forMobile = false }: { forMobile?: boolean }) => {
    const show = hovered || forMobile;
    return (
      <div className="flex flex-col h-full overflow-hidden">
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 py-5 border-b border-border overflow-hidden">
          <div className="w-9 h-9 rounded-xl bg-primary p-2 shadow-md flex-shrink-0">
            <GraduationCap className="h-5 w-5 text-white" />
          </div>
          <AnimatePresence>
            {show && (
              <motion.div
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                transition={{ duration: 0.18 }}
                className="overflow-hidden whitespace-nowrap"
              >
                <p className="font-bold text-text text-base leading-tight">Nexora</p>
                <p className="text-xs text-text-muted leading-tight">Attendance System</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-2.5 py-4 space-y-0.5 overflow-y-auto overflow-x-hidden">
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(href + "/");
            return (
              <Link key={href} href={href} onClick={onClose}>
                <div
                  className={cn(
                    "relative flex items-center rounded-xl transition-all duration-150 group cursor-pointer overflow-hidden",
                    show ? "gap-3 px-2.5 py-2.5" : "w-10 h-10 justify-center mx-auto",
                    active
                      ? "text-white shadow-lg bg-gradient-to-r from-primary to-primary-dark"
                      : "text-text-muted hover:bg-border/50 hover:text-text"
                  )}
                >
                  <Icon className={cn(
                    "flex-shrink-0 h-5 w-5 transition-colors",
                    active ? "text-white" : "text-text-muted group-hover:text-primary"
                  )} />
                  <AnimatePresence>
                    {show && (
                      <motion.span
                        initial={{ opacity: 0, x: -6 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -6 }}
                        transition={{ duration: 0.15 }}
                        className={cn(
                          "text-sm font-medium whitespace-nowrap",
                          active ? "text-white" : "text-text group-hover:text-text"
                        )}
                      >
                        {label}
                      </motion.span>
                    )}
                  </AnimatePresence>
                  {/* Tooltip for collapsed state */}
                  {!show && (
                    <div className="absolute left-full ml-3 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-white whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-150 translate-x-1 group-hover:translate-x-0 shadow-lg z-50 bg-gradient-to-r from-primary to-primary-dark">
                      {label}
                      <span className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-primary" />
                    </div>
                  )}
                </div>
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="px-4 py-4 border-t border-border overflow-hidden">
          <AnimatePresence>
            {show ? (
              <motion.p
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                transition={{ duration: 0.18 }}
                className="text-xs text-text-muted"
              >
                © 2025 Nexora
              </motion.p>
            ) : (
              <div className="w-6 h-6 rounded-full bg-primary/10 mx-auto" />
            )}
          </AnimatePresence>
        </div>
      </div>
    );
  };

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-40 bg-black/50 lg:hidden backdrop-blur-sm"
          onClick={onClose}
        />
      )}

      {/* Desktop Sidebar */}
      <motion.aside
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        animate={{ width: hovered ? EXPANDED_W : COLLAPSED_W }}
        transition={{ type: "spring", stiffness: 320, damping: 30 }}
        className="hidden lg:flex flex-col h-screen sticky top-0 bg-bg-card border-r border-border shadow-sm flex-shrink-0 overflow-hidden z-20"
      >
        <SidebarInner />
      </motion.aside>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {open && (
          <motion.aside
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            exit={{ x: -280 }}
            transition={{ type: "spring", damping: 28, stiffness: 300 }}
            className="lg:hidden fixed left-0 top-0 bottom-0 w-64 bg-bg-card z-50 shadow-2xl"
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-text-muted hover:bg-border/50 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
            <SidebarInner forMobile />
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
}
