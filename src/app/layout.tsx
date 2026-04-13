import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";
import { AuthProvider } from "@/lib/auth";
import { ThemeProvider } from "@/lib/theme";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"], weight: ["400", "500", "600", "700", "800"] });

export const metadata: Metadata = {
  title: "Nexora — Student Attendance",
  description: "QR-based student attendance system",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.variable} antialiased`} style={{ fontFamily: "var(--font-inter), Inter, sans-serif" }}>
        <AuthProvider>
          <ThemeProvider>
            {children}
          </ThemeProvider>
        </AuthProvider>
        <Toaster
          position="top-center"
          richColors
          closeButton
          gap={8}
          toastOptions={{
            unstyled: true,
            duration: 3500,
            classNames: {
              toast: "group flex items-center gap-4 w-full max-w-sm mx-auto px-4 py-3.5 rounded-xl shadow-[0_8px_30px_rgba(0,0,0,0.12)] border bg-bg-card border-border font-[var(--font-inter)] text-sm",
              title: "font-semibold text-[13px] leading-snug text-text",
              description: "text-[11px] text-text-muted mt-0.5 leading-relaxed",
              closeButton: "!bg-transparent !border-0 !shadow-none opacity-0 group-hover:opacity-60 hover:!opacity-100 transition-opacity !top-1.5 !right-1.5 !text-text-muted",
              success: "!border-l-4 !border-l-emerald-500 !border-t-border !border-r-border !border-b-border !text-text [&_[data-icon]]:!text-emerald-500",
              error: "!border-l-4 !border-l-red-500 !border-t-border !border-r-border !border-b-border !text-text [&_[data-icon]]:!text-red-500",
              warning: "!border-l-4 !border-l-amber-500 !border-t-border !border-r-border !border-b-border !text-text [&_[data-icon]]:!text-amber-500",
              info: "!border-l-4 !border-l-blue-500 !border-t-border !border-r-border !border-b-border !text-text [&_[data-icon]]:!text-blue-500",
            },
          }}
        />
      </body>
    </html>
  );
}
