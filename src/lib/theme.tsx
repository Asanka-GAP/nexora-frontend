"use client";
import { createContext, useContext, useEffect, useState, useCallback } from "react";

type Theme = "light" | "dark";

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (t: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType>({ theme: "light", toggleTheme: () => {}, setTheme: () => {} });

function getUserId(): string | null {
  try {
    const stored = localStorage.getItem("nexora_user");
    if (stored) {
      const user = JSON.parse(stored);
      return user.teacherId || null;
    }
  } catch {}
  return null;
}

function getThemeKey(): string {
  const userId = getUserId();
  return userId ? `nexora_theme_${userId}` : "nexora_theme";
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("light");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(getThemeKey()) as Theme | null;
    const resolved = stored || "light";
    setThemeState(resolved);
    document.documentElement.classList.toggle("dark", resolved === "dark");
    setMounted(true);
  }, []);

  // Re-read theme when user changes (login/logout)
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === "nexora_user") {
        const stored = localStorage.getItem(getThemeKey()) as Theme | null;
        const resolved = stored || "light";
        setThemeState(resolved);
        document.documentElement.classList.toggle("dark", resolved === "dark");
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const setTheme = useCallback((t: Theme) => {
    setThemeState(t);
    localStorage.setItem(getThemeKey(), t);
    document.documentElement.classList.toggle("dark", t === "dark");
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(theme === "light" ? "dark" : "light");
  }, [theme, setTheme]);

  if (!mounted) return null;

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
