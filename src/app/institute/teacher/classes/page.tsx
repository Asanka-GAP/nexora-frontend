"use client";
import { useEffect, useState } from "react";
import { getInstituteTeacherClasses } from "@/services/api";
import type { InstituteClassResponse } from "@/lib/types";
import PageSkeleton from "@/components/ui/PageSkeleton";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function InstituteTeacherClassesPage() {
  const [classes, setClasses] = useState<InstituteClassResponse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { getInstituteTeacherClasses().then(setClasses).finally(() => setLoading(false)); }, []);

  if (loading) return <PageSkeleton />;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-text">My Classes</h2>
        <p className="text-text-muted text-sm mt-1">{classes.length} assigned class{classes.length !== 1 ? "es" : ""}</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {classes.length === 0 && <p className="text-text-muted">No classes assigned yet.</p>}
        {classes.map(c => (
          <div key={c.id} className="bg-bg-card border border-border rounded-2xl p-5 space-y-3 shadow-sm hover:shadow-md transition-shadow">
            <div>
              <p className="font-semibold text-text">{c.name}</p>
              <p className="text-xs text-text-muted mt-0.5">Grade {c.grade}{c.subject ? ` · ${c.subject}` : ""}</p>
            </div>
            <div className="space-y-1 text-xs text-text-muted">
              {c.classroomName && <p>Room: <span className="text-text font-medium">{c.classroomName}</span></p>}
              <p>Students: <span className="text-text font-medium">{c.studentCount}</span></p>
              {c.schedules.length > 0 && <p>Schedule: <span className="text-text font-medium">{c.schedules.map(s => `${DAYS[s.dayOfWeek ?? 0]} ${s.startTime}–${s.endTime}`).join(", ")}</span></p>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
