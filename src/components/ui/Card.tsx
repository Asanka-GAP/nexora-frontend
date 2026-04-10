import { cn } from "@/lib/utils";
import { HTMLAttributes } from "react";

export default function Card({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-2xl bg-bg-card border border-border p-6 shadow-sm transition-shadow hover:shadow-md",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
