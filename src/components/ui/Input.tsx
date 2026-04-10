"use client";
import { cn } from "@/lib/utils";
import { InputHTMLAttributes, forwardRef } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, id, ...props }, ref) => (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-text">
          {label}
        </label>
      )}
      <input
        ref={ref}
        id={id}
        className={cn(
          "w-full rounded-xl border border-border bg-bg-card px-4 py-2.5 text-sm text-text",
          "placeholder:text-text-muted transition-all duration-200",
          "focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary",
          error && "border-danger focus:ring-danger/50",
          className
        )}
        {...props}
      />
      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  )
);
Input.displayName = "Input";
export default Input;
