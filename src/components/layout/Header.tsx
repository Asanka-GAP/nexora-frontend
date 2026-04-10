"use client";
import { Menu, User } from "lucide-react";

interface HeaderProps {
  title: string;
  onMenuClick: () => void;
}

export default function Header({ title, onMenuClick }: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 flex items-center justify-between bg-bg-card/80 backdrop-blur-md border-b border-border px-4 py-3 lg:px-6">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="rounded-xl p-2 hover:bg-border/50 transition-colors lg:hidden"
        >
          <Menu className="h-5 w-5 text-text" />
        </button>
        <h1 className="text-lg font-semibold text-text">{title}</h1>
      </div>
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 rounded-xl bg-bg px-3 py-2">
          <div className="rounded-full bg-primary/10 p-1.5">
            <User className="h-4 w-4 text-primary" />
          </div>
          <span className="hidden sm:block text-sm font-medium text-text">Teacher</span>
        </div>
      </div>
    </header>
  );
}
