"use client";
import { useState, useEffect, useMemo } from "react";
import { toast } from "sonner";
import { getAdminBilling, updateTeacherPaymentStatus } from "@/services/api";
import type { AdminBillingSummary, AdminBillingRow } from "@/lib/types";

const PAGE_SIZE = 10;

const fmt = (n: number) => `LKR ${Number(n).toFixed(2)}`;
const paymentStyle = (s: string) =>
  s === "PAID" ? "bg-emerald-500/10 text-emerald-400" :
  s === "OVERDUE" ? "bg-red-500/10 text-red-400" :
  "bg-amber-500/10 text-amber-400";
const accentColor = (s: string) =>
  s === "PAID" ? "#10b981" : s === "OVERDUE" ? "#ef4444" : "#f59e0b";
const getMonths = (rows: AdminBillingRow[]) =>
  [...new Set(rows.map(r => r.yearMonth))].sort((a, b) => b.localeCompare(a));

type SortKey = "totalCost" | "smsCost" | "messagesSent" | "yearMonth";
type SortDir = "asc" | "desc";

export default function AdminBillingPage() {
  const [data, setData] = useState<AdminBillingSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("yearMonth");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [updating, setUpdating] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const load = (month?: string) => {
    setLoading(true);
    getAdminBilling(month || undefined)
      .then(setData)
      .catch(() => toast.error("Failed to load billing data"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleMonthChange = (month: string) => {
    setSelectedMonth(month);
    setStatusFilter("");
    setSearch("");
    load(month || undefined);
  };

  const handleStatusChange = async (row: AdminBillingRow, newStatus: string) => {
    const key = `${row.teacherId}-${row.yearMonth}`;
    setUpdating(key);
    try {
      await updateTeacherPaymentStatus(row.teacherId.toString(), row.yearMonth, newStatus);
      toast.success(`Marked as ${newStatus}`);
      load(selectedMonth || undefined);
    } catch { toast.error("Failed to update payment status"); }
    finally { setUpdating(null); }
  };

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("desc"); }
  };

  const allRows = data?.rows ?? [];
  const months = getMonths(allRows);

  const filteredRows = useMemo(() => {
    let rows = [...allRows];
    if (statusFilter) rows = rows.filter(r => r.paymentStatus === statusFilter);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      rows = rows.filter(r =>
        r.teacherName.toLowerCase().includes(q) ||
        r.teacherEmail.toLowerCase().includes(q) ||
        r.monthDisplay.toLowerCase().includes(q)
      );
    }
    rows.sort((a, b) => {
      const mul = sortDir === "asc" ? 1 : -1;
      if (sortKey === "yearMonth") return mul * a.yearMonth.localeCompare(b.yearMonth);
      return mul * (Number(a[sortKey]) - Number(b[sortKey]));
    });
    return rows;
  }, [allRows, statusFilter, search, sortKey, sortDir]);

  useEffect(() => { setPage(1); }, [statusFilter, search, sortKey, sortDir, selectedMonth]);

  const totalPages = Math.ceil(filteredRows.length / PAGE_SIZE);
  const paginated = filteredRows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const pageNums = Array.from({ length: totalPages }, (_, i) => i + 1)
    .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
    .reduce<(number | string)[]>((acc, p, idx, arr) => {
      if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push("...");
      acc.push(p);
      return acc;
    }, []);

  // stat cards reflect filtered rows
  const statRows = filteredRows;
  const totalRevenue = statRows.filter(r => r.paymentStatus === "PAID").reduce((s, r) => s + Number(r.totalCost), 0);
  const pendingRevenue = statRows.filter(r => r.paymentStatus === "PENDING").reduce((s, r) => s + Number(r.totalCost), 0);
  const overdueRevenue = statRows.filter(r => r.paymentStatus === "OVERDUE").reduce((s, r) => s + Number(r.totalCost), 0);

  const stats = [
    { label: "Collected", value: fmt(totalRevenue), sub: `${statRows.filter(r => r.paymentStatus === "PAID").length} paid`, color: "from-emerald-500 to-teal-500" },
    { label: "Pending", value: fmt(pendingRevenue), sub: `${statRows.filter(r => r.paymentStatus === "PENDING").length} bills`, color: "from-amber-500 to-orange-500" },
    { label: "Overdue", value: fmt(overdueRevenue), sub: `${statRows.filter(r => r.paymentStatus === "OVERDUE").length} bills`, color: "from-red-500 to-rose-500" },
    { label: "Showing", value: filteredRows.length, sub: `of ${allRows.length} total`, color: "from-indigo-500 to-purple-500" },
  ];

  const SortIcon = ({ k }: { k: SortKey }) => (
    <span className="ml-1 inline-flex flex-col leading-none">
      <span className={`text-[8px] ${sortKey === k && sortDir === "asc" ? "text-indigo-400" : "text-slate-600"}`}>▲</span>
      <span className={`text-[8px] ${sortKey === k && sortDir === "desc" ? "text-indigo-400" : "text-slate-600"}`}>▼</span>
    </span>
  );

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white">Billing</h2>
          <p className="text-xs text-slate-500">{filteredRows.length} of {allRows.length} records</p>
        </div>
        <select
          value={selectedMonth}
          onChange={e => handleMonthChange(e.target.value)}
          className="px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-sm text-slate-300 outline-none focus:border-indigo-500 cursor-pointer"
        >
          <option value="">All Months</option>
          {months.map(m => (
            <option key={m} value={m}>{allRows.find(r => r.yearMonth === m)?.monthDisplay ?? m}</option>
          ))}
        </select>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map((s, i) => (
          <div key={i} className="bg-slate-900 rounded-2xl p-4 border border-slate-800">
            <div className="flex items-start justify-between mb-2">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{s.label}</p>
              <div className={`w-7 h-7 rounded-lg bg-gradient-to-br ${s.color} flex items-center justify-center`}>
                <span className="text-white text-xs font-bold">{i + 1}</span>
              </div>
            </div>
            <p className="text-xl font-bold text-white">{s.value}</p>
            <p className="text-[10px] text-slate-500 mt-1">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Search + Status Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
          </svg>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by teacher name, email or month..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-sm text-white placeholder:text-slate-500 outline-none focus:border-indigo-500"
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white cursor-pointer">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          )}
        </div>
        <div className="grid grid-cols-4 rounded-xl overflow-hidden border border-slate-700 text-xs font-semibold">
          {(["", "PAID", "PENDING", "OVERDUE"] as const).map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`py-2.5 cursor-pointer transition-colors text-center ${statusFilter === s ? "bg-indigo-600 text-white" : "bg-slate-800 text-slate-400 hover:text-white"}`}
            >
              {s === "" ? "All" : s === "PAID" ? "Paid" : s === "PENDING" ? "Pending" : "Overdue"}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <p className="text-slate-500 text-center py-12">Loading...</p>
      ) : !filteredRows.length ? (
        <div className="bg-slate-900 rounded-2xl border border-slate-800 p-12 text-center">
          <p className="text-slate-500">{allRows.length ? "No records match your filters." : "No billing records found."}</p>
          {(search || statusFilter) && (
            <button onClick={() => { setSearch(""); setStatusFilter(""); }} className="mt-3 text-xs text-indigo-400 hover:text-indigo-300 cursor-pointer">Clear filters</button>
          )}
        </div>
      ) : (
        <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">

          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800 text-left">
                  <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Teacher</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider cursor-pointer select-none" onClick={() => handleSort("yearMonth")}>
                    Month <SortIcon k="yearMonth" />
                  </th>
                  <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Software</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider cursor-pointer select-none" onClick={() => handleSort("smsCost")}>
                    SMS <SortIcon k="smsCost" />
                  </th>
                  <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider hidden lg:table-cell cursor-pointer select-none" onClick={() => handleSort("messagesSent")}>
                    Messages <SortIcon k="messagesSent" />
                  </th>
                  <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider cursor-pointer select-none" onClick={() => handleSort("totalCost")}>
                    Total <SortIcon k="totalCost" />
                  </th>
                  <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {paginated.map(row => {
                  const key = `${row.teacherId}-${row.yearMonth}`;
                  return (
                    <tr key={key} className="hover:bg-slate-800/50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-200">{row.teacherName}</div>
                        <div className="text-xs text-slate-500">{row.teacherEmail}</div>
                      </td>
                      <td className="px-4 py-3 text-slate-400">{row.monthDisplay}</td>
                      <td className="px-4 py-3 text-slate-400">{fmt(row.softwareCost)}</td>
                      <td className="px-4 py-3 text-slate-400">
                        <div>{fmt(row.smsCost)}</div>
                        <div className="text-xs text-slate-600">{row.smsUnits} units</div>
                      </td>
                      <td className="px-4 py-3 text-slate-400 hidden lg:table-cell">{row.messagesSent}</td>
                      <td className="px-4 py-3 font-semibold text-indigo-400">{fmt(row.totalCost)}</td>
                      <td className="px-4 py-3">
                        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${paymentStyle(row.paymentStatus)}`}>
                          {row.paymentStatus}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          {updating === key ? (
                            <svg className="animate-spin w-4 h-4 text-indigo-400" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" /></svg>
                          ) : (
                            <>
                              {row.paymentStatus !== "PAID" && <button onClick={() => handleStatusChange(row, "PAID")} className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 cursor-pointer transition-colors">Paid</button>}
                              {row.paymentStatus !== "PENDING" && <button onClick={() => handleStatusChange(row, "PENDING")} className="text-xs font-semibold text-amber-400 hover:text-amber-300 cursor-pointer transition-colors">Pending</button>}
                              {row.paymentStatus !== "OVERDUE" && <button onClick={() => handleStatusChange(row, "OVERDUE")} className="text-xs font-semibold text-red-400 hover:text-red-300 cursor-pointer transition-colors">Overdue</button>}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden divide-y divide-slate-800">
            {paginated.map(row => {
              const key = `${row.teacherId}-${row.yearMonth}`;
              return (
                <div key={key} className="p-4">
                  <div className="flex gap-3">
                    <div className="w-1 rounded-full flex-shrink-0" style={{ backgroundColor: accentColor(row.paymentStatus) }} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <p className="font-medium text-slate-200">{row.teacherName}</p>
                          <p className="text-xs text-slate-500">{row.teacherEmail}</p>
                          <p className="text-xs text-slate-500 mt-0.5">{row.monthDisplay}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-indigo-400">{fmt(row.totalCost)}</p>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${paymentStyle(row.paymentStatus)}`}>{row.paymentStatus}</span>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-2 mb-3">
                        <div className="bg-slate-800 rounded-lg p-2">
                          <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Software</p>
                          <p className="text-xs font-medium text-slate-200 mt-0.5">{fmt(row.softwareCost)}</p>
                        </div>
                        <div className="bg-slate-800 rounded-lg p-2">
                          <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">SMS</p>
                          <p className="text-xs font-medium text-slate-200 mt-0.5">{fmt(row.smsCost)}</p>
                          <p className="text-[9px] text-slate-600">{row.smsUnits} units</p>
                        </div>
                        <div className="bg-slate-800 rounded-lg p-2">
                          <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Messages</p>
                          <p className="text-xs font-medium text-slate-200 mt-0.5">{row.messagesSent}</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2 mt-1">
                        {updating === key ? (
                          <div className="col-span-2 flex justify-center py-1.5">
                            <svg className="animate-spin w-4 h-4 text-indigo-400" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" /></svg>
                          </div>
                        ) : (
                          <>
                            {row.paymentStatus !== "PAID" && <button onClick={() => handleStatusChange(row, "PAID")} className="py-1.5 rounded-lg text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 cursor-pointer transition-colors text-center">Paid</button>}
                            {row.paymentStatus !== "PENDING" && <button onClick={() => handleStatusChange(row, "PENDING")} className="py-1.5 rounded-lg text-[11px] font-semibold bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 cursor-pointer transition-colors text-center">Pending</button>}
                            {row.paymentStatus !== "OVERDUE" && <button onClick={() => handleStatusChange(row, "OVERDUE")} className="py-1.5 rounded-lg text-[11px] font-semibold bg-red-500/10 text-red-400 hover:bg-red-500/20 cursor-pointer transition-colors text-center">Overdue</button>}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-slate-800 bg-slate-900/60">
              <p className="text-xs text-slate-500">Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filteredRows.length)} of {filteredRows.length}</p>
              <div className="flex items-center gap-1">
                <button onClick={() => setPage(1)} disabled={page === 1} className="px-2 py-1 text-xs rounded-md text-slate-400 hover:bg-slate-800 disabled:opacity-30 transition cursor-pointer">«</button>
                <button onClick={() => setPage(page - 1)} disabled={page === 1} className="px-2 py-1 text-xs rounded-md text-slate-400 hover:bg-slate-800 disabled:opacity-30 transition cursor-pointer">‹</button>
                {pageNums.map((item, idx) => typeof item === "string"
                  ? <span key={`d${idx}`} className="px-1 text-xs text-slate-500">…</span>
                  : <button key={item} onClick={() => setPage(item)} className={`min-w-[28px] py-1 text-xs rounded-md font-semibold transition cursor-pointer ${page === item ? "text-white bg-indigo-600" : "text-slate-400 hover:bg-slate-800"}`}>{item}</button>
                )}
                <button onClick={() => setPage(page + 1)} disabled={page === totalPages} className="px-2 py-1 text-xs rounded-md text-slate-400 hover:bg-slate-800 disabled:opacity-30 transition cursor-pointer">›</button>
                <button onClick={() => setPage(totalPages)} disabled={page === totalPages} className="px-2 py-1 text-xs rounded-md text-slate-400 hover:bg-slate-800 disabled:opacity-30 transition cursor-pointer">»</button>
              </div>
            </div>
          )}

        </div>
      )}
    </div>
  );
}
