"use client";
import { cn } from "@/lib/utils";
import { ButtonHTMLAttributes, forwardRef } from "react";

type Variant = "primary" | "secondary" | "danger" | "ghost" | "outline";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

const variants: Record<Variant, string> = {
  primary: "text-white shadow-md",
  secondary: "bg-emerald-500 text-white hover:bg-emerald-600 shadow-md",
  danger: "bg-red-500 text-white hover:bg-red-600 shadow-md",
  ghost: "bg-transparent hover:bg-slate-100 text-slate-600",
  outline: "border border-slate-200 bg-transparent hover:bg-slate-50 text-slate-600",
};

const sizes: Record<Size, string> = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-4 py-2 text-sm",
  lg: "px-6 py-3 text-base",
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", loading, children, disabled, style, ...props }, ref) => (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-all duration-200",
        "focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:ring-offset-2",
        "disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.97]",
        variants[variant], sizes[size], className
      )}
      style={variant === "primary" ? { background: "linear-gradient(135deg, #4F46E5, #3730A3)", boxShadow: "0 4px 14px rgba(79,70,229,0.3)", ...style } : style}
      {...props}
    >
      {loading && (
        <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
        </svg>
      )}
      {children}
    </button>
  )
);
Button.displayName = "Button";
export default Button;
