'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Button from '@/components/ui/Button';
import { Badge } from '@/components/ui/badge';
import { 
  CreditCard, 
  MessageSquare, 
  Calculator, 
  TrendingUp,
  Calendar,
  Download,
  Info,
  DollarSign,
  Smartphone,
  ChevronDown,
  FileText,
  Loader2
} from 'lucide-react';
import { CurrentMonthUsage, BillingHistory } from '@/lib/types';
import { getCurrentMonthUsage, getBillingHistory, exportBillingReport } from '@/services/api';
import PageSkeleton from '@/components/ui/PageSkeleton';

export default function BillingPage() {
  const [currentMonth, setCurrentMonth] = useState<CurrentMonthUsage | null>(null);
  const [billingHistory, setBillingHistory] = useState<BillingHistory | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [exportOpen, setExportOpen] = useState(false);
  const [exportYear, setExportYear] = useState(new Date().getFullYear());
  const [exportMonth, setExportMonth] = useState(new Date().getMonth() + 1);
  const [exporting, setExporting] = useState(false);
  const [yearOpen, setYearOpen] = useState(false);
  const [monthOpen, setMonthOpen] = useState(false);
  const PAGE_SIZE = 5;

  useEffect(() => {
    fetchBillingData();
  }, []);

  const fetchBillingData = async () => {
    try {
      setLoading(true);
      const [currentResponse, historyResponse] = await Promise.all([
        getCurrentMonthUsage(),
        getBillingHistory()
      ]);
      
      setCurrentMonth(currentResponse);
      setBillingHistory(historyResponse);
    } catch (error) {
      console.error('Failed to fetch billing data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return `LKR ${amount.toFixed(2)}`;
  };

  const getUsageColor = (units: number) => {
    if (units === 0) return 'bg-gray-100 text-gray-600';
    if (units < 50) return 'bg-emerald-100 text-emerald-700';
    if (units < 150) return 'bg-amber-100 text-amber-700';
    return 'bg-red-100 text-red-700';
  };

  // Pagination logic for billing history
  const bills = billingHistory?.monthlyBills || [];
  const totalPages = Math.ceil(bills.length / PAGE_SIZE);
  const paginatedBills = bills.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  
  const pageNums = Array.from({ length: totalPages }, (_, i) => i + 1)
    .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
    .reduce<(number | string)[]>((acc, p, idx, arr) => { 
      if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push("..."); 
      acc.push(p); 
      return acc; 
    }, []);

  const handleExport = async (month?: string) => {
    setExporting(true);
    try {
      await exportBillingReport(month);
    } catch {
      console.error('Failed to export report');
    } finally {
      setExporting(false);
      setExportOpen(false);
    }
  };

  const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

  if (loading && !currentMonth) return <PageSkeleton />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-text">Monthly Billing</h2>
          <p className="text-xs text-text-muted mt-0.5">Track your SMS usage and monthly subscription costs</p>
        </div>
        <div className="relative">
          <button onClick={() => setExportOpen(!exportOpen)}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white shadow-lg hover:shadow-xl transition-all active:scale-[0.97]"
            style={{ background: 'linear-gradient(135deg, #4F46E5, #3730A3)', boxShadow: '0 4px 14px rgba(79,70,229,0.3)' }}>
            {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            Export Report
            <ChevronDown className={`h-3.5 w-3.5 transition-transform ${exportOpen ? 'rotate-180' : ''}`} />
          </button>
          <AnimatePresence>
            {exportOpen && (<>
              <div className="fixed inset-0 z-30" onClick={() => setExportOpen(false)} />
              <motion.div initial={{ opacity: 0, y: -6, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -6, scale: 0.97 }} transition={{ duration: 0.15 }}
                className="absolute right-0 top-full mt-2 z-40 bg-bg-card rounded-2xl border border-border shadow-xl w-[280px] overflow-visible">
                <div className="p-4 border-b border-border">
                  <p className="text-xs font-bold text-text-muted uppercase tracking-widest mb-3">Quick Export</p>
                  <button onClick={() => handleExport()} disabled={exporting}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-primary/5 border border-primary/20 hover:bg-primary/10 transition">
                    <FileText className="w-4 h-4 text-primary" />
                    <div className="text-left">
                      <p className="text-sm font-semibold text-text">Current Month</p>
                      <p className="text-[10px] text-text-muted">{new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p>
                    </div>
                  </button>
                </div>
                <div className="p-4">
                  <p className="text-xs font-bold text-text-muted uppercase tracking-widest mb-3">Custom Month</p>
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    {/* Year dropdown */}
                    <div>
                      <label className="text-[10px] font-semibold text-text-muted mb-1 block">Year</label>
                      <div className="relative">
                        <button onClick={(e) => { e.stopPropagation(); setYearOpen(!yearOpen); setMonthOpen(false); }}
                          className={`w-full flex items-center justify-between px-3 py-2 rounded-xl border text-sm font-medium transition-all ${yearOpen ? 'border-primary ring-2 ring-primary/20' : 'border-border hover:border-primary/30'} bg-bg-card`}>
                          <span className="text-text">{exportYear}</span>
                          <ChevronDown className={`w-3.5 h-3.5 text-text-muted transition-transform ${yearOpen ? 'rotate-180' : ''}`} />
                        </button>
                        <AnimatePresence>
                          {yearOpen && (
                            <motion.div initial={{ opacity: 0, y: -4, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -4, scale: 0.97 }} transition={{ duration: 0.12 }}
                              className="absolute left-0 right-0 top-full mt-1 z-50 bg-bg-card rounded-xl border border-border shadow-xl max-h-[160px] overflow-y-auto p-1">
                              {years.map(y => (
                                <button key={y} onClick={(e) => { e.stopPropagation(); setExportYear(y); setYearOpen(false); }}
                                  className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-all ${exportYear === y ? 'text-white bg-primary shadow-sm' : 'text-text hover:bg-bg'}`}>
                                  {y}
                                </button>
                              ))}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                    {/* Month dropdown */}
                    <div>
                      <label className="text-[10px] font-semibold text-text-muted mb-1 block">Month</label>
                      <div className="relative">
                        <button onClick={(e) => { e.stopPropagation(); setMonthOpen(!monthOpen); setYearOpen(false); }}
                          className={`w-full flex items-center justify-between px-3 py-2 rounded-xl border text-sm font-medium transition-all ${monthOpen ? 'border-primary ring-2 ring-primary/20' : 'border-border hover:border-primary/30'} bg-bg-card`}>
                          <span className="text-text truncate">{MONTHS[exportMonth - 1]?.slice(0, 3)}</span>
                          <ChevronDown className={`w-3.5 h-3.5 text-text-muted transition-transform ${monthOpen ? 'rotate-180' : ''}`} />
                        </button>
                        <AnimatePresence>
                          {monthOpen && (
                            <motion.div initial={{ opacity: 0, y: -4, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -4, scale: 0.97 }} transition={{ duration: 0.12 }}
                              className="absolute left-0 right-0 top-full mt-1 z-50 bg-bg-card rounded-xl border border-border shadow-xl max-h-[200px] overflow-y-auto p-1">
                              {MONTHS.map((m, i) => (
                                <button key={i} onClick={(e) => { e.stopPropagation(); setExportMonth(i + 1); setMonthOpen(false); }}
                                  className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-all ${exportMonth === i + 1 ? 'text-white bg-primary shadow-sm' : 'text-text hover:bg-bg'}`}>
                                  {m}
                                </button>
                              ))}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                  </div>
                  <button onClick={() => handleExport(`${exportYear}-${String(exportMonth).padStart(2, '0')}`)} disabled={exporting}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition disabled:opacity-50"
                    style={{ background: 'linear-gradient(135deg, #4F46E5, #3730A3)' }}>
                    {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                    Download PDF
                  </button>
                </div>
              </motion.div>
            </>)}
          </AnimatePresence>
        </div>
      </div>

      {/* Current Month Overview - Stat Cards */}
      {currentMonth && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Total Cost - Credit Card Style */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="relative sm:col-span-2 lg:col-span-1 rounded-2xl p-6 overflow-hidden shadow-xl" style={{ background: "linear-gradient(135deg, #4F46E5 0%, #3730A3 50%, #1E1B4B 100%)" }}>
            {/* Card decorations */}
            <div className="absolute top-0 right-0 w-40 h-40 rounded-full bg-white/5 -translate-y-16 translate-x-16" />
            <div className="absolute bottom-0 left-0 w-32 h-32 rounded-full bg-white/5 translate-y-12 -translate-x-12" />
            <div className="absolute top-4 right-5 flex gap-1">
              <div className="w-6 h-6 rounded-full bg-white/20" />
              <div className="w-6 h-6 rounded-full bg-white/10 -ml-3" />
            </div>
            <div className="relative">
              <p className="text-[10px] font-bold text-white/50 uppercase tracking-widest">Total Monthly Cost</p>
              <p className="text-3xl font-bold text-white mt-2 tracking-tight">{formatCurrency(currentMonth.totalCurrentCost)}</p>
              <div className="flex items-center justify-between mt-6">
                <div>
                  <p className="text-[9px] text-white/40 uppercase tracking-wider">Billing Period</p>
                  <p className="text-xs font-semibold text-white/80 mt-0.5">{currentMonth.monthDisplay}</p>
                </div>
                <div className="text-right">
                  <p className="text-[9px] text-white/40 uppercase tracking-wider">Status</p>
                  <p className="text-xs font-semibold text-emerald-300 mt-0.5">Active</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Other stat cards */}
          {[
            { 
              label: "SMS UNITS", 
              value: currentMonth.currentUnits, 
              sub: `${currentMonth.messagesSent} messages sent`, 
              gradient: "from-emerald-500 to-emerald-600", 
              accentColor: "#10b981", 
              icon: <MessageSquare className="w-5 h-5" />, 
              trend: currentMonth.currentUnits > 0 ? `${currentMonth.currentUnits} units` : "No usage", 
              up: currentMonth.currentUnits > 0 ? true : null 
            },
            { 
              label: "SMS COST", 
              value: formatCurrency(currentMonth.currentSmsCost), 
              sub: "@ LKR 1.30/unit", 
              gradient: "from-violet-500 to-purple-600", 
              accentColor: "#8b5cf6", 
              icon: <Smartphone className="w-5 h-5" />, 
              trend: currentMonth.currentUnits > 0 ? `${currentMonth.currentUnits} × 1.30` : "LKR 0.00", 
              up: currentMonth.currentUnits > 0 ? true : null 
            },
            { 
              label: "SOFTWARE", 
              value: formatCurrency(currentMonth.softwareCost), 
              sub: "Monthly subscription", 
              gradient: "from-amber-500 to-orange-500", 
              accentColor: "#f59e0b", 
              icon: <DollarSign className="w-5 h-5" />, 
              trend: "Fixed cost", 
              up: null 
            },
          ].map((card, i) => (
            <motion.div key={card.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: (i + 1) * 0.08 }}
              className="relative bg-bg-card rounded-2xl p-5 shadow-[0_2px_12px_rgba(0,0,0,0.06)] border border-border hover:shadow-[0_4px_20px_rgba(0,0,0,0.1)] transition-all duration-200 overflow-hidden group">
              {/* Decorative background sparkline */}
              <svg className="absolute bottom-0 right-0 w-28 h-16 opacity-[0.06] group-hover:opacity-[0.10] transition-opacity" viewBox="0 0 120 60" fill="none">
                <path d="M0 55 Q20 45 30 35 T60 20 T90 30 T120 10" stroke={card.accentColor} strokeWidth="3" fill="none" />
                <path d="M0 55 Q20 45 30 35 T60 20 T90 30 T120 10 V60 H0 Z" fill={card.accentColor} opacity="0.3" />
              </svg>
              <div className="relative">
                <div className="flex items-start justify-between mb-3">
                  <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">{card.label}</p>
                  <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${card.gradient} flex items-center justify-center text-white shadow-md`}>
                    {card.icon}
                  </div>
                </div>
                <p className="text-2xl font-bold text-text leading-tight">{card.value}</p>
                <div className="flex items-center justify-between mt-2">
                  <p className="text-[11px] text-text-muted">{card.sub}</p>
                  {card.trend && (
                    <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded-md ${
                      card.up === true ? "bg-emerald-50" : card.up === false ? "bg-red-50" : "bg-slate-50"
                    }`}>
                      {card.up === true && (
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3 h-3 text-emerald-500">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
                        </svg>
                      )}
                      {card.up === false && (
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3 h-3 text-red-500">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6L9 12.75l4.286-4.286a11.948 11.948 0 014.306 6.43l.776 2.898m0 0l3.182-5.511m-3.182 5.51l-5.511-3.181" />
                        </svg>
                      )}
                      {card.up === null && (
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3 h-3 text-slate-400">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12h15" />
                        </svg>
                      )}
                      <span className={`text-[10px] font-semibold ${
                        card.up === true ? "text-emerald-600" : card.up === false ? "text-red-500" : "text-text-muted"
                      }`}>{card.trend}</span>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Cost Breakdown */}
      {currentMonth && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          className="rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.06)] border border-border overflow-hidden bg-bg-card">
          <div className="bg-gradient-to-r from-slate-800 to-slate-900 dark:from-indigo-600 dark:to-violet-600 px-6 py-4 flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-white flex items-center gap-2">
                <Info className="h-5 w-5" />
                Cost Breakdown
              </h2>
              <p className="text-xs text-slate-300 dark:text-indigo-100 mt-0.5">{currentMonth.monthDisplay}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-300 dark:text-indigo-100">Total Monthly</p>
              <p className="text-lg font-bold text-white">{formatCurrency(currentMonth.totalCurrentCost)}</p>
            </div>
          </div>
          
          <div className="p-6 space-y-4">
            <div className="flex justify-between items-center py-3 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-md">
                  <DollarSign className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="font-semibold text-text">Software Maintenance</div>
                  <div className="text-sm text-text-muted">Monthly subscription fee</div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-bold text-text">{formatCurrency(currentMonth.softwareCost)}</div>
                <div className="text-xs text-text-muted">Fixed cost</div>
              </div>
            </div>
            
            <div className="flex justify-between items-center py-3 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-md">
                  <MessageSquare className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="font-semibold text-text">SMS Notifications</div>
                  <div className="text-sm text-text-muted">
                    {currentMonth.currentUnits} units × LKR 1.30 ({currentMonth.messagesSent} messages)
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-bold text-text">{formatCurrency(currentMonth.currentSmsCost)}</div>
                <div className="text-xs text-text-muted">Variable cost</div>
              </div>
            </div>
            
            <div className="bg-white dark:bg-gradient-to-r dark:from-indigo-900/20 dark:to-violet-900/20 rounded-xl p-4 border border-slate-200 dark:border-indigo-800/30 shadow-sm">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-md">
                    <Calculator className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <div className="font-bold text-lg text-text">Total Monthly Cost</div>
                    <div className="text-sm text-text-muted">Software + SMS combined</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-2xl text-text">
                    {formatCurrency(currentMonth.totalCurrentCost)}
                  </div>
                  <div className="text-xs text-text-muted">Due monthly</div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Billing History */}
      {billingHistory && bills.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
          className="rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.06)] border border-border overflow-hidden bg-bg-card">
          <div className="bg-gradient-to-r from-slate-700 to-slate-800 dark:from-emerald-600 dark:to-teal-600 px-6 py-4 flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-white flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Billing History
              </h2>
              <p className="text-xs text-slate-300 dark:text-emerald-100 mt-0.5">Previous months usage and costs</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-300 dark:text-emerald-100">Total Records</p>
              <p className="text-lg font-bold text-white">{bills.length}</p>
            </div>
          </div>
          
          {/* Desktop Table */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full">
              <thead className="bg-bg border-b border-border">
                <tr>
                  <th className="text-left py-4 px-6 text-xs font-bold text-text-muted uppercase tracking-wider">Month</th>
                  <th className="text-right py-4 px-6 text-xs font-bold text-text-muted uppercase tracking-wider">Messages</th>
                  <th className="text-right py-4 px-6 text-xs font-bold text-text-muted uppercase tracking-wider">SMS Units</th>
                  <th className="text-right py-4 px-6 text-xs font-bold text-text-muted uppercase tracking-wider">SMS Cost</th>
                  <th className="text-right py-4 px-6 text-xs font-bold text-text-muted uppercase tracking-wider">Software</th>
                  <th className="text-right py-4 px-6 text-xs font-bold text-text-muted uppercase tracking-wider">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {paginatedBills.map((bill, index) => (
                  <motion.tr 
                    key={bill.month} 
                    initial={{ opacity: 0, x: -20 }} 
                    animate={{ opacity: 1, x: 0 }} 
                    transition={{ delay: 0.7 + index * 0.05 }}
                    className="hover:bg-bg/50 transition-colors duration-150"
                  >
                    <td className="py-4 px-6">
                      <div>
                        <div className="font-semibold text-text">{bill.monthDisplay}</div>
                        <div className="text-xs text-text-muted">{bill.month}</div>
                      </div>
                    </td>
                    <td className="text-right py-4 px-6">
                      <Badge className={getUsageColor(bill.messagesSent)}>
                        {bill.messagesSent}
                      </Badge>
                    </td>
                    <td className="text-right py-4 px-6">
                      <div className="font-semibold text-text">{bill.smsUnits}</div>
                      <div className="text-xs text-text-muted">units</div>
                    </td>
                    <td className="text-right py-4 px-6">
                      <div className="font-semibold text-text">{formatCurrency(bill.smsCost)}</div>
                    </td>
                    <td className="text-right py-4 px-6">
                      <div className="font-semibold text-text">{formatCurrency(bill.softwareCost)}</div>
                    </td>
                    <td className="text-right py-4 px-6">
                      <div className="font-bold text-lg text-indigo-600 dark:text-indigo-400">{formatCurrency(bill.totalCost)}</div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="lg:hidden">
            {paginatedBills.map((bill, i) => (
              <motion.div 
                key={bill.month}
                initial={{ opacity: 0, x: -20 }} 
                animate={{ opacity: 1, x: 0 }} 
                transition={{ delay: 0.7 + i * 0.05 }}
                className={`p-4 ${i % 2 === 0 ? "bg-bg-card" : "bg-bg/60"} ${i < paginatedBills.length - 1 ? "border-b-2 border-border/80" : ""}`}
              >
                <div className="flex gap-3">
                  <div className="w-1 rounded-full flex-shrink-0 bg-gradient-to-b from-emerald-500 to-teal-500" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div>
                        <p className="font-semibold text-text text-sm">{bill.monthDisplay}</p>
                        <p className="text-[10px] text-text-muted font-mono">{bill.month}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-lg text-indigo-600 dark:text-indigo-400">{formatCurrency(bill.totalCost)}</p>
                        <p className="text-[10px] text-text-muted">Total</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 mb-2">
                      <div className="bg-bg-card rounded-lg px-2.5 py-2 border border-border">
                        <p className="text-[9px] font-semibold text-text-muted uppercase">Messages</p>
                        <div className="mt-0.5">
                          <Badge className={`${getUsageColor(bill.messagesSent)} text-xs`}>
                            {bill.messagesSent}
                          </Badge>
                        </div>
                      </div>
                      <div className="bg-bg-card rounded-lg px-2.5 py-2 border border-border">
                        <p className="text-[9px] font-semibold text-text-muted uppercase">SMS Units</p>
                        <p className="text-xs font-medium text-text mt-0.5">{bill.smsUnits}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-bg-card rounded-lg px-2.5 py-2 border border-border">
                        <p className="text-[9px] font-semibold text-text-muted uppercase">SMS Cost</p>
                        <p className="text-xs font-medium text-text mt-0.5">{formatCurrency(bill.smsCost)}</p>
                      </div>
                      <div className="bg-bg-card rounded-lg px-2.5 py-2 border border-border">
                        <p className="text-[9px] font-semibold text-text-muted uppercase">Software</p>
                        <p className="text-xs font-medium text-text mt-0.5">{formatCurrency(bill.softwareCost)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-border bg-bg/40">
              <p className="text-xs text-text-muted">Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, bills.length)} of {bills.length}</p>
              <div className="flex items-center gap-1">
                <button onClick={() => setPage(1)} disabled={page === 1} className="px-2 py-1 text-xs rounded-md text-text-muted hover:bg-border/50 disabled:opacity-30 transition">«</button>
                <button onClick={() => setPage(page - 1)} disabled={page === 1} className="px-2 py-1 text-xs rounded-md text-text-muted hover:bg-border/50 disabled:opacity-30 transition">‹</button>
                {pageNums.map((item, idx) => typeof item === "string" ? 
                  <span key={`d${idx}`} className="px-1 text-xs text-text-muted">…</span> : 
                  <button key={item} onClick={() => setPage(item)} className={`min-w-[28px] py-1 text-xs rounded-md font-semibold transition ${page === item ? "text-white shadow-sm bg-emerald-600" : "text-text-muted hover:bg-border/50"}`}>{item}</button>
                )}
                <button onClick={() => setPage(page + 1)} disabled={page === totalPages} className="px-2 py-1 text-xs rounded-md text-text-muted hover:bg-border/50 disabled:opacity-30 transition">›</button>
                <button onClick={() => setPage(totalPages)} disabled={page === totalPages} className="px-2 py-1 text-xs rounded-md text-text-muted hover:bg-border/50 disabled:opacity-30 transition">»</button>
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* SMS Usage Guide */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }}
        className="rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.06)] border border-border overflow-hidden bg-bg-card">
        <div className="bg-gradient-to-r from-slate-600 to-slate-700 dark:from-amber-600 dark:to-orange-600 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-white flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              SMS Pricing Guide
            </h2>
            <p className="text-xs text-slate-300 dark:text-amber-100 mt-0.5">Understanding SMS unit calculations</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-300 dark:text-amber-100">Rate per Unit</p>
            <p className="text-lg font-bold text-white">LKR 1.30</p>
          </div>
        </div>
        
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h4 className="font-bold text-text mb-4 flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                  <Calculator className="w-3 h-3 text-white" />
                </div>
                How SMS Units Work
              </h4>
              <div className="space-y-3">
                {[
                  { range: "1-160 characters", units: "1 unit", color: "from-emerald-500 to-emerald-600" },
                  { range: "161-320 characters", units: "2 units", color: "from-amber-500 to-orange-500" },
                  { range: "321-480 characters", units: "3 units", color: "from-red-500 to-rose-500" },
                ].map((item, i) => (
                  <div key={i} className="flex justify-between items-center p-3 rounded-xl bg-bg border border-border">
                    <span className="text-sm font-medium text-text">{item.range}</span>
                    <div className={`px-3 py-1 rounded-lg bg-gradient-to-r ${item.color} text-white text-xs font-bold shadow-sm`}>
                      {item.units}
                    </div>
                  </div>
                ))}
                <div className="mt-4 p-3 bg-bg-card border border-border rounded-xl">
                  <div className="flex items-start gap-2">
                    <Info className="w-4 h-4 text-text mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs font-semibold text-text mb-1">Important Note</p>
                      <p className="text-xs text-text-muted">
                        Newline characters (line breaks) count as <strong className="text-text">2 characters</strong> each in SMS billing.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="font-bold text-text mb-4 flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                  <DollarSign className="w-3 h-3 text-white" />
                </div>
                Cost Examples
              </h4>
              <div className="space-y-3">
                {[
                  { desc: "Short message (45 chars)", cost: "LKR 1.30", example: "John marked PRESENT at 2:30 PM" },
                  { desc: "Long message (180 chars)", cost: "LKR 2.60", example: "John marked PRESENT with additional details..." },
                  { desc: "Very long message (350 chars)", cost: "LKR 3.90", example: "Detailed attendance notification with extra info..." },
                ].map((item, i) => (
                  <div key={i} className="p-3 rounded-xl bg-bg border border-border">
                    <div className="flex justify-between items-start mb-1">
                      <span className="text-sm font-medium text-text">{item.desc}</span>
                      <span className="font-bold text-indigo-600 dark:text-indigo-400">{item.cost}</span>
                    </div>
                    <p className="text-xs text-text-muted italic truncate">"{item.example}"</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          <div className="mt-8 p-4 bg-gradient-to-r from-indigo-50 to-violet-50 dark:from-indigo-900/20 dark:to-violet-900/20 rounded-xl border border-indigo-100 dark:border-indigo-800/30">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center flex-shrink-0">
                <Info className="w-4 h-4 text-white" />
              </div>
              <div>
                <h5 className="font-semibold text-text mb-1">Pro Tips for SMS Cost Optimization</h5>
                <ul className="text-sm text-text-muted space-y-1">
                  <li>• Keep attendance messages concise to minimize SMS costs</li>
                  <li>• Avoid line breaks - each newline counts as <strong>2 characters</strong></li>
                  <li>• A typical "[Student] marked PRESENT at [Time]" message uses only 1 unit (LKR 1.30)</li>
                  <li>• Messages over 160 characters will cost 2+ units</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}