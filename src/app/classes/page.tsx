"use client";
import { useState, useCallback } from "react";
import { toast } from "sonner";
import { Plus, BookOpen, Users } from "lucide-react";
import AppShell from "@/components/layout/AppShell";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import { CardSkeleton } from "@/components/ui/Skeleton";
import EmptyState from "@/components/shared/EmptyState";
import { useFetch } from "@/hooks/useFetch";
import { getClasses, createClass } from "@/services/api";

const emptyForm = { name: "", subject: "", grade: 1, teacherId: "" };

export default function ClassesPage() {
  const fetchClasses = useCallback(() => getClasses(), []);
  const { data: classes, loading, refetch } = useFetch(fetchClasses);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.subject) {
      toast.error("Name and subject are required");
      return;
    }
    setSaving(true);
    try {
      await createClass({ ...form, grade: Number(form.grade) });
      toast.success("Class created");
      setModalOpen(false);
      setForm(emptyForm);
      refetch();
    } catch {
      toast.error("Failed to create class");
    } finally {
      setSaving(false);
    }
  };

  const selectedClass = (classes ?? []).find((c) => c.id === selected);

  return (
    <AppShell title="Classes">
      <div className="flex justify-between items-center mb-4">
        <p className="text-sm text-text-muted">{classes?.length ?? 0} classes</p>
        <Button onClick={() => setModalOpen(true)}>
          <Plus className="h-4 w-4" />
          New Class
        </Button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <CardSkeleton /><CardSkeleton /><CardSkeleton />
        </div>
      ) : !classes?.length ? (
        <EmptyState icon={BookOpen} title="No classes yet" description="Create your first class to get started" />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {classes.map((cls) => (
            <button
              key={cls.id}
              onClick={() => setSelected(cls.id === selected ? null : cls.id)}
              className={`text-left rounded-2xl border p-5 shadow-sm transition-all duration-200 hover:shadow-md ${
                cls.id === selected ? "border-primary bg-primary/5" : "border-border bg-bg-card"
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-text">{cls.name}</h3>
                  <p className="text-sm text-text-muted mt-0.5">{cls.subject}</p>
                </div>
                <span className="rounded-full bg-secondary/10 text-secondary px-2.5 py-0.5 text-xs font-medium">
                  Grade {cls.grade}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Class detail panel */}
      {selectedClass && (
        <div className="mt-6 rounded-2xl bg-bg-card border border-border p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-text mb-1">{selectedClass.name}</h2>
          <p className="text-sm text-text-muted mb-4">{selectedClass.subject} · Grade {selectedClass.grade}</p>
          <div className="flex items-center gap-2 text-sm text-text-muted">
            <Users className="h-4 w-4" />
            <span>Student enrollment management coming soon</span>
          </div>
        </div>
      )}

      {/* Create Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Create Class">
        <form onSubmit={handleSave} className="space-y-4">
          <Input id="cname" label="Class Name" placeholder="Math 101" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <Input id="subject" label="Subject" placeholder="Mathematics" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} />
          <Input id="cgrade" label="Grade" type="number" value={String(form.grade)} onChange={(e) => setForm({ ...form, grade: Number(e.target.value) })} />
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="ghost" type="button" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit" loading={saving}>Create Class</Button>
          </div>
        </form>
      </Modal>
    </AppShell>
  );
}
