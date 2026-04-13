"use client";
import { useState, useRef, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { useTheme } from "@/lib/theme";
import { Sun, Moon, CalendarDays } from "lucide-react";
import Link from "next/link";

const pageMeta: Record<string, { title: string; subtitle: string }> = {
  "/dashboard": { title: "Dashboard", subtitle: "Here's your overview for today." },
  "/students": { title: "Students", subtitle: "Manage student records and enrollment." },
  "/classes": { title: "Classes", subtitle: "Manage your classes and subjects." },
  "/schedule": { title: "Schedule", subtitle: "Plan and manage class schedules." },
  "/calendar": { title: "Calendar", subtitle: "View your weekly and monthly calendar." },
  "/attendance": { title: "Attendance", subtitle: "View attendance records and history." },
  "/scanner": { title: "Scanner", subtitle: "Scan QR codes for attendance." },
  "/settings": { title: "Settings", subtitle: "Manage your account and preferences." },
};

interface HeaderProps {
  title: string;
  onMenuClick: () => void;
}

export default function Header({ title, onMenuClick }: HeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const meta = pageMeta[pathname] ?? { title, subtitle: "" };
  const isDashboard = pathname === "/dashboard";
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setDropdownOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  const userName = user?.name || "Teacher";

  return (
    <div className="hidden lg:flex flex-col flex-shrink-0 z-20">
      <div className="bg-bg-card border-b border-border shadow-sm">
        <div className="flex items-center justify-between px-8 py-4">
          <div>
            <h2 className={`${isDashboard ? "text-xl font-bold" : "text-lg font-semibold"} text-text`}>
              {isDashboard
                ? `Good ${new Date().getHours() < 12 ? "morning" : new Date().getHours() < 17 ? "afternoon" : "evening"}, ${userName.split(" ")[0]} 👋`
                : meta.title}
            </h2>
            {meta.subtitle && <p className="text-xs text-text-muted mt-0.5">{meta.subtitle}</p>}
          </div>

          <div className="flex items-center gap-3">
            <p className="text-xs text-text-muted">
              {new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
            </p>

            {/* Calendar shortcut */}
            <Link href="/calendar"
              className="w-9 h-9 rounded-xl flex items-center justify-center border border-border text-text-muted hover:text-primary hover:border-primary/30 hover:bg-primary/5 transition-all"
              title="Calendar">
              <CalendarDays className="w-4 h-4" />
            </Link>

            {/* Theme toggle */}
            <button onClick={toggleTheme}
              className="w-9 h-9 rounded-xl flex items-center justify-center border border-border text-text-muted hover:text-primary hover:border-primary/30 hover:bg-primary/5 transition-all"
              title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}>
              {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            <div className="relative" ref={dropdownRef}>
              <button onClick={() => setDropdownOpen((v) => !v)}
                className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm transition-transform hover:scale-105"
                style={{ background: "linear-gradient(135deg, #4F46E5, #3730A3)" }}>
                <span className="text-white text-sm font-bold">{userName[0]?.toUpperCase() ?? "U"}</span>
              </button>
              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-bg-card rounded-xl shadow-lg border border-border py-2 z-50">
                  <div className="px-4 py-2.5 border-b border-border">
                    <p className="text-sm font-semibold text-text truncate">{userName}</p>
                    <p className="text-xs text-text-muted truncate">Teacher</p>
                  </div>
                  <button onClick={handleLogout}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-text hover:bg-primary/5 hover:text-primary transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-4 h-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
                    </svg>
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
