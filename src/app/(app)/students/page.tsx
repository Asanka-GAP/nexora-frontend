"use client";
import { useState, useCallback, useEffect, useRef } from "react";
import { toast } from "sonner";
import { Plus, Trash2, Pencil, Users, UserPlus, Phone, QrCode, Download, Printer, GraduationCap, MapPin, BookOpen, User, Search, X, ChevronDown, UserCheck, UserX, Layers } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import QRCode from "qrcode";
import { toPng } from "html-to-image";
import { useAuth } from "@/lib/auth";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import { useFetch } from "@/hooks/useFetch";
import { getStudents, getClasses, createStudent, updateStudent, deleteStudentApi, toggleStudentStatus, addStudentContact, deleteStudentContact } from "@/services/api";
import type { Student, ClassItem } from "@/lib/types";
import PageSkeleton from "@/components/ui/PageSkeleton";

interface ParentRow { contactName: string; phone: string; relationship: string; isPrimary: boolean; }
const emptyForm = { fullName: "", currentGrade: 1, address: "" };
const emptyParent: ParentRow = { contactName: "", phone: "", relationship: "Parent", isPrimary: true };
const PAGE_SIZE = 10;

type StatusFilter = "ALL" | "ACTIVE" | "INACTIVE";

export default function StudentsPage() {
  const { user } = useAuth();
  const cardRef = useRef<HTMLDivElement>(null);
  const fetchStudents = useCallback(() => getStudents(), []);
  const { data: students, setData: setStudents, loading, refetch } = useFetch(fetchStudents);
  const fetchClasses = useCallback(() => getClasses(), []);
  const { data: classes } = useFetch(fetchClasses);
  const [search, setSearch] = useState("");
  const [filterGrade, setFilterGrade] = useState<number | "ALL">("ALL");
  const [filterStatus, setFilterStatus] = useState<StatusFilter>("ALL");
  const [page, setPage] = useState(1);

  // Create/Edit
  const [modalOpen, setModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [parents, setParents] = useState<ParentRow[]>([{ ...emptyParent }]);
  const [saving, setSaving] = useState(false);
  const [selectedClassIds, setSelectedClassIds] = useState<string[]>([]);
  const [classDropdownOpen, setClassDropdownOpen] = useState(false);
  const [classSearchQuery, setClassSearchQuery] = useState("");

  // Contact management
  const [contactStudent, setContactStudent] = useState<Student | null>(null);
  const [newContact, setNewContact] = useState<ParentRow>({ ...emptyParent });
  const [addingContact, setAddingContact] = useState(false);

  // Delete
  const [deleteTarget, setDeleteTarget] = useState<Student | null>(null);
  const [deleting, setDeleting] = useState(false);

  // QR Code
  const [qrStudent, setQrStudent] = useState<Student | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState("");

  useEffect(() => {
    if (qrStudent) {
      QRCode.toDataURL(qrStudent.studentCode, { width: 200, margin: 1, color: { dark: "#111827", light: "#ffffff" } })
        .then(setQrDataUrl).catch(() => setQrDataUrl(""));
    } else { setQrDataUrl(""); }
  }, [qrStudent]);

  const downloadCard = async () => {
    if (!cardRef.current || !qrStudent) return;
    try {
      const dataUrl = await toPng(cardRef.current, { pixelRatio: 3 });
      const link = document.createElement("a");
      link.download = `${qrStudent.studentCode}-${qrStudent.fullName.replace(/\s+/g, "_")}-ID-Card.png`;
      link.href = dataUrl;
      link.click();
    } catch {
      toast.error("Failed to download card");
    }
  };

  const printCard = () => {
    if (!cardRef.current || !qrStudent) return;
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    printWindow.document.write(`<html><head><title>Student ID - ${qrStudent.studentCode}</title>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
<style>
@page { size: 85.6mm 54mm; margin: 0; }
* { margin: 0; padding: 0; box-sizing: border-box; font-family: 'Inter', sans-serif; letter-spacing: -0.01em; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; color-adjust: exact !important; }
body { display: flex; align-items: center; justify-content: center; min-height: 100vh; background: #fff; }
.card { width: 85.6mm; height: 54mm; background: #fff; display: flex; flex-direction: column; overflow: hidden; border: 1px solid #e2e8f0; }
.header { background: linear-gradient(135deg, #4F46E5, #3730A3); padding: 8px 16px; display: flex; align-items: center; justify-content: space-between; }
.header-title { color: #fff; font-weight: 700; font-size: 15px; line-height: 1.2; }
.header-sub { color: rgba(255,255,255,0.7); font-size: 8px; text-transform: uppercase; letter-spacing: 1.5px; font-weight: 600; }
.header-logo { width: 28px; height: 28px; border-radius: 6px; background: rgba(255,255,255,0.2); display: flex; align-items: center; justify-content: center; color: #fff; font-weight: 900; font-size: 14px; }
.body { padding: 10px 16px; display: flex; gap: 14px; }
.info { flex: 1; }
.label { font-size: 8px; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px; font-weight: 600; margin-bottom: 1px; }
.name { font-size: 16px; font-weight: 700; color: #1e293b; line-height: 1.3; }
.divider { width: 100%; height: 1px; background: #e2e8f0; margin: 7px 0; }
.grid { display: grid; grid-template-columns: 1fr 1fr; gap: 5px 14px; }
.value { font-size: 11px; font-weight: 600; color: #334155; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.value-id { font-size: 11px; font-weight: 700; color: #4F46E5; font-family: 'Courier New', monospace; }
.qr-wrap { display: flex; flex-direction: column; align-items: center; justify-content: center; flex-shrink: 0; }
.qr-border { border: 1.5px solid #f1f5f9; border-radius: 8px; padding: 3px; }
.qr-border img { width: 95px; height: 95px; display: block; }
.qr-text { font-size: 7px; color: #94a3b8; margin-top: 3px; text-align: center; }
.footer { padding: 5px 16px; background: #f8fafc; border-top: 1px solid #f1f5f9; display: flex; align-items: center; justify-content: space-between; }
.footer-text { font-size: 7px; color: #94a3b8; }
.footer-brand { font-size: 7px; color: #94a3b8; font-weight: 600; }
</style></head><body>
<div class="card">
  <div class="header">
    <div><div class="header-title">Nexora</div><div class="header-sub">Student Identity Card</div></div>
    <div class="header-logo">N</div>
  </div>
  <div class="body">
    <div class="info">
      <div class="label">Student Name</div>
      <div class="name">${qrStudent.fullName}</div>
      <div class="divider"></div>
      <div class="grid">
        <div><div class="label">Student ID</div><div class="value-id">${qrStudent.studentCode}</div></div>
        <div><div class="label">Enrolled</div><div class="value">${new Date(qrStudent.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</div></div>
        <div><div class="label">Teacher</div><div class="value">${user?.name ?? "—"}</div></div>
        <div><div class="label">Subject</div><div class="value">${user?.subject ?? "—"}</div></div>
      </div>
    </div>
    <div class="qr-wrap">
      <div class="qr-border"><img src="${qrDataUrl}" alt="QR" /></div>
      <div class="qr-text">Scan for attendance</div>
    </div>
  </div>
  <div class="footer">
    <div class="footer-text">Valid throughout student's enrollment</div>
    <div class="footer-brand">nexora.app</div>
  </div>
</div>
</body></html>`);
    printWindow.document.close();
    printWindow.onload = () => { setTimeout(() => { printWindow.print(); printWindow.close(); }, 500); };
  };

  useEffect(() => { setPage(1); }, [search, filterGrade, filterStatus]);

  const all = students ?? [];
  const grades = [...new Set(all.map(s => s.currentGrade))].sort((a, b) => a - b);

  const filtered = all.filter(s => {
    if (filterGrade !== "ALL" && s.currentGrade !== filterGrade) return false;
    if (filterStatus === "ACTIVE" && !s.isActive) return false;
    if (filterStatus === "INACTIVE" && s.isActive) return false;
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return s.fullName.toLowerCase().includes(q) || s.studentCode.toLowerCase().includes(q) || (s.address?.toLowerCase().includes(q));
  });

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const openCreate = () => { setEditingStudent(null); setForm(emptyForm); setParents([{ ...emptyParent }]); setSelectedClassIds([]); setClassDropdownOpen(false); setClassSearchQuery(""); setModalOpen(true); };
  const openEdit = (s: Student) => { setEditingStudent(s); setForm({ fullName: s.fullName, currentGrade: s.currentGrade, address: s.address || "" }); setParents([]); setSelectedClassIds(s.enrolledClasses?.map(c => c.id) ?? []); setClassDropdownOpen(false); setClassSearchQuery(""); setModalOpen(true); };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.fullName) { toast.error("Student name is required"); return; }
    setSaving(true);
    try {
      if (editingStudent) {
        await updateStudent(editingStudent.id, { fullName: form.fullName, currentGrade: Number(form.currentGrade), address: form.address || undefined, classIds: selectedClassIds });
        toast.success("Student updated");
      } else {
        const validParents = parents.filter(p => p.contactName && p.phone);
        await createStudent({ fullName: form.fullName, currentGrade: Number(form.currentGrade), address: form.address || undefined, contacts: validParents, classIds: selectedClassIds });
        toast.success("Student added");
      }
      setModalOpen(false); setEditingStudent(null);
      const freshStudents = await getStudents();
      if (!editingStudent) {
        const newest = freshStudents.find(s => s.fullName === form.fullName);
        if (newest) setQrStudent(newest);
      }
      refetch();
    } catch { toast.error(editingStudent ? "Failed to update" : "Failed to add student"); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try { await deleteStudentApi(deleteTarget.id); toast.success("Student deleted"); setDeleteTarget(null); refetch(); }
    catch { toast.error("Failed to delete"); }
    finally { setDeleting(false); }
  };

  const handleToggle = async (s: Student) => {
    // Optimistic update
    setStudents(prev => prev ? prev.map(st => st.id === s.id ? { ...st, isActive: !st.isActive } : st) : prev);
    try { await toggleStudentStatus(s.id); toast.success(s.isActive ? "Student deactivated" : "Student activated"); }
    catch { toast.error("Failed to update status"); setStudents(prev => prev ? prev.map(st => st.id === s.id ? { ...st, isActive: s.isActive } : st) : prev); }
  };

  const handleAddContact = async () => {
    if (!contactStudent || !newContact.contactName || !newContact.phone) { toast.error("Name and phone required"); return; }
    setAddingContact(true);
    try {
      const updated = await addStudentContact(contactStudent.id, newContact);
      toast.success("Contact added");
      setContactStudent(updated);
      setNewContact({ ...emptyParent });
      refetch();
    } catch { toast.error("Failed to add contact"); }
    finally { setAddingContact(false); }
  };

  const handleDeleteContact = async (contactId: string) => {
    if (!contactStudent) return;
    try {
      await deleteStudentContact(contactStudent.id, contactId);
      toast.success("Contact removed");
      setContactStudent({ ...contactStudent, contacts: contactStudent.contacts.filter(c => c.id !== contactId) });
      refetch();
    } catch { toast.error("Failed to remove contact"); }
  };

  const addParentRow = () => setParents([...parents, { contactName: "", phone: "", relationship: "Parent", isPrimary: false }]);
  const removeParentRow = (idx: number) => setParents(parents.filter((_, i) => i !== idx));
  const updateParentRow = (idx: number, key: keyof ParentRow, val: string | boolean) => setParents(parents.map((p, i) => i === idx ? { ...p, [key]: val } : p));

  const pageNums = Array.from({ length: totalPages }, (_, i) => i + 1)
    .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
    .reduce<(number | string)[]>((acc, p, idx, arr) => { if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push("..."); acc.push(p); return acc; }, []);

  const activeCount = all.filter(s => s.isActive).length;
  const inactiveCount = all.length - activeCount;
  const totalContacts = all.reduce((sum, s) => sum + (s.contacts?.length ?? 0), 0);
  const totalEnrollments = all.reduce((sum, s) => sum + (s.enrolledClasses?.length ?? 0), 0);

  if (loading && !students) return <PageSkeleton />;

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div><h2 className="text-lg font-semibold text-text">All Students</h2><p className="text-xs text-text-muted mt-0.5">{all.length} students total</p></div>
        <Button onClick={openCreate}><Plus className="h-4 w-4" /> Add Student</Button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: "TOTAL", value: all.length, sub: "All students", gradient: "from-[#4F46E5] to-[#3730A3]", accentColor: "#4F46E5", icon: <Users className="w-5 h-5" /> },
          { label: "ACTIVE", value: activeCount, sub: `${all.length ? Math.round((activeCount / all.length) * 100) : 0}% of total`, gradient: "from-emerald-500 to-emerald-600", accentColor: "#10b981", icon: <UserCheck className="w-5 h-5" /> },
          { label: "GRADES", value: grades.length, sub: `${grades.length ? `Grade ${grades[0]}–${grades[grades.length - 1]}` : "None"}`, gradient: "from-amber-500 to-orange-500", accentColor: "#f59e0b", icon: <Layers className="w-5 h-5" /> },
          { label: "ENROLLMENTS", value: totalEnrollments, sub: `${all.length ? (totalEnrollments / all.length).toFixed(1) : 0} avg per student`, gradient: "from-violet-500 to-purple-600", accentColor: "#8b5cf6", icon: <BookOpen className="w-5 h-5" /> },
        ].map((card, i) => (
          <motion.div key={card.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
            className="relative bg-white rounded-2xl p-5 shadow-[0_2px_12px_rgba(0,0,0,0.06)] border border-slate-100 hover:shadow-[0_4px_20px_rgba(0,0,0,0.1)] transition-all duration-200 overflow-hidden group">
            <svg className="absolute bottom-0 right-0 w-28 h-16 opacity-[0.06] group-hover:opacity-[0.10] transition-opacity" viewBox="0 0 120 60" fill="none">
              <path d="M0 55 Q20 45 30 35 T60 20 T90 30 T120 10" stroke={card.accentColor} strokeWidth="3" fill="none" />
              <path d="M0 55 Q20 45 30 35 T60 20 T90 30 T120 10 V60 H0 Z" fill={card.accentColor} opacity="0.3" />
            </svg>
            <div className="relative">
              <div className="flex items-start justify-between mb-3">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{card.label}</p>
                <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${card.gradient} flex items-center justify-center text-white shadow-md`}>{card.icon}</div>
              </div>
              <p className="text-2xl font-bold text-slate-800 leading-tight">{card.value}</p>
              <p className="text-[11px] text-slate-400 mt-2">{card.sub}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-bg-card rounded-2xl shadow-sm border border-border p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
          <div className="relative flex-1">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, code, address..." className="w-full pl-10 pr-4 py-2.5 border border-border rounded-xl text-sm text-text bg-bg-card placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
          </div>
          {(search || filterGrade !== "ALL" || filterStatus !== "ALL") && (
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className="text-[11px] font-medium text-text-muted">{filtered.length} found</span>
              <button onClick={() => { setSearch(""); setFilterGrade("ALL"); setFilterStatus("ALL"); }} className="text-[11px] font-semibold text-primary hover:underline">Clear all</button>
            </div>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-3 mt-3">
          <div className="flex items-center bg-slate-100/80 rounded-xl p-0.5">
          {(["ALL", "ACTIVE", "INACTIVE"] as StatusFilter[]).map(s => (
            <button key={s} onClick={() => setFilterStatus(s)} className={`relative px-3.5 py-1.5 rounded-[10px] text-xs font-semibold transition-all whitespace-nowrap ${filterStatus === s ? "text-white shadow-sm" : "text-slate-500 hover:text-slate-700"}`} style={filterStatus === s ? { background: s === "INACTIVE" ? "linear-gradient(135deg, #EF4444, #DC2626)" : s === "ACTIVE" ? "linear-gradient(135deg, #10B981, #059669)" : "linear-gradient(135deg, #4F46E5, #3730A3)" } : {}}>
              {s === "ALL" ? "All" : s === "ACTIVE" ? "● Active" : "● Inactive"}
            </button>
          ))}
          </div>
          {grades.length > 1 && (<>
            <div className="w-px h-5 bg-slate-200 hidden sm:block" />
            <div className="flex items-center bg-slate-100/80 rounded-xl p-0.5">
            {(["ALL" as const, ...grades]).map(g => (
              <button key={g} onClick={() => setFilterGrade(g)} className={`px-3 py-1.5 rounded-[10px] text-[11px] font-semibold transition-all whitespace-nowrap ${filterGrade === g ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>{g === "ALL" ? "All" : `G${g}`}</button>
            ))}
            </div>
          </>)}
        </div>
      </div>

      {/* Table */}
      {!filtered.length && !loading ? (
        <div className="bg-bg-card rounded-2xl shadow-sm border border-border p-12 text-center">
          <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-primary/10 flex items-center justify-center"><Users className="w-7 h-7 text-primary/40" /></div>
          <p className="text-sm font-medium text-text-muted">No students found</p>
        </div>
      ) : (
        <div className="bg-bg-card rounded-2xl shadow-sm border border-border overflow-hidden">
          {/* Desktop */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full">
              <thead><tr className="border-b border-border">{["Student", "Code", "Grade", "Classes", "Join Date", "Status", "Action"].map(h => (<th key={h} className="text-left px-5 py-3.5 text-xs font-semibold text-text-muted uppercase tracking-wider">{h}</th>))}</tr></thead>
              <tbody>
                {paginated.map(s => (
                  <tr key={s.id} className="border-b border-border/50 hover:bg-bg/50 transition-colors">
                    <td className="px-5 py-3.5">
                      <p className="text-sm font-medium text-text">{s.fullName}</p>
                      {s.address && <p className="text-xs text-text-muted truncate max-w-[200px]">{s.address}</p>}
                    </td>
                    <td className="px-5 py-3.5 text-sm text-text-muted font-mono">{s.studentCode}</td>
                    <td className="px-5 py-3.5"><span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-secondary/15 text-cyan-800">Grade {s.currentGrade}</span></td>
                    <td className="px-5 py-3.5">
                      {s.enrolledClasses?.length ? (
                        <div className="flex flex-wrap gap-1">
                          {s.enrolledClasses.map(c => (
                            <span key={c.id} className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700">{c.name}</span>
                          ))}
                        </div>
                      ) : <span className="text-xs text-text-muted">—</span>}
                    </td>
                    <td className="px-5 py-3.5 text-sm text-text-muted">{new Date(s.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <button onClick={() => handleToggle(s)} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${s.isActive ? "bg-emerald-500" : "bg-red-500"}`}>
                          <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${s.isActive ? "translate-x-6" : "translate-x-1"}`} />
                        </button>
                        <span className={`text-xs font-semibold ${s.isActive ? "text-emerald-700" : "text-red-600"}`}>{s.isActive ? "Active" : "Inactive"}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1">
                        <button onClick={() => setQrStudent(s)} className="p-1.5 rounded-lg text-text-muted hover:text-primary hover:bg-primary/10 transition-all" title="QR Code"><QrCode className="w-4 h-4" /></button>
                        <button onClick={() => setContactStudent(s)} className="p-1.5 rounded-lg text-text-muted hover:text-primary hover:bg-primary/10 transition-all" title="Contacts"><Phone className="w-4 h-4" /></button>
                        <button onClick={() => openEdit(s)} className="p-1.5 rounded-lg text-text-muted hover:text-primary hover:bg-primary/10 transition-all" title="Edit"><Pencil className="w-4 h-4" /></button>
                        <button onClick={() => setDeleteTarget(s)} className="p-1.5 rounded-lg text-text-muted hover:text-danger hover:bg-danger/10 transition-all" title="Delete"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile */}
          <div className="lg:hidden">
            {paginated.map((s, i) => (
              <div key={s.id} className={`p-4 ${i % 2 === 0 ? "bg-bg-card" : "bg-bg/60"} ${i < paginated.length - 1 ? "border-b-2 border-border/80" : ""}`}>
                <div className="flex gap-3">
                  <div className={`w-1 rounded-full flex-shrink-0 ${s.isActive ? "bg-success" : "bg-danger"}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div><p className="font-semibold text-text text-sm truncate">{s.fullName}</p><p className="text-[10px] text-text-muted font-mono">{s.studentCode}</p></div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${s.isActive ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>{s.isActive ? "Active" : "Inactive"}</span>
                    </div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-text-muted">Status</span>
                      <div className="flex items-center gap-2">
                        <button onClick={() => handleToggle(s)} className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${s.isActive ? "bg-emerald-500" : "bg-red-500"}`}>
                          <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-sm transition-transform ${s.isActive ? "translate-x-[18px]" : "translate-x-0.5"}`} />
                        </button>
                        <span className={`text-xs font-semibold ${s.isActive ? "text-emerald-700" : "text-red-600"}`}>{s.isActive ? "Active" : "Inactive"}</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2 mb-2">
                      <div className="bg-bg rounded-lg px-2.5 py-2"><p className="text-[9px] font-semibold text-text-muted uppercase">Grade</p><p className="text-xs font-medium text-text mt-0.5">{s.currentGrade}</p></div>
                      <div className="bg-bg rounded-lg px-2.5 py-2"><p className="text-[9px] font-semibold text-text-muted uppercase">Enrolled</p><p className="text-xs font-medium text-text mt-0.5">{new Date(s.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</p></div>
                      <div className="bg-bg rounded-lg px-2.5 py-2"><p className="text-[9px] font-semibold text-text-muted uppercase">Classes</p><p className="text-xs font-medium text-text mt-0.5">{s.enrolledClasses?.length || 0}</p></div>
                    </div>
                    {s.enrolledClasses?.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-2">
                        {s.enrolledClasses.map(c => (
                          <span key={c.id} className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700">{c.name}</span>
                        ))}
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <button onClick={() => setQrStudent(s)} className="flex-1 flex items-center justify-center py-2 rounded-lg text-primary bg-primary/10 hover:bg-primary/20 transition-all"><QrCode className="w-4 h-4" /></button>
                      <button onClick={() => setContactStudent(s)} className="flex-1 flex items-center justify-center py-2 rounded-lg text-primary bg-primary/10 hover:bg-primary/20 transition-all"><Phone className="w-4 h-4" /></button>
                      <button onClick={() => openEdit(s)} className="flex-1 flex items-center justify-center py-2 rounded-lg text-primary bg-primary/10 hover:bg-primary/20 transition-all"><Pencil className="w-4 h-4" /></button>
                      <button onClick={() => setDeleteTarget(s)} className="flex-1 flex items-center justify-center py-2 rounded-lg text-danger bg-danger/10 hover:bg-danger/20 transition-all"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between px-5 py-3 border-t border-border bg-bg/40">
              <p className="text-xs text-text-muted">Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}</p>
              <div className="flex items-center gap-1">
                <button onClick={() => setPage(1)} disabled={page === 1} className="px-2 py-1 text-xs rounded-md text-text-muted hover:bg-border/50 disabled:opacity-30 transition">«</button>
                <button onClick={() => setPage(page - 1)} disabled={page === 1} className="px-2 py-1 text-xs rounded-md text-text-muted hover:bg-border/50 disabled:opacity-30 transition">‹</button>
                {pageNums.map((item, idx) => typeof item === "string" ? <span key={`d${idx}`} className="px-1 text-xs text-text-muted">…</span> : <button key={item} onClick={() => setPage(item)} className={`min-w-[28px] py-1 text-xs rounded-md font-semibold transition ${page === item ? "text-white shadow-sm bg-primary" : "text-text-muted hover:bg-border/50"}`}>{item}</button>)}
                <button onClick={() => setPage(page + 1)} disabled={page === totalPages} className="px-2 py-1 text-xs rounded-md text-text-muted hover:bg-border/50 disabled:opacity-30 transition">›</button>
                <button onClick={() => setPage(totalPages)} disabled={page === totalPages} className="px-2 py-1 text-xs rounded-md text-text-muted hover:bg-border/50 disabled:opacity-30 transition">»</button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Create / Edit Modal */}
      <Modal open={modalOpen} onClose={() => { setModalOpen(false); setEditingStudent(null); setClassDropdownOpen(false); }} title="" className="max-w-xl p-0">
        <form onSubmit={handleSave}>
          {/* Header */}
          <div className="bg-gradient-to-r from-primary to-primary-dark px-6 py-5 rounded-t-2xl">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-white/20 flex items-center justify-center">
                {editingStudent
                  ? <span className="text-white font-bold text-lg">{editingStudent.fullName.charAt(0).toUpperCase()}</span>
                  : <UserPlus className="w-5 h-5 text-white" />}
              </div>
              <div>
                <h2 className="text-white font-semibold text-base">{editingStudent ? "Edit Student" : "New Student"}</h2>
                <p className="text-white/60 text-xs mt-0.5">{editingStudent ? editingStudent.studentCode : "Fill in the details below"}</p>
              </div>
            </div>
          </div>

          <div className={`px-6 py-5 space-y-5 max-h-[60vh] ${classDropdownOpen ? "overflow-visible" : "overflow-y-auto"}`}>
            {/* Basic Info */}
            <div>
              <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-3">Student Information</p>
              <div className="space-y-3">
                <div>
                  <label htmlFor="sname" className="block text-xs font-semibold text-text-muted mb-1.5">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted/50 pointer-events-none" />
                    <input id="sname" value={form.fullName} onChange={e => setForm({ ...form, fullName: e.target.value })} placeholder="John Doe"
                      className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-border bg-bg-card text-sm text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
                  </div>
                </div>
                <div>
                  <label htmlFor="sgrade" className="block text-xs font-semibold text-text-muted mb-1.5">Grade</label>
                  <div className="relative">
                    <GraduationCap className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted/50 pointer-events-none" />
                    <input id="sgrade" type="number" value={String(form.currentGrade)} onChange={e => setForm({ ...form, currentGrade: Number(e.target.value) })}
                      className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-border bg-bg-card text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
                  </div>
                </div>
                <div>
                  <label htmlFor="saddr" className="block text-xs font-semibold text-text-muted mb-1.5">Address <span className="text-text-muted/40">(optional)</span></label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 w-4 h-4 text-text-muted/50 pointer-events-none" />
                    <textarea id="saddr" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} placeholder="123 Main St" rows={2}
                      className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-border bg-bg-card text-sm text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none" />
                  </div>
                </div>
              </div>
            </div>

            {/* Class Assignment — Searchable Dropdown */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Assign Classes</p>
                {selectedClassIds.length > 0 && (
                  <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">{selectedClassIds.length} selected</span>
                )}
              </div>
              {/* Selected badges */}
              {selectedClassIds.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-2.5">
                  {selectedClassIds.map(id => {
                    const cls = (classes ?? []).find(c => c.id === id);
                    if (!cls) return null;
                    return (
                      <span key={id} className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg bg-primary/10 text-primary">
                        {cls.name}
                        <button type="button" onClick={() => setSelectedClassIds(selectedClassIds.filter(cid => cid !== id))} className="hover:bg-primary/20 rounded-full p-0.5 transition-colors">
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    );
                  })}
                </div>
              )}
              {/* Dropdown trigger */}
              <div className="relative">
                <button type="button" onClick={() => { setClassDropdownOpen(!classDropdownOpen); setClassSearchQuery(""); }}
                  className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                    classDropdownOpen ? "border-primary ring-2 ring-primary/20" : "border-border hover:border-primary/30"
                  } bg-bg-card`}>
                  <div className="flex items-center gap-2.5">
                    <BookOpen className="w-4 h-4 text-text-muted/50" />
                    <span className={selectedClassIds.length ? "text-text" : "text-text-muted"}>
                      {selectedClassIds.length ? `${selectedClassIds.length} class${selectedClassIds.length > 1 ? "es" : ""} assigned` : "Select classes..."}
                    </span>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-text-muted transition-transform ${classDropdownOpen ? "rotate-180" : ""}`} />
                </button>
                <AnimatePresence>
                  {classDropdownOpen && (<>
                    <div className="fixed inset-0 z-30" onClick={() => { setClassDropdownOpen(false); setClassSearchQuery(""); }} />
                    <motion.div initial={{ opacity: 0, y: -6, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -6, scale: 0.97 }} transition={{ duration: 0.15 }}
                      className="absolute left-0 right-0 top-full mt-1.5 z-40 bg-bg-card rounded-xl border border-border shadow-xl overflow-hidden">
                      <div className="p-2 border-b border-border">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                          <input value={classSearchQuery} onChange={e => setClassSearchQuery(e.target.value)} placeholder="Search classes..." autoFocus
                            className="w-full pl-9 pr-3 py-2 rounded-lg border border-border bg-bg text-sm text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/20" />
                        </div>
                      </div>
                      <div className="max-h-[180px] overflow-y-auto p-1.5">
                        {(classes ?? []).length === 0 ? (
                          <div className="flex flex-col items-center justify-center py-6 text-text-muted">
                            <BookOpen className="w-5 h-5 opacity-30 mb-1" />
                            <p className="text-xs">No classes available</p>
                          </div>
                        ) : (() => {
                          const filteredClasses = (classes ?? []).filter(c => !classSearchQuery.trim() || c.name.toLowerCase().includes(classSearchQuery.toLowerCase()));
                          return filteredClasses.length === 0 ? (
                            <p className="text-sm text-text-muted text-center py-4">No classes found</p>
                          ) : filteredClasses.map(c => {
                            const selected = selectedClassIds.includes(c.id);
                            return (
                              <button type="button" key={c.id} onClick={() => setSelectedClassIds(selected ? selectedClassIds.filter(id => id !== c.id) : [...selectedClassIds, c.id])}
                                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all ${selected ? "bg-primary/[0.07]" : "hover:bg-bg/80"}`}>
                                <div className={`w-4.5 h-4.5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                                  selected ? "bg-primary border-primary" : "border-border bg-bg-card"
                                }`} style={{ width: 18, height: 18 }}>
                                  {selected && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                                </div>
                                <span className={`text-sm font-medium flex-1 ${selected ? "text-primary" : "text-text"}`}>{c.name}</span>
                                {c.grade && <span className="text-[10px] font-semibold text-text-muted bg-bg px-2 py-0.5 rounded-md">G{c.grade}</span>}
                              </button>
                            );
                          });
                        })()}
                      </div>
                    </motion.div>
                  </>)}
                </AnimatePresence>
              </div>
            </div>

            {/* Parents — only for create */}
            {!editingStudent && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Parents / Guardians</p>
                  <button type="button" onClick={addParentRow} className="text-[11px] font-semibold text-primary hover:text-primary-dark transition flex items-center gap-1">
                    <Plus className="w-3 h-3" /> Add
                  </button>
                </div>
                <div className="space-y-3">
                  {parents.map((p, idx) => (
                    <div key={idx} className="rounded-xl border border-border bg-bg/30 p-3.5 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center">
                            <span className="text-[10px] font-bold text-primary">{idx + 1}</span>
                          </div>
                          <p className="text-xs font-semibold text-text">Parent {idx + 1}</p>
                        </div>
                        {parents.length > 1 && <button type="button" onClick={() => removeParentRow(idx)} className="text-[10px] font-semibold text-danger hover:text-danger/80 transition">Remove</button>}
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-semibold text-text-muted mb-1">Name</label>
                          <input value={p.contactName} onChange={e => updateParentRow(idx, "contactName", e.target.value)} placeholder="Jane Doe"
                            className="w-full px-3 py-2 rounded-lg border border-border bg-bg-card text-sm text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-text-muted mb-1">Phone</label>
                          <input value={p.phone} onChange={e => updateParentRow(idx, "phone", e.target.value)} placeholder="+94 77 123 4567"
                            className="w-full px-3 py-2 rounded-lg border border-border bg-bg-card text-sm text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <select value={p.relationship} onChange={e => updateParentRow(idx, "relationship", e.target.value)}
                          className="flex-1 rounded-lg border border-border bg-bg-card px-3 py-2 text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/20">
                          <option value="Parent">Parent</option><option value="Father">Father</option><option value="Mother">Mother</option><option value="Guardian">Guardian</option><option value="Other">Other</option>
                        </select>
                        <label className="flex items-center gap-1.5 cursor-pointer flex-shrink-0">
                          <input type="checkbox" checked={p.isPrimary} onChange={e => updateParentRow(idx, "isPrimary", e.target.checked)} className="rounded border-border text-primary focus:ring-primary/50" />
                          <span className="text-xs text-text-muted font-medium">Primary</span>
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border bg-bg/40">
            <Button variant="ghost" type="button" onClick={() => { setModalOpen(false); setEditingStudent(null); }}>Cancel</Button>
            <Button type="submit" loading={saving}>{editingStudent ? "Update Student" : "Add Student"}</Button>
          </div>
        </form>
      </Modal>

      {/* Contact Management Modal */}
      <Modal open={!!contactStudent} onClose={() => setContactStudent(null)} title="" className="max-w-lg p-0">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-6 py-5 rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-white/20 flex items-center justify-center">
              <Phone className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-white font-semibold text-base">Contacts</h2>
              <p className="text-white/60 text-xs mt-0.5">{contactStudent?.fullName}</p>
            </div>
          </div>
        </div>

        <div className="px-6 py-5 space-y-5 max-h-[60vh] overflow-y-auto">
          {/* Existing Contacts */}
          <div>
            <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-3">Saved Contacts</p>
            {contactStudent?.contacts?.length ? (
              <div className="space-y-2">
                {contactStudent.contacts.map((c, i) => (
                  <div key={c.id} className="flex items-center gap-3 rounded-xl border border-border bg-bg/50 px-4 py-3 group hover:border-primary/20 transition-all">
                    <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-bold text-primary">{i + 1}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-text truncate">{c.contactName}</p>
                        {c.isPrimary && <span className="text-[9px] font-bold text-white bg-primary px-1.5 py-0.5 rounded-md">PRIMARY</span>}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-text-muted">{c.phone}</span>
                        <span className="text-text-muted/30">·</span>
                        <span className="text-xs text-text-muted">{c.relationship}</span>
                      </div>
                    </div>
                    <button onClick={() => handleDeleteContact(c.id)} className="p-2 rounded-lg text-text-muted/40 hover:text-danger hover:bg-danger/10 opacity-0 group-hover:opacity-100 transition-all"><Trash2 className="w-4 h-4" /></button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 rounded-xl border border-dashed border-border">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-2">
                  <Users className="w-5 h-5 text-primary/40" />
                </div>
                <p className="text-xs font-medium text-text-muted">No contacts added yet</p>
              </div>
            )}
          </div>

          {/* Add New Contact */}
          <div>
            <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-3">Add New Contact</p>
            <div className="rounded-xl border border-border bg-bg/30 p-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-text-muted mb-1.5">Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted/50 pointer-events-none" />
                    <input value={newContact.contactName} onChange={e => setNewContact({ ...newContact, contactName: e.target.value })} placeholder="Jane Doe"
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-border bg-bg-card text-sm text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-text-muted mb-1.5">Phone</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted/50 pointer-events-none" />
                    <input value={newContact.phone} onChange={e => setNewContact({ ...newContact, phone: e.target.value })} placeholder="+94 77 123 4567"
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-border bg-bg-card text-sm text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
                  </div>
                </div>
              </div>
              <div className="flex items-end gap-3">
                <div className="flex-1">
                  <label className="block text-xs font-semibold text-text-muted mb-1.5">Relationship</label>
                  <select value={newContact.relationship} onChange={e => setNewContact({ ...newContact, relationship: e.target.value })}
                    className="w-full rounded-xl border border-border bg-bg-card px-3 py-2.5 text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary">
                    <option value="Parent">Parent</option><option value="Father">Father</option><option value="Mother">Mother</option><option value="Guardian">Guardian</option><option value="Other">Other</option>
                  </select>
                </div>
                <label className="flex items-center gap-2 cursor-pointer pb-2.5 flex-shrink-0">
                  <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
                    newContact.isPrimary ? "bg-primary border-primary" : "border-border bg-bg-card"
                  }`}>
                    {newContact.isPrimary && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                  </div>
                  <input type="checkbox" checked={newContact.isPrimary} onChange={e => setNewContact({ ...newContact, isPrimary: e.target.checked })} className="sr-only" />
                  <span className="text-xs font-medium text-text-muted">Primary</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border bg-bg/40">
          <Button variant="ghost" onClick={() => setContactStudent(null)}>Close</Button>
          <Button onClick={handleAddContact} loading={addingContact}><UserPlus className="h-4 w-4" /> Add Contact</Button>
        </div>
      </Modal>

      {/* Student ID Card Modal */}
      <Modal open={!!qrStudent} onClose={() => setQrStudent(null)} title="Student ID Card">
        {qrStudent && (
          <div className="flex flex-col items-center gap-4">
            {/* ID Card — CR80 card size ratio (85.6mm × 54mm = 1.586:1) */}
            <div ref={cardRef} style={{ width: 450, height: 284, fontFamily: "'Inter', 'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif", letterSpacing: "-0.01em" }}
              className="bg-white rounded-2xl overflow-hidden shadow-lg border border-slate-200 flex flex-col">
              {/* Card header */}
              <div style={{ background: "linear-gradient(135deg, #4F46E5, #3730A3)" }} className="px-5 py-3 flex items-center justify-between flex-shrink-0">
                <div>
                  <p className="text-white font-bold text-base leading-tight">Nexora</p>
                  <p className="text-white/70 text-[9px] uppercase tracking-widest font-semibold">Student Identity Card</p>
                </div>
                <div className="w-9 h-9 rounded-lg bg-white/20 flex items-center justify-center">
                  <span className="text-white font-black text-base">N</span>
                </div>
              </div>
              {/* Card body */}
              <div className="px-5 py-4 flex gap-4 flex-1">
                {/* Left: Info */}
                <div className="flex-1 flex flex-col min-w-0">
                  <p className="text-[9px] text-slate-400 uppercase tracking-wider font-semibold">Student Name</p>
                  <p className="text-lg font-bold text-slate-800 leading-snug">{qrStudent.fullName}</p>
                  <div className="w-full h-px bg-slate-200 my-2.5" />
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2.5">
                    <div>
                      <p className="text-[9px] text-slate-400 uppercase tracking-wider font-semibold">Student ID</p>
                      <p className="text-sm font-bold text-indigo-600 font-mono">{qrStudent.studentCode}</p>
                    </div>
                    <div>
                      <p className="text-[9px] text-slate-400 uppercase tracking-wider font-semibold">Enrolled</p>
                      <p className="text-sm font-semibold text-slate-700">{new Date(qrStudent.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</p>
                    </div>
                    <div>
                      <p className="text-[9px] text-slate-400 uppercase tracking-wider font-semibold">Teacher</p>
                      <p className="text-sm font-semibold text-slate-700">{user?.name ?? "—"}</p>
                    </div>
                    <div>
                      <p className="text-[9px] text-slate-400 uppercase tracking-wider font-semibold">Subject</p>
                      <p className="text-sm font-semibold text-slate-700">{user?.subject ?? "—"}</p>
                    </div>
                  </div>
                </div>
                {/* Right: QR */}
                <div className="flex flex-col items-center justify-center flex-shrink-0">
                  <div className="bg-white rounded-xl border-2 border-slate-100 p-1">
                    {qrDataUrl && <img src={qrDataUrl} alt="QR" style={{ width: 135, height: 135 }} />}
                  </div>
                  <p className="text-[8px] text-slate-400 mt-1 text-center">Scan for attendance</p>
                </div>
              </div>
              {/* Card footer */}
              <div className="px-5 py-2 bg-slate-50 border-t border-slate-100 flex items-center justify-between flex-shrink-0">
                <p className="text-[8px] text-slate-400">Valid throughout student&apos;s enrollment</p>
                <p className="text-[8px] text-slate-400 font-semibold">nexora.app</p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 w-full">
              <Button variant="outline" className="flex-1" onClick={downloadCard}><Download className="h-4 w-4" /> Download Card</Button>
              <Button className="flex-1" onClick={printCard}><Printer className="h-4 w-4" /> Print Card</Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Confirmation */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setDeleteTarget(null)} />
          <div className="relative z-10 bg-bg-card rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center border border-border">
            <div className="w-12 h-12 rounded-2xl bg-danger/10 flex items-center justify-center mx-auto mb-4"><Trash2 className="w-6 h-6 text-danger" /></div>
            <h3 className="text-base font-semibold text-text">Delete Student</h3>
            <p className="text-sm text-text-muted mt-1">Permanently delete <span className="font-semibold text-text">{deleteTarget.fullName}</span>? This will also remove all contacts.</p>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setDeleteTarget(null)} className="flex-1 h-10 rounded-xl border border-border text-sm font-semibold text-text hover:bg-bg transition-all">Cancel</button>
              <button onClick={handleDelete} disabled={deleting} className="flex-1 h-10 rounded-xl text-sm font-semibold text-white bg-danger hover:bg-danger/90 transition-all disabled:opacity-60">{deleting ? "Deleting..." : "Delete"}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
