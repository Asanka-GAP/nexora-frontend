"use client";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Upload, X, UserCheck, ChevronDown } from "lucide-react";
import { getTeachers, adminBulkImportStudents } from "@/services/api";
import type { TeacherItem } from "@/lib/types";

type CsvRow = { fullName: string; currentGrade: number; address: string; parentName: string; parentPhone: string; parentRelationship: string };
type BulkResult = { total: number; success: number; failed: number; errors: string[] };

const inputCls = "w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm placeholder:text-slate-500 outline-none focus:border-indigo-500";

export default function AdminStudentsPage() {
  const [teachers, setTeachers] = useState<TeacherItem[]>([]);
  const [loadingTeachers, setLoadingTeachers] = useState(true);
  const [selectedTeacher, setSelectedTeacher] = useState<TeacherItem | null>(null);
  const [teacherDropdown, setTeacherDropdown] = useState(false);
  const [teacherSearch, setTeacherSearch] = useState("");

  const [csvRows, setCsvRows] = useState<CsvRow[]>([]);
  const [bulkImporting, setBulkImporting] = useState(false);
  const [bulkResult, setBulkResult] = useState<BulkResult | null>(null);

  useEffect(() => {
    getTeachers()
      .then(setTeachers)
      .catch(() => toast.error("Failed to load teachers"))
      .finally(() => setLoadingTeachers(false));
  }, []);

  const parseCSV = (text: string) => {
    const lines = text.split(/\r?\n/).filter(l => l.trim());
    if (!lines.length) { toast.error("CSV file is empty"); return; }
    const firstCols = lines[0].split(",").map(c => c.trim().replace(/^"|"$/g, "").toLowerCase());
    const hasHeaders = isNaN(Number(firstCols[1])) || firstCols[0].includes("name") || firstCols[1].includes("grade");
    const dataLines = hasHeaders ? lines.slice(1) : lines;
    const rows = dataLines.map(line => {
      const cols = line.split(",").map(c => c.trim().replace(/^"|"$/g, ""));
      return { fullName: cols[0] || "", currentGrade: parseInt(cols[1]) || 0, address: cols[2] || "", parentName: cols[3] || "", parentPhone: cols[4] || "", parentRelationship: cols[5] || "Parent" };
    }).filter(r => r.fullName);
    if (!rows.length) { toast.error("No valid rows found"); return; }
    setCsvRows(rows);
    setBulkResult(null);
  };

  const handleImport = async () => {
    if (!selectedTeacher) { toast.error("Select a teacher first"); return; }
    if (!csvRows.length) { toast.error("Upload a CSV file first"); return; }
    setBulkImporting(true);
    try {
      const result = await adminBulkImportStudents(selectedTeacher.id, { students: csvRows });
      setBulkResult(result);
      toast.success(`${result.success} of ${result.total} students imported`);
    } catch {
      toast.error("Import failed");
    } finally {
      setBulkImporting(false);
    }
  };

  const reset = () => { setCsvRows([]); setBulkResult(null); };

  const filteredTeachers = teachers.filter(t =>
    !teacherSearch.trim() || t.name.toLowerCase().includes(teacherSearch.toLowerCase()) || t.subject?.toLowerCase().includes(teacherSearch.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h2 className="text-lg font-semibold text-white">Bulk Import Students</h2>
        <p className="text-xs text-slate-500 mt-0.5">Select a teacher and upload a CSV to add students on their behalf</p>
      </div>

      {/* Teacher Selector */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800 p-5">
        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Select Teacher</p>
        <div className="relative">
          <button
            onClick={() => { setTeacherDropdown(!teacherDropdown); setTeacherSearch(""); }}
            className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-sm text-white hover:border-indigo-500 transition-colors"
          >
            {selectedTeacher ? (
              <span>{selectedTeacher.name} <span className="text-slate-400">· {selectedTeacher.subject}</span></span>
            ) : (
              <span className="text-slate-500">Choose a teacher...</span>
            )}
            <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${teacherDropdown ? "rotate-180" : ""}`} />
          </button>

          {teacherDropdown && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setTeacherDropdown(false)} />
              <div className="absolute left-0 right-0 top-full mt-1.5 z-40 bg-slate-900 border border-slate-700 rounded-xl shadow-xl overflow-hidden">
                <div className="p-2 border-b border-slate-700">
                  <input
                    value={teacherSearch}
                    onChange={e => setTeacherSearch(e.target.value)}
                    placeholder="Search teachers..."
                    autoFocus
                    className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-sm text-white placeholder:text-slate-500 outline-none focus:border-indigo-500"
                  />
                </div>
                <div className="max-h-[200px] overflow-y-auto p-1.5">
                  {loadingTeachers ? (
                    <p className="text-xs text-slate-500 text-center py-4">Loading...</p>
                  ) : filteredTeachers.length === 0 ? (
                    <p className="text-xs text-slate-500 text-center py-4">No teachers found</p>
                  ) : filteredTeachers.map(t => (
                    <button
                      key={t.id}
                      onClick={() => { setSelectedTeacher(t); setTeacherDropdown(false); reset(); }}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-left transition-colors ${selectedTeacher?.id === t.id ? "bg-indigo-500/10" : "hover:bg-slate-800"}`}
                    >
                      <div>
                        <p className="text-sm font-medium text-white">{t.name}</p>
                        <p className="text-[10px] text-slate-400">{t.subject} · {t.username}</p>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${t.status === "ACTIVE" ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"}`}>{t.status}</span>
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* CSV Upload — only shown after teacher selected */}
      {selectedTeacher && (
        <div className="bg-slate-900 rounded-2xl border border-slate-800 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Upload CSV</p>
            <span className="text-xs text-indigo-400 font-medium">For: {selectedTeacher.name}</span>
          </div>

          {/* Format hint */}
          <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-3">
            <p className="text-xs font-semibold text-slate-300 mb-2">CSV Format (columns in order):</p>
            <div className="flex flex-wrap gap-1.5">
              {["Full Name *", "Grade *", "Address", "Parent Name", "Parent Phone", "Parent Relationship"].map(col => (
                <span key={col} className={`text-[10px] font-semibold px-2 py-1 rounded-md ${col.includes("*") ? "bg-indigo-500/10 text-indigo-400" : "bg-slate-700 text-slate-400"}`}>{col}</span>
              ))}
            </div>
            <p className="text-[10px] text-slate-500 mt-2">First row can be headers. * = required.</p>
          </div>

          {!bulkResult ? (
            csvRows.length === 0 ? (
              <label
                onDragOver={e => { e.preventDefault(); e.currentTarget.classList.add("border-indigo-500"); }}
                onDragLeave={e => { e.preventDefault(); e.currentTarget.classList.remove("border-indigo-500"); }}
                onDrop={e => {
                  e.preventDefault(); e.currentTarget.classList.remove("border-indigo-500");
                  const file = e.dataTransfer.files?.[0];
                  if (!file?.name.endsWith(".csv")) { toast.error("Please drop a CSV file"); return; }
                  const reader = new FileReader();
                  reader.onload = ev => parseCSV(ev.target?.result as string);
                  reader.readAsText(file);
                }}
                className="flex flex-col items-center justify-center gap-3 py-10 rounded-2xl border-2 border-dashed border-slate-700 hover:border-indigo-500/50 transition-colors cursor-pointer"
              >
                <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center">
                  <Upload className="w-6 h-6 text-indigo-400" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-semibold text-white">Click to upload CSV</p>
                  <p className="text-xs text-slate-500 mt-0.5">or drag and drop</p>
                </div>
                <input type="file" accept=".csv" className="hidden" onChange={e => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const reader = new FileReader();
                  reader.onload = ev => parseCSV(ev.target?.result as string);
                  reader.readAsText(file);
                  e.target.value = "";
                }} />
              </label>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-white">{csvRows.length} students ready to import</p>
                  <button onClick={reset} className="text-xs font-semibold text-red-400 hover:text-red-300 flex items-center gap-1">
                    <X className="w-3 h-3" /> Clear
                  </button>
                </div>
                <div className="rounded-xl border border-slate-700 overflow-hidden">
                  <div className="overflow-x-auto max-h-[220px] overflow-y-auto">
                    <table className="w-full text-xs" style={{ minWidth: 500 }}>
                      <thead>
                        <tr className="bg-slate-800 border-b border-slate-700">
                          {["#", "Name", "Grade", "Address", "Parent", "Phone", "Rel."].map(h => (
                            <th key={h} className="px-2 py-2 text-left font-semibold text-slate-400 whitespace-nowrap">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {csvRows.map((r, i) => (
                          <tr key={i} className={`border-b border-slate-800 ${!r.fullName || !r.currentGrade ? "bg-red-500/5" : ""}`}>
                            <td className="px-2 py-1.5 text-slate-500">{i + 1}</td>
                            <td className="px-2 py-1.5 font-medium text-white whitespace-nowrap">{r.fullName || <span className="text-red-400">Missing</span>}</td>
                            <td className="px-2 py-1.5 text-slate-300">{r.currentGrade || <span className="text-red-400">—</span>}</td>
                            <td className="px-2 py-1.5 text-slate-400 max-w-[100px] truncate">{r.address || "—"}</td>
                            <td className="px-2 py-1.5 text-slate-400 whitespace-nowrap">{r.parentName || "—"}</td>
                            <td className="px-2 py-1.5 text-slate-400 whitespace-nowrap">{r.parentPhone || "—"}</td>
                            <td className="px-2 py-1.5 text-slate-400">{r.parentRelationship || "—"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
                <div className="flex justify-end">
                  <button
                    onClick={handleImport}
                    disabled={bulkImporting}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-50 cursor-pointer"
                    style={{ background: "linear-gradient(135deg, #4F46E5, #3730A3)" }}
                  >
                    {bulkImporting ? (
                      <><svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" /></svg> Importing...</>
                    ) : (
                      <><Upload className="w-4 h-4" /> Import {csvRows.length} Students</>
                    )}
                  </button>
                </div>
              </div>
            )
          ) : (
            <div className="space-y-4">
              <div className={`flex items-center gap-4 p-4 rounded-xl border ${bulkResult.failed === 0 ? "bg-emerald-500/5 border-emerald-500/20" : "bg-amber-500/5 border-amber-500/20"}`}>
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${bulkResult.failed === 0 ? "bg-emerald-500/20" : "bg-amber-500/20"}`}>
                  <UserCheck className={`w-6 h-6 ${bulkResult.failed === 0 ? "text-emerald-400" : "text-amber-400"}`} />
                </div>
                <div>
                  <p className={`text-lg font-bold ${bulkResult.failed === 0 ? "text-emerald-400" : "text-amber-400"}`}>{bulkResult.success} of {bulkResult.total} imported</p>
                  <p className="text-xs text-slate-400">{bulkResult.failed > 0 ? `${bulkResult.failed} failed` : `All students added to ${selectedTeacher.name}`}</p>
                </div>
              </div>
              {bulkResult.errors.length > 0 && (
                <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4">
                  <p className="text-xs font-semibold text-red-400 mb-2">Errors:</p>
                  <div className="space-y-1 max-h-[150px] overflow-y-auto">
                    {bulkResult.errors.map((err, i) => (
                      <p key={i} className="text-xs text-red-400">• {err}</p>
                    ))}
                  </div>
                </div>
              )}
              <div className="flex justify-end">
                <button onClick={reset} className="px-4 py-2 rounded-xl text-sm font-medium text-slate-400 bg-slate-800 hover:bg-slate-700 transition-colors cursor-pointer">
                  Import More
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
