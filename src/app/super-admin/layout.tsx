"use client";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth";

const nav = [
  { label: "Dashboard", href: "/super-admin", icon: "M2.25 12l8.954-8.955a1.126 1.126 0 011.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" },
  { label: "Teachers", href: "/super-admin/teachers", icon: "M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" },
  { label: "Students", href: "/super-admin/students", icon: "M4.26 10.147a60.438 60.438 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5" },
  { label: "Classes", href: "/super-admin/classes", icon: "M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" },
];

const NavIcon = ({ d }: { d: string }) => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d={d} /></svg>);

export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (!loading && (!user || user.role !== "SUPER_ADMIN")) router.push("/login");
  }, [user, loading, router]);

  if (loading || !user || user.role !== "SUPER_ADMIN") {
    return (<div className="h-screen flex items-center justify-center bg-slate-950"><div className="animate-spin w-8 h-8 border-3 border-indigo-500 border-t-transparent rounded-full" /></div>);
  }

  const NavLinks = ({ onNav }: { onNav?: () => void }) => (
    <nav className="flex-1 px-3 py-4 space-y-1">
      {nav.map((item) => {
        const active = pathname === item.href;
        return (<Link key={item.href} href={item.href} onClick={onNav}><div className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 ${active ? "bg-indigo-500/10 text-indigo-400" : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"}`}><NavIcon d={item.icon} /><span className="text-sm font-medium">{item.label}</span></div></Link>);
      })}
    </nav>
  );

  return (
    <div className="flex h-screen bg-slate-950 overflow-hidden">
      <aside className="hidden lg:flex w-64 bg-slate-900 border-r border-slate-800 flex-col flex-shrink-0">
        <div className="flex items-center gap-3 px-5 py-5 border-b border-slate-800">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center shadow-md" style={{ background: "linear-gradient(135deg, #4F46E5, #3730A3)" }}><span className="text-white font-black text-base">N</span></div>
          <div><p className="font-bold text-white text-sm leading-tight">Nexora</p><p className="text-[10px] text-indigo-400 font-semibold tracking-wider uppercase">Super Admin</p></div>
        </div>
        <NavLinks />
        <div className="px-3 py-4 border-t border-slate-800">
          <button onClick={() => { logout(); router.push("/login"); }} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-400 hover:bg-slate-800 hover:text-red-400 transition-all cursor-pointer">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" /></svg>
            <span className="text-sm font-medium">Logout</span>
          </button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-30 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-4 h-14">
        <div className="flex items-center gap-2.5"><div className="w-8 h-8 rounded-xl flex items-center justify-center shadow-md" style={{ background: "linear-gradient(135deg, #4F46E5, #3730A3)" }}><span className="text-white font-black text-sm">N</span></div><span className="font-bold text-white text-sm">Nexora</span></div>
        <button onClick={() => setMobileOpen(true)} className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-800"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" /></svg></button>
      </div>
      {mobileOpen && (<><div className="lg:hidden fixed inset-0 bg-black/50 z-40 backdrop-blur-sm" onClick={() => setMobileOpen(false)} /><aside className="lg:hidden fixed left-0 top-0 bottom-0 w-[260px] bg-slate-900 z-50 shadow-2xl flex flex-col"><div className="flex items-center justify-between px-5 py-5 border-b border-slate-800"><div className="flex items-center gap-3"><div className="w-9 h-9 rounded-xl flex items-center justify-center shadow-md" style={{ background: "linear-gradient(135deg, #4F46E5, #3730A3)" }}><span className="text-white font-black text-base">N</span></div><div><p className="font-bold text-white text-sm">Nexora</p><p className="text-[10px] text-indigo-400 font-semibold uppercase">Super Admin</p></div></div><button onClick={() => setMobileOpen(false)} className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-800"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg></button></div><NavLinks onNav={() => setMobileOpen(false)} /><div className="px-3 py-4 border-t border-slate-800"><button onClick={() => { logout(); router.push("/login"); setMobileOpen(false); }} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-400 hover:bg-slate-800 hover:text-red-400 transition-all cursor-pointer"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" /></svg><span className="text-sm font-medium">Logout</span></button></div></aside></>)}

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="hidden lg:flex bg-slate-900 border-b border-slate-800 px-8 py-4 items-center justify-between flex-shrink-0">
          <div><h1 className="text-lg font-semibold text-white">{nav.find(n => n.href === pathname)?.label || "Super Admin"}</h1><p className="text-xs text-slate-500 mt-0.5">Platform management console</p></div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-500">{new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</span>
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ background: "linear-gradient(135deg, #4F46E5, #3730A3)" }}>{user.username[0]?.toUpperCase()}</div>
          </div>
        </header>
        <main className="flex-1 p-4 pt-18 lg:p-8 lg:pt-8 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
