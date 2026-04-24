"use client";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { ChevronDown, Plus, BookOpen, Users, X, Search } from "lucide-react";
import { getTeachers, adminGetTeacherClasses, adminCreateTeacherClass, adminGetTeacherStudents, adminBulkAssignClasses } from "@/services/api";
import type { TeacherItem, ClassItem, Student } from "@/lib/types";

const inputCls = "w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm placeholder:text-slate-500 outline-none focus:border-indigo-500";

function TeacherDropdown({ teachers, loading, selected, onSelect }: {
  teachers: TeacherItem[]; loading: boolean;
  selected: TeacherItem | null; onSelect: (t: TeacherItem) => void;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const filtered = teachers.filter(t => !search.trim() || t.name.toLowerCase().includes(search.toLowerCase()) || t.subject?.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="relative">
      <button onClick={() => { setOpen(!open); setSearch(""); }}
        className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-sm text-white hover:border-indigo-500 transition-colors">
        {selected ? <span>{selected.name} <span className="text-slate-400">· {selected.subject}</span></span>
          : <span className="text-slate-500">Choose a teacher...</span>}
        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (<>
        <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
        <div className="absolute left-0 right-0 top-full mt-1.5 z-40 bg-slate-900 border border-slate-700 rounded-xl shadow-xl overflow-hidden">
          <div className="p-2 border-b border-slate-700">
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search teachers..." autoFocus
              className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-sm text-white placeholder:text-slate-500 outline-none focus:border-indigo-500" />
          </div>
          <div className="max-h-[200px] overflow-y-auto p-1.5">
            {loading ? <p className="text-xs text-slate-500 text-center py-4">Loading...</p>
              : filtered.length === 0 ? <p className="text-xs text-slate-500 text-center py-4">No teachers found</p>
              : filtered.map(t => (
                <button key={t.id} onClick={() => { onSelect(t); setOpen(false); }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-left transition-colors ${selected?.id === t.id ? "bg-indigo-500/10" : "hover:bg-slate-800"}`}>
                  <div>
                    <p className="text-sm font-medium text-white">{t.name}</p>
                    <p className="text-[10px] text-slate-400">{t.subject} · {t.username}</p>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${t.status === "ACTIVE" ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"}`}>{t.status}</span>
                </button>
              ))}
          </div>
        </div>
      </>)}
    </div>
  );
}

export default function AdminClassesPage() {
  const [teachers, setTeachers] = useState<TeacherItem[]>([]);
  const [loadingTeachers, setLoadingTeachers] = useState(true);
  const [selectedTeacher, setSelectedTeacher] = useState<TeacherItem | null>(null);

  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [loadingClasses, setLoadingClasses] = useState(false);

  const [students, setStudents] = useState<Student[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);

  // Create class modal
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({ name: "", grade: "1", location: "" });
  const [saving, setSaving] = useState(false);

  // Assign classes modal
  const [assignOpen, setAssignOpen] = useState(false);
  const [selectedStudentIds, setSelectedStudentIds] = useState<Set<string>>(new Set());
  const [selectedClassIds, setSelectedClassIds] = useState<string[]>([]);
  const [assigning, setAssigning] = useState(false);
  const [classSearch, setClassSearch] = useState("");
  const [studentSearch, setStudentSearch] = useState("");
  const [classDropdownOpen, setClassDropdownOpen] = useState(false);

  useEffect(() => {
    getTeachers().then(setTeachers).catch(() => toast.error("Failed to load teachers")).finally(() => setLoadingTeachers(false));
  }, []);

  const loadTeacherData = async (teacher: TeacherItem) => {
    setSelectedTeacher(teacher);
    setClasses([]); setStudents([]);
    setLoadingClasses(true); setLoadingStudents(true);
    try {
      const [cls, stu] = await Promise.all([adminGetTeacherClasses(teacher.id), adminGetTeacherStudents(teacher.id)]);
      setClasses(cls); setStudents(stu);
    } catch { toast.error("Failed to load teacher data"); }
    finally { setLoadingClasses(false); setLoadingStudents(false); }
  };

  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTeacher || !form.name) { toast.error("Class name is required"); return; }
    setSaving(true);
    try {
      const created = await adminCreateTeacherClass(selectedTeacher.id, { name: form.name, grade: Number(form.grade), location: form.location || undefined });
      setClasses(prev => [created, ...prev]);
      toast.success("Class created");
      setCreateOpen(false); setForm({ name: "", grade: "1", location: "" });
    } catch { toast.error("Failed to create class"); }
    finally { setSaving(false); }
  };

  const handleAssign = async () => {
    if (!selectedTeacher || !selectedStudentIds.size || !selectedClassIds.length) {
      toast.error("Select at least one student and one class"); return;
    }
    setAssigning(true);
    try {
      const result = await adminBulkAssignClasses(selectedTeacher.id, { studentIds: [...selectedStudentIds], classIds: selectedClassIds });
      toast.success(`${result.enrollmentsCreated} enrollments created${result.skippedDuplicates ? `, ${result.skippedDuplicates} already existed` : ""}`);
      setAssignOpen(false); setSelectedStudentIds(new Set()); setSelectedClassIds([]);
      // Refresh
      const [cls, stu] = await Promise.all([adminGetTeacherClasses(selectedTeacher.id), adminGetTeacherStudents(selectedTeacher.id)]);
      setClasses(cls); setStudents(stu);
    } catch { toast.error("Failed to assign classes"); }
    finally { setAssigning(false); }
  };

  const toggleStudent = (id: string) => setSelectedStudentIds(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const filteredStudents = students.filter(s => !studentSearch.trim() || s.fullName.toLowerCase().includes(studentSearch.toLowerCase()));
  const filteredClasses = classes.filter(c => !classSearch.trim() || c.name.toLowerCase().includes(classSearch.toLowerCase()));

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="text-lg font-semibold text-white">Classes Management</h2>
        <p className="text-xs text-slate-500 mt-0.5">Select a teacher to manage their classes and assign students</p>
      </div>

      {/* Teacher Selector */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800 p-5">
        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Select Teacher</p>
        <TeacherDropdown teachers={teachers} loading={loadingTeachers} selected={selectedTeacher} onSelect={loadTeacherData} />
      </div>

      {selectedTeacher && (
        <>
          {/* Classes Section */}
          <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-white">Classes</h3>
                <p className="text-[10px] text-slate-500 mt-0.5">{loadingClasses ? "Loading..." : `${classes.length} classes for ${selectedTeacher.name}`}</p>
              </div>
              <button onClick={() => setCreateOpen(true)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-white cursor-pointer"
                style={{ background: "linear-gradient(135deg, #4F46E5, #3730A3)" }}>
                <Plus className="w-3.5 h-3.5" /> Add Class
              </button>
            </div>

            {loadingClasses ? (
              <div className="p-8 text-center text-slate-500 text-sm">Loading classes...</div>
            ) : classes.length === 0 ? (
              <div className="p-8 text-center">
                <BookOpen className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                <p className="text-sm text-slate-500">No classes yet. Add the first class.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-800">
                {classes.map(cls => (
                  <div key={cls.id} className="flex items-center justify-between px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center flex-shrink-0">
                        <BookOpen className="w-4 h-4 text-indigo-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">{cls.name}</p>
                        <p className="text-[10px] text-slate-400">Grade {cls.grade}{cls.location ? ` · ${cls.location}` : ""}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1.5 text-slate-400">
                        <Users className="w-3.5 h-3.5" />
                        <span className="text-xs font-medium">{cls.studentCount}</span>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400">G{cls.grade}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Assign Classes to Students */}
          <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-white">Assign Classes to Students</h3>
                <p className="text-[10px] text-slate-500 mt-0.5">{loadingStudents ? "Loading..." : `${students.length} students`}</p>
              </div>
              {classes.length > 0 && students.length > 0 && (
                <button onClick={() => { setAssignOpen(true); setSelectedStudentIds(new Set()); setSelectedClassIds([]); setClassSearch(""); setStudentSearch(""); }}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-white cursor-pointer"
                  style={{ background: "linear-gradient(135deg, #059669, #047857)" }}>
                  <Users className="w-3.5 h-3.5" /> Assign Classes
                </button>
              )}
            </div>

            {loadingStudents ? (
              <div className="p-8 text-center text-slate-500 text-sm">Loading students...</div>
            ) : students.length === 0 ? (
              <div className="p-8 text-center">
                <Users className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                <p className="text-sm text-slate-500">No students for this teacher yet.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-800 max-h-[300px] overflow-y-auto">
                {students.map(s => (
                  <div key={s.id} className="flex items-center justify-between px-5 py-3">
                    <div>
                      <p className="text-sm font-medium text-white">{s.fullName}</p>
                      <p className="text-[10px] text-slate-400">{s.studentCode} · Grade {s.currentGrade}</p>
                    </div>
                    <div className="flex flex-wrap gap-1 justify-end max-w-[200px]">
                      {s.enrolledClasses?.length ? s.enrolledClasses.map(c => (
                        <span key={c.id} className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-400">{c.name}</span>
                      )) : <span className="text-[10px] text-slate-500">No classes</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* Create Class Modal */}
      {createOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setCreateOpen(false)} />
          <div className="relative z-10 w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
            <h2 className="text-base font-semibold text-white mb-1">Add Class</h2>
            <p className="text-xs text-slate-400 mb-4">For: {selectedTeacher?.name}</p>
            <form onSubmit={handleCreateClass} className="space-y-4">
              <div>
                <label className="text-xs font-medium text-slate-400 block mb-1">Class Name <span className="text-red-400">*</span></label>
                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Math 101" required className={inputCls} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-400 block mb-1">Grade <span className="text-red-400">*</span></label>
                  <input type="number" min="1" value={form.grade} onChange={e => setForm(f => ({ ...f, grade: e.target.value }))} className={inputCls} />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-400 block mb-1">Location <span className="text-slate-600">(optional)</span></label>
                  <input value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} placeholder="Room 201" className={inputCls} />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setCreateOpen(false)} className="px-4 py-2 rounded-xl text-sm font-medium text-slate-400 hover:bg-slate-800 transition-colors cursor-pointer">Cancel</button>
                <button type="submit" disabled={saving} className="px-4 py-2 rounded-xl text-sm font-semibold text-white disabled:opacity-50 cursor-pointer" style={{ background: "linear-gradient(135deg, #4F46E5, #3730A3)" }}>
                  {saving ? "Creating..." : "Create Class"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assign Classes Modal */}
      {assignOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => !assigning && setAssignOpen(false)} />
          <div className="relative z-10 w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold text-white">Assign Classes to Students</h2>
                <p className="text-xs text-slate-400 mt-0.5">{selectedTeacher?.name}</p>
              </div>
              <button onClick={() => setAssignOpen(false)} className="text-slate-400 hover:text-white transition-colors cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-5 max-h-[70vh] overflow-y-auto">
              {/* Select Classes */}
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">
                  Select Classes <span className="text-indigo-400">({selectedClassIds.length} selected)</span>
                </p>
                {selectedClassIds.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {selectedClassIds.map(id => { const c = classes.find(x => x.id === id); if (!c) return null; return (
                      <span key={id} className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-lg bg-indigo-500/10 text-indigo-400">
                        {c.name}
                        <button onClick={() => setSelectedClassIds(prev => prev.filter(x => x !== id))} className="hover:text-white cursor-pointer"><X className="w-3 h-3" /></button>
                      </span>
                    ); })}
                  </div>
                )}
                <div className="relative mb-2">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                  <input value={classSearch} onChange={e => setClassSearch(e.target.value)} placeholder="Search classes..."
                    className="w-full pl-8 pr-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-sm text-white placeholder:text-slate-500 outline-none focus:border-indigo-500" />
                </div>
                <div className="space-y-1 max-h-[220px] overflow-y-auto">
                  {filteredClasses.map(c => {
                    const sel = selectedClassIds.includes(c.id);
                    return (
                      <button key={c.id} onClick={() => setSelectedClassIds(sel ? selectedClassIds.filter(x => x !== c.id) : [...selectedClassIds, c.id])}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors cursor-pointer ${sel ? "bg-indigo-500/10 border border-indigo-500/30" : "bg-slate-800 border border-transparent hover:border-slate-700"}`}>
                        <div className={`w-4 h-4 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all ${sel ? "bg-indigo-500 border-indigo-500" : "border-slate-600"}`}>
                          {sel && <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                        </div>
                        <span className="text-sm text-white flex-1">{c.name}</span>
                        <span className="text-[10px] text-slate-400">G{c.grade}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Select Students */}
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">
                  Select Students <span className="text-emerald-400">({selectedStudentIds.size} selected)</span>
                </p>
                <div className="flex items-center gap-2 mb-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                    <input value={studentSearch} onChange={e => setStudentSearch(e.target.value)} placeholder="Search students..."
                      className="w-full pl-8 pr-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-sm text-white placeholder:text-slate-500 outline-none focus:border-indigo-500" />
                  </div>
                  <button onClick={() => setSelectedStudentIds(selectedStudentIds.size === filteredStudents.length ? new Set() : new Set(filteredStudents.map(s => s.id)))}
                    className="text-[10px] font-semibold text-indigo-400 hover:text-indigo-300 whitespace-nowrap cursor-pointer">
                    {selectedStudentIds.size === filteredStudents.length ? "None" : "All"}
                  </button>
                </div>
                <div className="space-y-1 max-h-[220px] overflow-y-auto">
                  {filteredStudents.map(s => {
                    const sel = selectedStudentIds.has(s.id);
                    return (
                      <button key={s.id} onClick={() => toggleStudent(s.id)}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors cursor-pointer ${sel ? "bg-emerald-500/10 border border-emerald-500/30" : "bg-slate-800 border border-transparent hover:border-slate-700"}`}>
                        <div className={`w-4 h-4 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all ${sel ? "bg-emerald-500 border-emerald-500" : "border-slate-600"}`}>
                          {sel && <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-white truncate">{s.fullName}</p>
                          <p className="text-[10px] text-slate-400">G{s.currentGrade} · {s.enrolledClasses?.length || 0} classes</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-slate-800 flex items-center justify-between">
              <p className="text-xs text-slate-400">
                {selectedStudentIds.size} student{selectedStudentIds.size !== 1 ? "s" : ""} · {selectedClassIds.length} class{selectedClassIds.length !== 1 ? "es" : ""}
              </p>
              <div className="flex gap-3">
                <button onClick={() => setAssignOpen(false)} disabled={assigning} className="px-4 py-2 rounded-xl text-sm font-medium text-slate-400 bg-slate-800 hover:bg-slate-700 transition-colors cursor-pointer disabled:opacity-50">Cancel</button>
                <button onClick={handleAssign} disabled={assigning || !selectedStudentIds.size || !selectedClassIds.length}
                  className="px-4 py-2 rounded-xl text-sm font-semibold text-white disabled:opacity-50 cursor-pointer"
                  style={{ background: "linear-gradient(135deg, #059669, #047857)" }}>
                  {assigning ? "Assigning..." : "Assign Classes"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
