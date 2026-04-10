"use client";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard, Users, BookOpen, ScanLine, Calendar, X, GraduationCap,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/students", label: "Students", icon: Users },
  { href: "/classes", label: "Classes", icon: BookOpen },
  { href: "/scanner", label: "Scanner", icon: ScanLine },
  { href: "/schedule", label: "Schedule", icon: Calendar },
];

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export default function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname();

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={onClose} />
      )}

      <aside
        className={cn(
          "fixed top-0 left-0 z-50 h-full w-64 bg-bg-card border-r border-border",
          "flex flex-col transition-transform duration-300 lg:translate-x-0 lg:static lg:z-auto",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Logo */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-border">
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <div className="rounded-xl bg-primary p-2">
              <GraduationCap className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold text-text">Nexora</span>
          </Link>
          <button onClick={onClose} className="lg:hidden rounded-lg p-1.5 hover:bg-border/50">
            <X className="h-5 w-5 text-text-muted" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(href + "/");
            return (
              <Link
                key={href}
                href={href}
                onClick={onClose}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200",
                  active
                    ? "bg-primary text-white shadow-md shadow-primary/20"
                    : "text-text-muted hover:bg-border/50 hover:text-text"
                )}
              >
                <Icon className="h-5 w-5" />
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border">
          <p className="text-xs text-text-muted">© 2025 Nexora</p>
        </div>
      </aside>
    </>
  );
}
