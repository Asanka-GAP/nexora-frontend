"use client";
import { useCallback, useMemo } from "react";
import { Calendar, Clock } from "lucide-react";
import AppShell from "@/components/layout/AppShell";
import EmptyState from "@/components/shared/EmptyState";
import { CardSkeleton } from "@/components/ui/Skeleton";
import { useFetch } from "@/hooks/useFetch";
import { getSchedules, getClasses } from "@/services/api";
import { DAYS } from "@/lib/utils";
import type { Schedule, ClassItem } from "@/lib/types";

export default function SchedulePage() {
  const fetchSchedules = useCallback(() => getSchedules(), []);
  const fetchClasses = useCallback(() => getClasses(), []);
  const { data: schedules, loading: sLoading } = useFetch(fetchSchedules);
  const { data: classes, loading: cLoading } = useFetch(fetchClasses);

  const loading = sLoading || cLoading;

  const classMap = useMemo(() => {
    const map: Record<string, ClassItem> = {};
    (classes ?? []).forEach((c) => { map[c.id] = c; });
    return map;
  }, [classes]);

  const grouped = useMemo(() => {
    const g: Record<number, Schedule[]> = {};
    (schedules ?? []).forEach((s) => {
      if (!g[s.dayOfWeek]) g[s.dayOfWeek] = [];
      g[s.dayOfWeek].push(s);
    });
    // Sort each day by start time
    Object.values(g).forEach((arr) => arr.sort((a, b) => a.startTime.localeCompare(b.startTime)));
    return g;
  }, [schedules]);

  const hasSched = Object.keys(grouped).length > 0;

  return (
    <AppShell title="Schedule">
      {loading ? (
        <div className="space-y-4">
          <CardSkeleton /><CardSkeleton /><CardSkeleton />
        </div>
      ) : !hasSched ? (
        <EmptyState icon={Calendar} title="No schedule yet" description="Schedules will appear here once configured in the backend" />
      ) : (
        <div className="space-y-6">
          {[1, 2, 3, 4, 5, 6, 0].map((day) => {
            const items = grouped[day];
            if (!items?.length) return null;
            return (
              <div key={day}>
                <h3 className="text-sm font-semibold text-text mb-2">{DAYS[day]}</h3>
                <div className="space-y-2">
                  {items.map((s) => {
                    const cls = classMap[s.classId];
                    return (
                      <div
                        key={s.id}
                        className="flex items-center gap-4 rounded-2xl bg-bg-card border border-border p-4 shadow-sm hover:shadow-md transition-shadow"
                      >
                        <div className="rounded-xl bg-primary/10 p-2.5">
                          <Clock className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-text truncate">{cls?.name ?? "Unknown Class"}</p>
                          <p className="text-sm text-text-muted">{cls?.subject ?? ""}</p>
                        </div>
                        <p className="text-sm font-medium text-text-muted whitespace-nowrap">
                          {s.startTime.slice(0, 5)} – {s.endTime.slice(0, 5)}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </AppShell>
  );
}
