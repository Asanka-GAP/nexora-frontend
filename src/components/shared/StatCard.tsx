import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  color: "primary" | "secondary" | "success" | "danger" | "warning";
  subtitle?: string;
}

const colorMap = {
  primary: "bg-primary/10 text-primary",
  secondary: "bg-secondary/10 text-secondary",
  success: "bg-success/10 text-success",
  danger: "bg-danger/10 text-danger",
  warning: "bg-warning/10 text-warning",
};

export default function StatCard({ title, value, icon: Icon, color, subtitle }: StatCardProps) {
  return (
    <div className="rounded-2xl bg-bg-card border border-border p-6 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <p className="text-sm text-text-muted">{title}</p>
          <p className="text-3xl font-bold text-text">{value}</p>
          {subtitle && <p className="text-xs text-text-muted">{subtitle}</p>}
        </div>
        <div className={cn("rounded-2xl p-3", colorMap[color])}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  );
}
