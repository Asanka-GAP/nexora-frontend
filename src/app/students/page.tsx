"use client";
import { useState, useCallback } from "react";
import { toast } from "sonner";
import { Plus, Search, Trash2 } from "lucide-react";
import AppShell from "@/components/layout/AppShell";
import DataTable, { Column } from "@/components/shared/DataTable";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import { TableSkeleton } from "@/components/ui/Skeleton";
import { useFetch } from "@/hooks/useFetch";
import { getStudents, createStudent } from "@/services/api";
import type { Student } from "@/lib/types";

const emptyForm = { studentCode: "", fullName: "", admissionYear: new Date().getFullYear(), currentGrade: 1, contactName: "", phone: "", relationship: "Parent" };

export default function StudentsPage() {
  const fetchStudents = useCallback(() => getStudents(), []);
  const { data: students, loading, refetch } = useFetch(fetchStudents);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const filtered = (students ?? []).filter(
    (s) =>
      s.fullName.toLowerCase().includes(search.toLowerCase()) ||
      s.studentCode.toLowerCase().includes(search.toLowerCase())
  );

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.studentCode || !form.fullName) {
      toast.error("Student code and name are required");
      return;
    }
    setSaving(true);
    try {
      await createStudent({
        studentCode: form.studentCode,
        fullName: form.fullName,
        admissionYear: form.admissionYear,
        currentGrade: form.currentGrade,
        contacts: form.phone
          ? [{ contactName: form.contactName, phone: form.phone, relationship: form.relationship, isPrimary: true }]
          : [],
      });
      toast.success("Student added");
      setModalOpen(false);
      setForm(emptyForm);
      refetch();
    } catch {
      toast.error("Failed to add student");
    } finally {
      setSaving(false);
    }
  };

  const columns: Column<Student>[] = [
    { key: "fullName", header: "Name" },
    { key: "studentCode", header: "Code" },
    { key: "currentGrade", header: "Grade", className: "text-center" },
    {
      key: "isActive",
      header: "Status",
      render: (s) => (
        <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${s.isActive ? "bg-success/10 text-success" : "bg-danger/10 text-danger"}`}>
          {s.isActive ? "Active" : "Inactive"}
        </span>
      ),
    },
    {
      key: "actions",
      header: "",
      className: "w-12",
      render: () => (
        <button className="rounded-lg p-1.5 hover:bg-danger/10 text-text-muted hover:text-danger transition-colors">
          <Trash2 className="h-4 w-4" />
        </button>
      ),
    },
  ];

  return (
    <AppShell title="Students">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
          <input
            placeholder="Search by name or code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-border bg-bg-card pl-10 pr-4 py-2.5 text-sm text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>
        <Button onClick={() => setModalOpen(true)}>
          <Plus className="h-4 w-4" />
          Add Student
        </Button>
      </div>

      {/* Table */}
      {loading ? (
        <TableSkeleton />
      ) : (
        <DataTable columns={columns} data={filtered} keyExtractor={(s) => s.id} emptyMessage="No students found" />
      )}

      {/* Add Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Add Student">
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input id="code" label="Student Code" placeholder="STU001" value={form.studentCode} onChange={(e) => setForm({ ...form, studentCode: e.target.value })} />
            <Input id="name" label="Full Name" placeholder="John Doe" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input id="year" label="Admission Year" type="number" value={String(form.admissionYear)} onChange={(e) => setForm({ ...form, admissionYear: Number(e.target.value) })} />
            <Input id="grade" label="Grade" type="number" value={String(form.currentGrade)} onChange={(e) => setForm({ ...form, currentGrade: Number(e.target.value) })} />
          </div>
          <hr className="border-border" />
          <p className="text-sm font-medium text-text">Parent Contact (optional)</p>
          <div className="grid grid-cols-2 gap-4">
            <Input id="cname" label="Contact Name" placeholder="Jane Doe" value={form.contactName} onChange={(e) => setForm({ ...form, contactName: e.target.value })} />
            <Input id="phone" label="Phone" placeholder="+1234567890" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="ghost" type="button" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit" loading={saving}>Save Student</Button>
          </div>
        </form>
      </Modal>
    </AppShell>
  );
}
