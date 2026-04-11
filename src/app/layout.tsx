import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";
import { AuthProvider } from "@/lib/auth";

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
          {children}
        </AuthProvider>
        <Toaster
          position="top-right"
          richColors
          closeButton
          toastOptions={{
            unstyled: true,
            classNames: {
              toast: "flex items-start gap-3 w-full p-4 rounded-2xl shadow-xl border backdrop-blur-sm font-[var(--font-inter)]  text-sm",
              title: "font-semibold text-sm leading-tight",
              description: "text-xs opacity-80 mt-0.5",
              closeButton: "!bg-transparent !border-0 !shadow-none !text-current opacity-40 hover:opacity-100 transition-opacity !top-1 !right-1",
              success: "bg-emerald-50 border-emerald-200/60 text-emerald-800 [&_[data-icon]]:text-emerald-500",
              error: "bg-red-50 border-red-200/60 text-red-800 [&_[data-icon]]:text-red-500",
              warning: "bg-amber-50 border-amber-200/60 text-amber-800 [&_[data-icon]]:text-amber-500",
              info: "bg-blue-50 border-blue-200/60 text-blue-800 [&_[data-icon]]:text-blue-500",
            },
          }}
        />
      </body>
    </html>
  );
}
