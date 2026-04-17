"use client";
import { useState, useCallback, useEffect, useRef } from "react";
import { toast } from "sonner";
import { Plus, Trash2, Pencil, Users, UserPlus, Phone, QrCode, Download, Printer, GraduationCap, MapPin, BookOpen, User, Search, X, ChevronDown, UserCheck, UserX, Layers, CalendarCheck, Upload } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import QRCode from "qrcode";
import { toPng } from "html-to-image";
import { useAuth } from "@/lib/auth";
import { getIdCardDesign } from "@/services/api";
import { CardDesign, DEFAULT_DESIGN, CARD_W, CARD_H } from "@/components/id-card/types";
import { renderCardHtml, renderCardPrintStyles, renderCardInnerHtml, resolveContent } from "@/components/id-card/renderer";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import { useFetch } from "@/hooks/useFetch";
import { getStudents, getClasses, createStudent, updateStudent, deleteStudentApi, toggleStudentStatus, addStudentContact, deleteStudentContact, bulkImportStudents, bulkAssignClasses } from "@/services/api";
import type { Student, ClassItem } from "@/lib/types";
import PageSkeleton from "@/components/ui/PageSkeleton";
import AttendanceDrawer from "@/components/students/AttendanceDrawer";
import { invalidateCache } from "@/lib/cache";

interface ParentRow { contactName: string; phone: string; relationship: string; isPrimary: boolean; }
const emptyForm = { fullName: "", currentGrade: 1, address: "" };
const emptyParent: ParentRow = { contactName: "", phone: "", relationship: "Parent", isPrimary: true };
const PAGE_SIZE = 10;

type StatusFilter = "ALL" | "ACTIVE" | "INACTIVE";

export default function StudentsPage() {
  const { user } = useAuth();
  const cardRef = useRef<HTMLDivElement>(null);
  const previewWrapRef = useRef<HTMLDivElement>(null);
  const fetchStudents = useCallback(() => getStudents(), []);
  const { data: students, setData: setStudents, loading, refetch: _refetchStudents } = useFetch(fetchStudents, "students:all");
  const refetch = useCallback(() => { invalidateCache("students"); invalidateCache("classes"); invalidateCache("dashboard"); _refetchStudents(); }, [_refetchStudents]);
  const fetchClasses = useCallback(() => getClasses(), []);
  const { data: classes } = useFetch(fetchClasses, "classes:all");
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
  // Attendance History
  const [attendanceStudent, setAttendanceStudent] = useState<Student | null>(null);
  // Bulk ID Cards
  const [bulkCardsPrinting, setBulkCardsPrinting] = useState(false);

  // Bulk Import
  const [bulkOpen, setBulkOpen] = useState(false);
  const [csvRows, setCsvRows] = useState<{ fullName: string; currentGrade: number; address: string; parentName: string; parentPhone: string; parentRelationship: string }[]>([]);
  const [bulkImporting, setBulkImporting] = useState(false);
  const [bulkResult, setBulkResult] = useState<{ total: number; success: number; failed: number; errors: string[] } | null>(null);
  const [bulkImportClassIds, setBulkImportClassIds] = useState<string[]>([]);
  const [bulkImportClassDropdown, setBulkImportClassDropdown] = useState(false);
  const [bulkImportClassSearch, setBulkImportClassSearch] = useState("");

  // Bulk Select & Assign
  const [selectedStudentIds, setSelectedStudentIds] = useState<Set<string>>(new Set());
  const [bulkAssignOpen, setBulkAssignOpen] = useState(false);
  const [bulkAssignClassIds, setBulkAssignClassIds] = useState<string[]>([]);
  const [bulkAssigning, setBulkAssigning] = useState(false);
  const [bulkAssignClassDropdown, setBulkAssignClassDropdown] = useState(false);
  const [bulkAssignClassSearch, setBulkAssignClassSearch] = useState("");
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [qrLoading, setQrLoading] = useState(false);
  const [cardDesign, setCardDesign] = useState<CardDesign>(DEFAULT_DESIGN);

  useEffect(() => {
    if (qrStudent) {
      setQrLoading(true);
      QRCode.toDataURL(qrStudent.studentCode, { width: 200, margin: 1, color: { dark: "#111827", light: "#ffffff" } })
        .then(url => { setQrDataUrl(url); setQrLoading(false); })
        .catch(() => { setQrDataUrl(""); setQrLoading(false); });
    } else { setQrDataUrl(""); setQrLoading(false); }
  }, [qrStudent]);

  // Load saved card design
  useEffect(() => {
    getIdCardDesign().then((data) => {
      if (data.design) try { setCardDesign(JSON.parse(data.design)); } catch { /* use default */ }
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!qrStudent) return;
    const wrap = previewWrapRef.current;
    if (!wrap) return;
    const resize = () => {
      const inner = wrap.firstElementChild as HTMLElement | null;
      if (!inner) return;
      const s = Math.min(wrap.offsetWidth / 450, 1);
      inner.style.transform = `scale(${s})`;
      wrap.style.height = `${284 * s}px`;
    };
    const t = setTimeout(resize, 10);
    window.addEventListener("resize", resize);
    return () => { clearTimeout(t); window.removeEventListener("resize", resize); };
  }, [qrStudent, qrDataUrl]);

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
${cardPrintStyles()}
</head><body>
${cardHtml(qrStudent, qrDataUrl)}
</body></html>`);
    printWindow.document.close();
    printWindow.onload = () => { setTimeout(() => { printWindow.print(); printWindow.close(); }, 500); };
  };

  const cardPrintStyles = () => renderCardPrintStyles();

  const getStudentData = (s: Student) => ({
    studentName: s.fullName,
    studentCode: s.studentCode,
    enrolledDate: new Date(s.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
    teacherName: user?.name ?? "\u2014",
    subject: user?.subject ?? "\u2014",
    grade: String(s.currentGrade),
  });

  const cardHtml = (s: Student, qrUrl: string) => renderCardHtml(cardDesign, getStudentData(s), qrUrl);

  const printBulkCards = async () => {
    const activeStudents = filtered.filter(s => s.isActive);
    if (!activeStudents.length) { toast.error("No active students to print"); return; }
    setBulkCardsPrinting(true);
    try {
      const qrUrls = await Promise.all(
        activeStudents.map(s => QRCode.toDataURL(s.studentCode, { width: 200, margin: 1, color: { dark: "#111827", light: "#ffffff" } }))
      );
      const printWindow = window.open("", "_blank");
      if (!printWindow) { toast.error("Popup blocked"); return; }
      const cards = activeStudents.map((s, i) => cardHtml(s, qrUrls[i])).join("\n");
      printWindow.document.write(`<html><head><title>Bulk ID Cards - ${activeStudents.length} Students</title>${cardPrintStyles()}</head><body>${cards}</body></html>`);
      printWindow.document.close();
      printWindow.onload = () => { setTimeout(() => { printWindow.print(); printWindow.close(); }, 800); };
    } catch { toast.error("Failed to generate cards"); }
    finally { setBulkCardsPrinting(false); }
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
      if (!editingStudent) {
        setQrLoading(true);
        setQrStudent({ id: "", studentCode: "", fullName: form.fullName, currentGrade: Number(form.currentGrade), address: form.address, isActive: true, createdAt: new Date().toISOString(), contacts: [], enrolledClasses: [], attendanceCount: 0, presentCount: 0 } as Student);
        getStudents().then(freshStudents => {
          const newest = freshStudents.find(s => s.fullName === form.fullName);
          if (newest) setQrStudent(newest);
        });
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

  const toggleSelectStudent = (id: string) => setSelectedStudentIds(prev => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next; });
  const toggleSelectAll = () => setSelectedStudentIds(prev => prev.size === paginated.length ? new Set() : new Set(paginated.map(s => s.id)));
  const handleBulkAssign = async () => {
    if (!selectedStudentIds.size || !bulkAssignClassIds.length) { toast.error("Select students and classes"); return; }
    setBulkAssigning(true);
    try {
      const result = await bulkAssignClasses({ studentIds: [...selectedStudentIds], classIds: bulkAssignClassIds });
      toast.success(`${result.enrollmentsCreated} enrollments created${result.skippedDuplicates ? `, ${result.skippedDuplicates} already existed` : ""}`);
      setBulkAssignOpen(false); setBulkAssignClassIds([]); setSelectedStudentIds(new Set()); refetch();
    } catch { toast.error("Failed to assign classes"); }
    finally { setBulkAssigning(false); }
  };

  const activeCount = all.filter(s => s.isActive).length;
  const inactiveCount = all.length - activeCount;
  const totalAttendance = all.reduce((sum, s) => sum + (s.attendanceCount || 0), 0);
  const totalPresent = all.reduce((sum, s) => sum + (s.presentCount || 0), 0);
  const avgAttendance = totalAttendance > 0 ? Math.round((totalPresent / totalAttendance) * 100) : 0;
  const lowAttendanceCount = all.filter(s => { const t = s.attendanceCount || 0; const p = s.presentCount || 0; return t > 0 && Math.round((p / t) * 100) < 75; }).length;

  if (loading && !students) return <PageSkeleton />;

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div><h2 className="text-lg font-semibold text-text">All Students</h2><p className="text-xs text-text-muted mt-0.5">{all.length} students total</p></div>
        <div className="grid grid-cols-3 sm:flex sm:items-center gap-2">
          <Button variant="outline" size="sm" onClick={printBulkCards} loading={bulkCardsPrinting} className="text-xs"><Printer className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Print Cards</span><span className="sm:hidden">Cards</span></Button>
          <Button variant="outline" size="sm" onClick={() => { setBulkOpen(true); setCsvRows([]); setBulkResult(null); setBulkImportClassIds([]); setBulkImportClassDropdown(false); }} className="text-xs"><Upload className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Import CSV</span><span className="sm:hidden">Import</span></Button>
          <Button size="sm" onClick={openCreate} className="text-xs"><Plus className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Add Student</span><span className="sm:hidden">Add</span></Button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: "TOTAL", value: all.length, sub: "All students", gradient: "from-[#4F46E5] to-[#3730A3]", accentColor: "#4F46E5", icon: <Users className="w-5 h-5" /> },
          { label: "ACTIVE", value: activeCount, sub: `${all.length ? Math.round((activeCount / all.length) * 100) : 0}% of total`, gradient: "from-emerald-500 to-emerald-600", accentColor: "#10b981", icon: <UserCheck className="w-5 h-5" /> },
          { label: "ATTENDANCE", value: `${avgAttendance}%`, sub: `${totalPresent}/${totalAttendance} total present`, gradient: "from-violet-500 to-purple-600", accentColor: "#8b5cf6", icon: <CalendarCheck className="w-5 h-5" /> },
          { label: "NEED ATTENTION", value: lowAttendanceCount + inactiveCount, sub: `${inactiveCount} inactive · ${lowAttendanceCount} low attendance`, gradient: "from-amber-500 to-orange-500", accentColor: "#f59e0b", icon: <UserX className="w-5 h-5" /> },
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

      {/* Bulk Action Bar */}
      {selectedStudentIds.size > 0 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-primary/5 border border-primary/20 rounded-2xl p-3 mb-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-primary bg-primary/10 px-2.5 py-1 rounded-lg">{selectedStudentIds.size} selected</span>
            <button onClick={() => setSelectedStudentIds(new Set())} className="text-xs font-semibold text-text-muted hover:text-text">Clear</button>
          </div>
          <Button size="sm" onClick={() => { setBulkAssignOpen(true); setBulkAssignClassIds([]); setBulkAssignClassDropdown(false); setBulkAssignClassSearch(""); }} className="text-xs"><Layers className="h-3.5 w-3.5" /> Assign Classes</Button>
        </motion.div>
      )}

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
              <thead><tr className="border-b border-border"><th className="px-3 py-3.5 w-10"><input type="checkbox" checked={paginated.length > 0 && selectedStudentIds.size === paginated.length} onChange={toggleSelectAll} className="rounded border-border text-primary focus:ring-primary/20 cursor-pointer" /></th>{["Student", "Code", "Grade", "Attendance", "Classes", "Status", "Action"].map(h => (<th key={h} className="text-left px-5 py-3.5 text-xs font-semibold text-text-muted uppercase tracking-wider">{h}</th>))}</tr></thead>
              <tbody>
                {paginated.map(s => (
                  <tr key={s.id} className={`border-b border-border/50 hover:bg-bg/50 transition-colors ${selectedStudentIds.has(s.id) ? "bg-primary/[0.03]" : ""}`}>
                    <td className="px-3 py-3.5 w-10"><input type="checkbox" checked={selectedStudentIds.has(s.id)} onChange={() => toggleSelectStudent(s.id)} className="rounded border-border text-primary focus:ring-primary/20 cursor-pointer" /></td>
                    <td className="px-5 py-3.5">
                      <p className="text-sm font-medium text-text">{s.fullName}</p>
                      {s.address && <p className="text-xs text-text-muted truncate max-w-[200px]">{s.address}</p>}
                      <p className="text-[10px] text-slate-400 mt-0.5">Joined {new Date(s.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</p>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-text-muted font-mono">{s.studentCode}</td>
                    <td className="px-5 py-3.5"><span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-secondary/15 text-cyan-800">{s.currentGrade}</span></td>
                    <td className="px-5 py-3.5">
                      {(() => {
                        const total = s.attendanceCount || 0;
                        const present = s.presentCount || 0;
                        const pct = total > 0 ? Math.round((present / total) * 100) : 0;
                        const barColor = total === 0 ? "bg-slate-300" : pct >= 75 ? "bg-emerald-500" : pct >= 50 ? "bg-amber-500" : "bg-red-500";
                        const statusColor = total === 0 ? "text-slate-400" : pct >= 75 ? "text-emerald-600" : pct >= 50 ? "text-amber-600" : "text-red-600";
                        const statusLabel = total === 0 ? "No Data" : pct >= 75 ? "Good" : pct >= 50 ? "Low" : "Critical";
                        return (
                          <div className="min-w-[100px]">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs font-semibold text-slate-800">{total > 0 ? `${pct}%` : "—"}</span>
                              <span className={`text-[10px] font-semibold ${statusColor}`}>{statusLabel}</span>
                            </div>
                            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <div className={`h-full rounded-full transition-all duration-500 ${barColor}`} style={{ width: `${total > 0 ? pct : 0}%` }} />
                            </div>
                            <p className="text-[10px] text-slate-400 mt-0.5">{present}/{total} present</p>
                          </div>
                        );
                      })()}
                    </td>
                    <td className="px-5 py-3.5">
                      {s.enrolledClasses?.length ? (
                        <div className="flex flex-wrap gap-1">
                          {s.enrolledClasses.map(c => (
                            <span key={c.id} className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700">{c.name}</span>
                          ))}
                        </div>
                      ) : <span className="text-xs text-text-muted">—</span>}
                    </td>
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
                        <button onClick={() => setAttendanceStudent(s)} className="p-1.5 text-text-muted hover:text-primary transition-colors" title="Attendance History"><CalendarCheck className="w-4 h-4" /></button>
                        <button onClick={() => setQrStudent(s)} className="p-1.5 text-text-muted hover:text-primary transition-colors" title="QR Code"><QrCode className="w-4 h-4" /></button>
                        <button onClick={() => setContactStudent(s)} className="p-1.5 text-text-muted hover:text-primary transition-colors" title="Contacts"><Phone className="w-4 h-4" /></button>
                        <button onClick={() => openEdit(s)} className="p-1.5 text-text-muted hover:text-primary transition-colors" title="Edit"><Pencil className="w-4 h-4" /></button>
                        <button onClick={() => setDeleteTarget(s)} className="p-1.5 text-text-muted hover:text-danger transition-colors" title="Delete"><Trash2 className="w-4 h-4" /></button>
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
              <div key={s.id} className={`p-4 ${i % 2 === 0 ? "bg-bg-card" : "bg-bg/60"} ${i < paginated.length - 1 ? "border-b-2 border-border/80" : ""} ${selectedStudentIds.has(s.id) ? "bg-primary/[0.03]" : ""}`}>
                <div className="flex gap-3">
                  <div className="flex flex-col items-center gap-2 flex-shrink-0">
                    <input type="checkbox" checked={selectedStudentIds.has(s.id)} onChange={() => toggleSelectStudent(s.id)} className="rounded border-border text-primary focus:ring-primary/20 cursor-pointer mt-1" />
                    <div className={`w-1 flex-1 rounded-full ${s.isActive ? "bg-success" : "bg-danger"}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div><p className="font-semibold text-text text-sm truncate">{s.fullName}</p><p className="text-[10px] text-text-muted font-mono">{s.studentCode}</p><p className="text-[10px] text-slate-400">Joined {new Date(s.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</p></div>
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
                    <div className="grid grid-cols-2 gap-2 mb-2">
                      <div className="bg-white rounded-lg px-2.5 py-2 shadow-[0_1px_4px_rgba(0,0,0,0.08)] border border-slate-100"><p className="text-[9px] font-semibold text-text-muted uppercase">Grade</p><p className="text-xs font-medium text-text mt-0.5">{s.currentGrade}</p></div>
                      <div className="bg-white rounded-lg px-2.5 py-2 shadow-[0_1px_4px_rgba(0,0,0,0.08)] border border-slate-100"><p className="text-[9px] font-semibold text-text-muted uppercase">Classes</p><p className="text-xs font-medium text-text mt-0.5">{s.enrolledClasses?.length || 0}</p></div>
                    </div>
                    {/* Attendance Health Bar */}
                    {(() => {
                      const total = s.attendanceCount || 0;
                      const present = s.presentCount || 0;
                      const pct = total > 0 ? Math.round((present / total) * 100) : 0;
                      const barColor = total === 0 ? "bg-slate-300" : pct >= 75 ? "bg-emerald-500" : pct >= 50 ? "bg-amber-500" : "bg-red-500";
                      const statusColor = total === 0 ? "text-slate-400" : pct >= 75 ? "text-emerald-600" : pct >= 50 ? "text-amber-600" : "text-red-600";
                      const statusLabel = total === 0 ? "No Data" : pct >= 75 ? "Good" : pct >= 50 ? "Low" : "Critical";
                      return (
                        <div className="mb-2">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs text-text-muted"><span className="font-bold text-text">{total > 0 ? `${pct}%` : "—"}</span> attendance</span>
                            <span className={`text-[10px] font-semibold ${statusColor}`}>{statusLabel}</span>
                          </div>
                          <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full transition-all duration-500 ${barColor}`} style={{ width: `${total > 0 ? pct : 0}%` }} />
                          </div>
                          <p className="text-[10px] text-text-muted mt-0.5">{present}/{total} present</p>
                        </div>
                      );
                    })()}
                    {s.enrolledClasses?.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-2">
                        {s.enrolledClasses.map(c => (
                          <span key={c.id} className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700">{c.name}</span>
                        ))}
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <button onClick={() => setAttendanceStudent(s)} className="flex-1 flex items-center justify-center py-2 rounded-lg text-primary bg-primary/10 hover:bg-primary/20 transition-all" title="Attendance"><CalendarCheck className="w-4 h-4" /></button>
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
                    <div key={idx} className="rounded-xl border border-border bg-bg-card p-3.5 space-y-3">
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
                      <div className="space-y-3">
                        <div>
                          <label className="block text-[10px] font-bold text-text-muted uppercase tracking-wider mb-2">Relationship</label>
                          <div className="flex flex-wrap gap-1.5">
                            {["Parent", "Father", "Mother", "Guardian", "Other"].map(r => (
                              <button key={r} type="button" onClick={() => updateParentRow(idx, "relationship", r)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${p.relationship === r ? "bg-primary text-white shadow-sm" : "bg-bg text-text-muted hover:text-text hover:bg-bg-card border border-border"}`}>
                                {r}
                              </button>
                            ))}
                          </div>
                        </div>
                        <button type="button" onClick={() => updateParentRow(idx, "isPrimary", !p.isPrimary)}
                          className={`flex items-center gap-2.5 px-3 py-2 rounded-lg transition-all w-full ${p.isPrimary ? "bg-primary/10 border border-primary/30" : "bg-bg border border-border hover:border-primary/20"}`}>
                          <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all flex-shrink-0 ${p.isPrimary ? "bg-primary border-primary" : "border-border bg-bg-card"}`}>
                            {p.isPrimary && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                          </div>
                          <span className={`text-xs font-semibold ${p.isPrimary ? "text-primary" : "text-text-muted"}`}>Primary Contact</span>
                        </button>
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
                  <div key={c.id} className="flex items-center gap-3 rounded-xl border border-border bg-bg-card px-4 py-3 group hover:border-primary/20 transition-all">
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
            <div className="rounded-xl border border-border bg-bg-card p-4 space-y-3">
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
              <div className="space-y-3">
                <div>
                  <label className="block text-[10px] font-bold text-text-muted uppercase tracking-wider mb-2">Relationship</label>
                  <div className="flex flex-wrap gap-1.5">
                    {["Parent", "Father", "Mother", "Guardian", "Other"].map(r => (
                      <button key={r} type="button" onClick={() => setNewContact({ ...newContact, relationship: r })}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${newContact.relationship === r ? "bg-primary text-white shadow-sm" : "bg-bg text-text-muted hover:text-text hover:bg-bg-card border border-border"}`}>
                        {r}
                      </button>
                    ))}
                  </div>
                </div>
                <button type="button" onClick={() => setNewContact({ ...newContact, isPrimary: !newContact.isPrimary })}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-lg transition-all w-full ${newContact.isPrimary ? "bg-primary/10 border border-primary/30" : "bg-bg border border-border hover:border-primary/20"}`}>
                  <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all flex-shrink-0 ${newContact.isPrimary ? "bg-primary border-primary" : "border-border bg-bg-card"}`}>
                    {newContact.isPrimary && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                  </div>
                  <span className={`text-xs font-semibold ${newContact.isPrimary ? "text-primary" : "text-text-muted"}`}>Primary Contact</span>
                </button>
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
        {qrStudent && qrLoading && (
          <div className="flex flex-col items-center gap-4 py-8">
            <div className="w-full max-w-[450px] mx-auto rounded-2xl border border-slate-200 overflow-hidden">
              <div className="h-12 bg-gradient-to-r from-indigo-600 to-indigo-800 animate-pulse" />
              <div className="p-5 space-y-4">
                <div className="flex gap-4">
                  <div className="flex-1 space-y-3">
                    <div className="h-3 bg-slate-200 rounded w-20 animate-pulse" />
                    <div className="h-5 bg-slate-200 rounded w-40 animate-pulse" />
                    <div className="h-px bg-slate-100 my-2" />
                    <div className="grid grid-cols-2 gap-3">
                      <div className="h-8 bg-slate-100 rounded animate-pulse" />
                      <div className="h-8 bg-slate-100 rounded animate-pulse" />
                      <div className="h-8 bg-slate-100 rounded animate-pulse" />
                      <div className="h-8 bg-slate-100 rounded animate-pulse" />
                    </div>
                  </div>
                  <div className="w-[135px] h-[135px] bg-slate-100 rounded-xl animate-pulse flex-shrink-0" />
                </div>
              </div>
              <div className="h-8 bg-slate-50 border-t border-slate-100" />
            </div>
            <p className="text-xs text-slate-400 animate-pulse">Generating ID card...</p>
          </div>
        )}
        {qrStudent && !qrLoading && (
          <div className="flex flex-col items-center gap-4">
            {/* Hidden full-size card for download */}
            <div className="fixed -left-[9999px] -top-[9999px]">
              <div ref={cardRef} style={{ width: CARD_W, height: CARD_H, fontFamily: "'Inter', sans-serif", position: 'relative', background: cardDesign.bgColor, overflow: 'hidden' }}
                className="id-card-preview"
                dangerouslySetInnerHTML={{ __html: renderCardInnerHtml(cardDesign, getStudentData(qrStudent), qrDataUrl) }} />
            </div>
            {/* Visible preview */}
            <div ref={previewWrapRef} className="w-full overflow-hidden">
              <div style={{ width: CARD_W, height: CARD_H, fontFamily: "'Inter', sans-serif", transformOrigin: 'top left', position: 'relative', background: cardDesign.bgColor, overflow: 'hidden' }}
                className="id-card-preview rounded-2xl shadow-lg border border-slate-200">
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: `${cardDesign.headerHeight}%`, background: cardDesign.headerBg }} />
                {cardDesign.elements.map(el => {
                  const content = resolveContent(el.content, getStudentData(qrStudent));
                  const base: React.CSSProperties = { position: 'absolute', left: `${el.x}%`, top: `${el.y}%`, width: `${el.w}%`, height: `${el.h}%` };
                  if (el.type === 'qr') return <div key={el.id} style={{ ...base, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div style={{ width: '100%', height: '100%', background: '#fff', border: '2px solid #f1f5f9', borderRadius: 10, padding: 3, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{qrDataUrl && <img src={qrDataUrl} alt="QR" style={{ width: '100%', height: '100%' }} />}</div></div>;
                  if (el.type === 'shape') return <div key={el.id} style={{ ...base, background: el.bgColor, borderRadius: el.borderRadius, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', padding: '0 4px' }}><span style={{ fontSize: el.fontSize, fontWeight: el.fontWeight, color: el.color, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%', display: 'block', textAlign: 'center' }}>{content}</span></div>;
                  return <div key={el.id} style={{ ...base, fontSize: el.fontSize, fontWeight: el.fontWeight, color: el.color, textAlign: el.textAlign || 'left', lineHeight: 1.3, display: 'flex', alignItems: 'center', overflow: 'hidden' }}><span style={{ width: '100%', textAlign: el.textAlign || 'left', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{content}</span></div>;
                })}
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

      {/* Attendance History Drawer */}
      <AttendanceDrawer student={attendanceStudent} onClose={() => setAttendanceStudent(null)} />

      {/* Bulk Import Modal */}
      <Modal open={bulkOpen} onClose={() => setBulkOpen(false)} title="" className="max-w-2xl p-0 !mx-2 sm:!mx-auto">
        <div className="bg-gradient-to-r from-emerald-600 to-teal-700 px-4 sm:px-6 py-5 rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-white/20 flex items-center justify-center"><Upload className="w-5 h-5 text-white" /></div>
            <div>
              <h2 className="text-white font-semibold text-base">Bulk Import Students</h2>
              <p className="text-white/60 text-xs mt-0.5">Upload a CSV file to add multiple students at once</p>
            </div>
          </div>
        </div>

        <div className="px-3 sm:px-6 py-4 sm:py-5 space-y-4 max-h-[60vh] overflow-y-auto">
          {!bulkResult ? (
            <>
              {/* CSV Format Info */}
              <div className="rounded-xl border border-border bg-bg p-4">
                <p className="text-xs font-semibold text-text mb-2">CSV Format (columns in order):</p>
                <div className="flex flex-wrap gap-1.5">
                  {["Full Name *", "Grade *", "Address", "Parent Name", "Parent Phone", "Parent Relationship"].map(col => (
                    <span key={col} className={`text-[10px] font-semibold px-2 py-1 rounded-md ${col.includes("*") ? "bg-primary/10 text-primary" : "bg-slate-100 text-slate-600"}`}>{col}</span>
                  ))}
                </div>
                <p className="text-[10px] text-text-muted mt-2">First row should be headers. * = required fields.</p>
                <div className="mt-3 rounded-lg border border-border overflow-x-auto">
                  <table className="w-full text-[10px]" style={{ minWidth: 420 }}>
                    <thead><tr className="bg-bg">
                      {["Full Name", "Grade", "Address", "Parent Name", "Parent Phone", "Relationship"].map(h => (
                        <th key={h} className="px-2 py-1.5 text-left font-semibold text-text-muted">{h}</th>
                      ))}
                    </tr></thead>
                    <tbody className="text-text-muted">
                      <tr className="border-t border-border/50"><td className="px-2 py-1">Kasun Perera</td><td className="px-2 py-1">6</td><td className="px-2 py-1">123 Main St</td><td className="px-2 py-1">Nimal Perera</td><td className="px-2 py-1">+94771234567</td><td className="px-2 py-1">Father</td></tr>
                      <tr className="border-t border-border/50"><td className="px-2 py-1">Amaya Silva</td><td className="px-2 py-1">7</td><td className="px-2 py-1"></td><td className="px-2 py-1">Kumari Silva</td><td className="px-2 py-1">+94779876543</td><td className="px-2 py-1">Mother</td></tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* File Upload */}
              {csvRows.length === 0 ? (
                <label
                  onDragOver={e => { e.preventDefault(); e.stopPropagation(); e.currentTarget.classList.add("border-primary", "bg-primary/5"); }}
                  onDragLeave={e => { e.preventDefault(); e.stopPropagation(); e.currentTarget.classList.remove("border-primary", "bg-primary/5"); }}
                  onDrop={e => {
                    e.preventDefault(); e.stopPropagation();
                    e.currentTarget.classList.remove("border-primary", "bg-primary/5");
                    const file = e.dataTransfer.files?.[0];
                    if (!file || !file.name.endsWith(".csv")) { toast.error("Please drop a CSV file"); return; }
                    const reader = new FileReader();
                    reader.onload = (ev) => {
                      const text = ev.target?.result as string;
                      const lines = text.split(/\r?\n/).filter(l => l.trim());
                      if (lines.length < 1) { toast.error("CSV file is empty"); return; }
                      const firstCols = lines[0].split(",").map(c => c.trim().replace(/^"|"$/g, "").toLowerCase());
                      const hasHeaders = isNaN(Number(firstCols[1])) || firstCols[0].includes("name") || firstCols[1].includes("grade");
                      const dataLines = hasHeaders ? lines.slice(1) : lines;
                      const rows = dataLines.map(line => {
                        const cols = line.split(",").map(c => c.trim().replace(/^"|"$/g, ""));
                        return { fullName: cols[0] || "", currentGrade: parseInt(cols[1]) || 0, address: cols[2] || "", parentName: cols[3] || "", parentPhone: cols[4] || "", parentRelationship: cols[5] || "Parent" };
                      }).filter(r => r.fullName);
                      if (!rows.length) { toast.error("No valid rows found"); return; }
                      setCsvRows(rows);
                    };
                    reader.readAsText(file);
                  }}
                  className="flex flex-col items-center justify-center gap-3 py-10 rounded-2xl border-2 border-dashed border-border hover:border-primary/40 hover:bg-primary/[0.02] transition-all cursor-pointer">
                  <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center"><Upload className="w-7 h-7 text-primary/60" /></div>
                  <div className="text-center">
                    <p className="text-sm font-semibold text-text">Click to upload CSV</p>
                    <p className="text-xs text-text-muted mt-0.5">or drag and drop</p>
                  </div>
                  <input type="file" accept=".csv" className="hidden" onChange={e => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onload = (ev) => {
                      const text = ev.target?.result as string;
                      const lines = text.split(/\r?\n/).filter(l => l.trim());
                      if (lines.length < 1) { toast.error("CSV file is empty"); return; }
                      // Check if first row looks like headers (contains non-numeric text in grade column)
                      const firstCols = lines[0].split(",").map(c => c.trim().replace(/^"|"$/g, "").toLowerCase());
                      const hasHeaders = isNaN(Number(firstCols[1])) || firstCols[0].includes("name") || firstCols[1].includes("grade");
                      const dataLines = hasHeaders ? lines.slice(1) : lines;
                      const rows = dataLines.map(line => {
                        const cols = line.split(",").map(c => c.trim().replace(/^"|"$/g, ""));
                        return {
                          fullName: cols[0] || "",
                          currentGrade: parseInt(cols[1]) || 0,
                          address: cols[2] || "",
                          parentName: cols[3] || "",
                          parentPhone: cols[4] || "",
                          parentRelationship: cols[5] || "Parent",
                        };
                      }).filter(r => r.fullName);
                      if (!rows.length) { toast.error("No valid rows found"); return; }
                      setCsvRows(rows);
                    };
                    reader.readAsText(file);
                    e.target.value = "";
                  }} />
                </label>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-text">{csvRows.length} students ready to import</p>
                    <button onClick={() => setCsvRows([])} className="text-xs font-semibold text-danger hover:underline">Clear</button>
                  </div>
                  <div className="rounded-xl border border-border overflow-hidden -mx-1 sm:mx-0">
                    <div className="overflow-x-auto max-h-[200px] overflow-y-auto">
                      <table className="w-full text-xs" style={{ minWidth: 500 }}>
                        <thead><tr className="bg-bg border-b border-border">
                          {["#", "Name", "Grade", "Address", "Parent", "Phone", "Rel."].map(h => (
                            <th key={h} className="px-2 py-2 text-left font-semibold text-text-muted whitespace-nowrap">{h}</th>
                          ))}
                        </tr></thead>
                        <tbody>
                          {csvRows.map((r, i) => (
                            <tr key={i} className={`border-b border-border/50 ${!r.fullName || !r.currentGrade ? "bg-red-50" : ""}`}>
                              <td className="px-2 py-1.5 text-text-muted">{i + 1}</td>
                              <td className="px-2 py-1.5 font-medium text-text whitespace-nowrap">{r.fullName || <span className="text-danger">Missing</span>}</td>
                              <td className="px-2 py-1.5">{r.currentGrade || <span className="text-danger">—</span>}</td>
                              <td className="px-2 py-1.5 text-text-muted max-w-[100px] truncate">{r.address || "—"}</td>
                              <td className="px-2 py-1.5 text-text-muted whitespace-nowrap">{r.parentName || "—"}</td>
                              <td className="px-2 py-1.5 text-text-muted whitespace-nowrap">{r.parentPhone || "—"}</td>
                              <td className="px-2 py-1.5 text-text-muted">{r.parentRelationship || "—"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              )}
            </>
          ) : (
            /* Import Result */
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-4 rounded-xl bg-emerald-50 border border-emerald-200">
                <div className="w-12 h-12 rounded-xl bg-emerald-500 flex items-center justify-center flex-shrink-0">
                  <UserCheck className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-lg font-bold text-emerald-800">{bulkResult.success} of {bulkResult.total} imported</p>
                  <p className="text-xs text-emerald-600">{bulkResult.failed > 0 ? `${bulkResult.failed} failed` : "All students imported successfully"}</p>
                </div>
              </div>
              {bulkResult.errors.length > 0 && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-4">
                  <p className="text-xs font-semibold text-red-700 mb-2">Errors:</p>
                  <div className="space-y-1 max-h-[150px] overflow-y-auto">
                    {bulkResult.errors.map((err, i) => (
                      <p key={i} className="text-xs text-red-600">• {err}</p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Assign classes to all imported students */}
        {!bulkResult && csvRows.length > 0 && (
          <div className="px-3 sm:px-6 pb-4">
            <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-2">Assign Classes to All Imported Students <span className="text-text-muted/40">(optional)</span></p>
            {bulkImportClassIds.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-2">
                {bulkImportClassIds.map(id => { const cls = (classes ?? []).find(c => c.id === id); if (!cls) return null; return (
                  <span key={id} className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg bg-primary/10 text-primary">{cls.name}<button type="button" onClick={() => setBulkImportClassIds(bulkImportClassIds.filter(cid => cid !== id))} className="hover:bg-primary/20 rounded-full p-0.5"><X className="w-3 h-3" /></button></span>
                ); })}
              </div>
            )}
            <div className="relative">
              <button type="button" onClick={() => { setBulkImportClassDropdown(!bulkImportClassDropdown); setBulkImportClassSearch(""); }}
                className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl border text-sm font-medium transition-all ${bulkImportClassDropdown ? "border-primary ring-2 ring-primary/20" : "border-border hover:border-primary/30"} bg-bg-card`}>
                <div className="flex items-center gap-2.5"><BookOpen className="w-4 h-4 text-text-muted/50" /><span className={bulkImportClassIds.length ? "text-text" : "text-text-muted"}>{bulkImportClassIds.length ? `${bulkImportClassIds.length} class${bulkImportClassIds.length > 1 ? "es" : ""}` : "Select classes..."}</span></div>
                <ChevronDown className={`w-4 h-4 text-text-muted transition-transform ${bulkImportClassDropdown ? "rotate-180" : ""}`} />
              </button>
              <AnimatePresence>
                {bulkImportClassDropdown && (<>
                  <div className="fixed inset-0 z-30" onClick={() => setBulkImportClassDropdown(false)} />
                  <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} className="absolute left-0 right-0 bottom-full mb-1.5 z-40 bg-bg-card rounded-xl border border-border shadow-xl overflow-hidden">
                    <div className="p-2 border-b border-border"><div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" /><input value={bulkImportClassSearch} onChange={e => setBulkImportClassSearch(e.target.value)} placeholder="Search classes..." autoFocus className="w-full pl-9 pr-3 py-2 rounded-lg border border-border bg-bg text-sm text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/20" /></div></div>
                    <div className="max-h-[180px] overflow-y-auto p-1.5">
                      {(classes ?? []).filter(c => !bulkImportClassSearch.trim() || c.name.toLowerCase().includes(bulkImportClassSearch.toLowerCase())).map(c => {
                        const selected = bulkImportClassIds.includes(c.id);
                        return (<button type="button" key={c.id} onClick={() => setBulkImportClassIds(selected ? bulkImportClassIds.filter(id => id !== c.id) : [...bulkImportClassIds, c.id])}
                          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all ${selected ? "bg-primary/[0.07]" : "hover:bg-bg/80"}`}>
                          <div className={`w-4.5 h-4.5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all ${selected ? "bg-primary border-primary" : "border-border bg-bg-card"}`} style={{ width: 18, height: 18 }}>
                            {selected && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                          </div>
                          <span className={`text-sm font-medium flex-1 ${selected ? "text-primary" : "text-text"}`}>{c.name}</span>
                          {c.grade && <span className="text-[10px] font-semibold text-text-muted bg-bg px-2 py-0.5 rounded-md">G{c.grade}</span>}
                        </button>);
                      })}
                    </div>
                  </motion.div>
                </>)}
              </AnimatePresence>
            </div>
          </div>
        )}

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border bg-bg/40">
          <Button variant="ghost" onClick={() => setBulkOpen(false)}>{bulkResult ? "Close" : "Cancel"}</Button>
          {!bulkResult && csvRows.length > 0 && (
            <Button loading={bulkImporting} onClick={async () => {
              setBulkImporting(true);
              try {
                const result = await bulkImportStudents({ students: csvRows.map(r => ({ ...r, classIds: bulkImportClassIds.length ? bulkImportClassIds : undefined })) });
                setBulkResult(result);
                refetch();
              } catch { toast.error("Import failed"); }
              finally { setBulkImporting(false); }
            }}><Upload className="h-4 w-4" /> Import {csvRows.length} Students</Button>
          )}
        </div>
      </Modal>

      {/* Bulk Assign Classes Modal */}
      <Modal open={bulkAssignOpen} onClose={() => { setBulkAssignOpen(false); setBulkAssignClassDropdown(false); }} title="" className="max-w-md p-0">
        <div className="bg-gradient-to-r from-indigo-600 to-violet-700 px-6 py-5 rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-white/20 flex items-center justify-center"><Layers className="w-5 h-5 text-white" /></div>
            <div>
              <h2 className="text-white font-semibold text-base">Bulk Assign Classes</h2>
              <p className="text-white/60 text-xs mt-0.5">{selectedStudentIds.size} student{selectedStudentIds.size > 1 ? "s" : ""} selected</p>
            </div>
          </div>
        </div>
        <div className={`px-6 py-5 ${bulkAssignClassDropdown ? "overflow-visible" : ""}`}>
          <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-3">Select Classes to Assign</p>
          {bulkAssignClassIds.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-2.5">
              {bulkAssignClassIds.map(id => { const cls = (classes ?? []).find(c => c.id === id); if (!cls) return null; return (
                <span key={id} className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg bg-primary/10 text-primary">{cls.name}<button type="button" onClick={() => setBulkAssignClassIds(bulkAssignClassIds.filter(cid => cid !== id))} className="hover:bg-primary/20 rounded-full p-0.5"><X className="w-3 h-3" /></button></span>
              ); })}
            </div>
          )}
          <div className="relative">
            <button type="button" onClick={() => { setBulkAssignClassDropdown(!bulkAssignClassDropdown); setBulkAssignClassSearch(""); }}
              className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl border text-sm font-medium transition-all ${bulkAssignClassDropdown ? "border-primary ring-2 ring-primary/20" : "border-border hover:border-primary/30"} bg-bg-card`}>
              <div className="flex items-center gap-2.5"><BookOpen className="w-4 h-4 text-text-muted/50" /><span className={bulkAssignClassIds.length ? "text-text" : "text-text-muted"}>{bulkAssignClassIds.length ? `${bulkAssignClassIds.length} class${bulkAssignClassIds.length > 1 ? "es" : ""}` : "Select classes..."}</span></div>
              <ChevronDown className={`w-4 h-4 text-text-muted transition-transform ${bulkAssignClassDropdown ? "rotate-180" : ""}`} />
            </button>
            <AnimatePresence>
              {bulkAssignClassDropdown && (<>
                <div className="fixed inset-0 z-30" onClick={() => setBulkAssignClassDropdown(false)} />
                <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} className="absolute left-0 right-0 top-full mt-1.5 z-40 bg-bg-card rounded-xl border border-border shadow-xl overflow-hidden">
                  <div className="p-2 border-b border-border"><div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" /><input value={bulkAssignClassSearch} onChange={e => setBulkAssignClassSearch(e.target.value)} placeholder="Search classes..." autoFocus className="w-full pl-9 pr-3 py-2 rounded-lg border border-border bg-bg text-sm text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/20" /></div></div>
                  <div className="max-h-[180px] overflow-y-auto p-1.5">
                    {(classes ?? []).filter(c => !bulkAssignClassSearch.trim() || c.name.toLowerCase().includes(bulkAssignClassSearch.toLowerCase())).map(c => {
                      const selected = bulkAssignClassIds.includes(c.id);
                      return (<button type="button" key={c.id} onClick={() => setBulkAssignClassIds(selected ? bulkAssignClassIds.filter(id => id !== c.id) : [...bulkAssignClassIds, c.id])}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all ${selected ? "bg-primary/[0.07]" : "hover:bg-bg/80"}`}>
                        <div className={`w-4.5 h-4.5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all ${selected ? "bg-primary border-primary" : "border-border bg-bg-card"}`} style={{ width: 18, height: 18 }}>
                          {selected && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                        </div>
                        <span className={`text-sm font-medium flex-1 ${selected ? "text-primary" : "text-text"}`}>{c.name}</span>
                        {c.grade && <span className="text-[10px] font-semibold text-text-muted bg-bg px-2 py-0.5 rounded-md">G{c.grade}</span>}
                      </button>);
                    })}
                  </div>
                </motion.div>
              </>)}
            </AnimatePresence>
          </div>
        </div>
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border bg-bg/40">
          <Button variant="ghost" onClick={() => setBulkAssignOpen(false)}>Cancel</Button>
          <Button loading={bulkAssigning} onClick={handleBulkAssign} disabled={!bulkAssignClassIds.length}><Layers className="h-4 w-4" /> Assign to {selectedStudentIds.size} Students</Button>
        </div>
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
