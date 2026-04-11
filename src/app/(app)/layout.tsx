"use client";
import AppShell from "@/components/layout/AppShell";
import { usePathname } from "next/navigation";

const TITLES: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/students": "Students",
  "/classes": "Classes",
  "/schedule": "Schedule",
  "/calendar": "Calendar",
  "/attendance": "Attendance",
  "/settings": "Settings",
};

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const title = TITLES[pathname] ?? "Nexora";

  return <AppShell title={title}>{children}</AppShell>;
}
