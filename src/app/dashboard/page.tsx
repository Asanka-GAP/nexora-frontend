"use client";
import { useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Users, CheckCircle, ScanLine, XCircle, BookOpen } from "lucide-react";
import AppShell from "@/components/layout/AppShell";
import StatCard from "@/components/shared/StatCard";
import Button from "@/components/ui/Button";
import { CardSkeleton } from "@/components/ui/Skeleton";
import { useFetch } from "@/hooks/useFetch";
import { getStudents, getClasses, cancelClass } from "@/services/api";
import type { ClassItem } from "@/lib/types";

export default function DashboardPage() {
  const router = useRouter();
  const fetchStudents = useCallback(() => getStudents(), []);
  const fetchClasses = useCallback(() => getClasses(), []);
  const { data: students, loading: sLoading } = useFetch(fetchStudents);
  const { data: classes, loading: cLoading, refetch } = useFetch(fetchClasses);

  const loading = sLoading || cLoading;
  const totalStudents = students?.length ?? 0;

  const todayClasses = useMemo(() => classes ?? [], [classes]);

  const handleCancel = async (cls: ClassItem) => {
    try {
      await cancelClass(cls.id);
      toast.success(`${cls.name} cancelled for today`);
      refetch();
    } catch {
      toast.error("Failed to cancel class");
    }
  };

  return (
    <AppShell title="Dashboard">
      {/* Stats */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          <StatCard title="Total Students" value={totalStudents} icon={Users} color="primary" />
          <StatCard title="Classes" value={todayClasses.length} icon={BookOpen} color="secondary" />
          <StatCard title="Today's Attendance" value="—" icon={CheckCircle} color="success" subtitle="Scan to record" />
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-wrap gap-3 mb-6">
        <Button size="lg" onClick={() => router.push("/scanner")}>
          <ScanLine className="h-5 w-5" />
          Start Scan
        </Button>
      </div>

      {/* Today's Classes */}
      <h2 className="text-base font-semibold text-text mb-3">Classes</h2>
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : !todayClasses.length ? (
        <div className="rounded-2xl bg-bg-card border border-border p-8 text-center text-text-muted">
          No classes found
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {todayClasses.map((cls) => (
            <div
              key={cls.id}
              className="rounded-2xl bg-bg-card border border-border p-5 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-text">{cls.name}</h3>
                  <p className="text-sm text-text-muted">{cls.subject} · Grade {cls.grade}</p>
                </div>
                <Button variant="danger" size="sm" onClick={() => handleCancel(cls)}>
                  <XCircle className="h-4 w-4" />
                  Cancel
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </AppShell>
  );
}
