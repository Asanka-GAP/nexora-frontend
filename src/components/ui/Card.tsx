import { cn } from "@/lib/utils";
import { HTMLAttributes } from "react";

export default function Card({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "bg-white rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.06)] border border-slate-100 p-6 hover:shadow-[0_4px_20px_rgba(0,0,0,0.1)] transition-shadow duration-200",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
