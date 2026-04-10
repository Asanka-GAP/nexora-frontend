import { cn } from "@/lib/utils";

interface SkeletonProps {
  className?: string;
  count?: number;
}

export default function Skeleton({ className, count = 1 }: SkeletonProps) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className={cn("skeleton h-4 w-full", className)} />
      ))}
    </>
  );
}

export function CardSkeleton() {
  return (
    <div className="rounded-2xl bg-bg-card border border-border p-6 space-y-3">
      <div className="skeleton h-4 w-1/3" />
      <div className="skeleton h-8 w-1/2" />
      <div className="skeleton h-3 w-2/3" />
    </div>
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      <div className="skeleton h-10 w-full rounded-xl" />
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="skeleton h-14 w-full rounded-xl" />
      ))}
    </div>
  );
}
