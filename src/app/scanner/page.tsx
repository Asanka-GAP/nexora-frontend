"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, Camera, CameraOff, CheckCircle2, ChevronDown, XCircle, Clock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Button from "@/components/ui/Button";
import { markAttendance, getClasses } from "@/services/api";
import type { ClassItem } from "@/lib/types";

const DUPLICATE_COOLDOWN = 4000;
interface ScanRecord { name: string; code: string; time: string; success: boolean; message?: string; }

function playBeep() { try { const c = new AudioContext(), o = c.createOscillator(), g = c.createGain(); o.connect(g); g.connect(c.destination); o.frequency.value = 1200; g.gain.value = 0.3; o.start(); o.stop(c.currentTime + 0.15); } catch {} }
function playError() { try { const c = new AudioContext(), o = c.createOscillator(), g = c.createGain(); o.connect(g); g.connect(c.destination); o.frequency.value = 400; g.gain.value = 0.3; o.start(); o.stop(c.currentTime + 0.3); } catch {} }

export default function ScannerPage() {
  const router = useRouter();
  const scannerRef = useRef<HTMLDivElement>(null);
  const html5QrRef = useRef<unknown>(null);
  const lastScanRef = useRef<{ code: string; time: number }>({ code: "", time: 0 });

  const mountedRef = useRef(true);
  const scannerBusyRef = useRef(false);

  const [scanning, setScanning] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [selectedClass, setSelectedClass] = useState("");
  const selectedClassRef = useRef("");
  const updateSelectedClass = (id: string) => { setSelectedClass(id); selectedClassRef.current = id; };
  const [classSearch, setClassSearch] = useState("");
  const [classOpen, setClassOpen] = useState(false);
  const [recentScans, setRecentScans] = useState<ScanRecord[]>([]);

  const filteredClasses = classes.filter(c => {
    if (!classSearch.trim()) return true;
    const q = classSearch.toLowerCase();
    return c.name.toLowerCase().includes(q) || (c.subject?.toLowerCase().includes(q));
  });

  useEffect(() => { getClasses().then(c => { setClasses(c); if (c.length) { setSelectedClass(c[0].id); selectedClassRef.current = c[0].id; } }).catch(() => {}); }, []);

  const onScanSuccess = useCallback(async (decodedText: string) => {
    const now = Date.now();
    if (lastScanRef.current.code === decodedText && now - lastScanRef.current.time < DUPLICATE_COOLDOWN) return;
    lastScanRef.current = { code: decodedText, time: now };
    if (!selectedClassRef.current) { toast.error("Select a class first"); return; }
    const time = new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    try {
      const res = await markAttendance({ studentCode: decodedText, classId: selectedClassRef.current });
      playBeep();
      setRecentScans(prev => [{ name: res.studentName, code: decodedText, time, success: true }, ...prev].slice(0, 8));
      toast.success(`Marked: ${res.studentName}`);
    } catch (err: unknown) {
      const msg = err && typeof err === "object" && "response" in err ? ((err as { response?: { data?: { message?: string } } }).response?.data?.message ?? "Scan failed") : "Scan failed";
      playError();
      setRecentScans(prev => [{ name: "", code: decodedText, time, success: false, message: msg }, ...prev].slice(0, 8));
      toast.error(msg);
    }
  }, []);

  const startScanner = useCallback(async () => {
    if (!scannerRef.current || scannerBusyRef.current) return;
    scannerBusyRef.current = true;
    setCameraError(null);
    // Stop any existing scanner first
    try {
      const existing = html5QrRef.current as { getState?: () => number; stop: () => Promise<void>; clear: () => void } | null;
      if (existing) {
        try { await existing.stop(); } catch {}
        try { existing.clear(); } catch {}
        html5QrRef.current = null;
      }
    } catch {}
    // Clear the container
    const el = document.getElementById("qr-reader");
    if (el) el.innerHTML = "";
    if (!mountedRef.current) { scannerBusyRef.current = false; return; }
    try {
      const { Html5Qrcode } = await import("html5-qrcode");
      if (!mountedRef.current) { scannerBusyRef.current = false; return; }
      const s = new Html5Qrcode("qr-reader");
      html5QrRef.current = s;
      await s.start(
        { facingMode: "environment" },
        { fps: 15, qrbox: (vw: number, vh: number) => ({ width: Math.min(vw, vh) * 0.7, height: Math.min(vw, vh) * 0.7 }) },
        onScanSuccess,
        () => {}
      );
      if (mountedRef.current) setScanning(true);
    } catch {
      if (mountedRef.current) setCameraError("Camera access denied. Please allow camera permissions.");
    } finally {
      scannerBusyRef.current = false;
    }
  }, [onScanSuccess]);

  const stopScanner = useCallback(async () => {
    try {
      const s = html5QrRef.current as { getState?: () => number; stop: () => Promise<void>; clear: () => void } | null;
      if (s) {
        try { await s.stop(); } catch {}
        try { s.clear(); } catch {}
      }
    } catch {}
    html5QrRef.current = null;
    setScanning(false);
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      stopScanner();
    };
  }, [stopScanner]);

  const successCount = recentScans.filter(s => s.success).length;
  const failCount = recentScans.filter(s => !s.success).length;

  return (
    <div className="h-screen bg-bg flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-bg-card border-b border-border flex-shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={() => { stopScanner(); router.push("/attendance"); }} className="rounded-xl p-2 hover:bg-border/50"><ArrowLeft className="h-5 w-5 text-text" /></button>
          <h1 className="text-lg font-semibold text-text">QR Scanner</h1>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-primary/10 rounded-xl px-3 py-1.5">
            <CheckCircle2 className="h-4 w-4 text-primary" />
            <span className="text-sm font-bold text-primary">{successCount}</span>
          </div>
          {scanning && <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-success animate-pulse" /><span className="text-xs font-medium text-success">Live</span></div>}
        </div>
      </div>

      {/* Body — fixed, no scroll */}
      <div className="flex-1 flex flex-col lg:flex-row gap-4 p-4 min-h-0">

        {/* Left: Scanner */}
        <div className="flex-1 flex flex-col gap-3 min-h-0">
          {/* Class selector */}
          <div className="relative flex-shrink-0">
            <button onClick={() => setClassOpen(!classOpen)}
              className={`w-full flex items-center justify-between gap-3 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all ${selectedClass ? "border-primary/30 bg-primary/5 text-primary shadow-sm" : "border-border text-text-muted hover:bg-bg"}`}>
              <div className="flex items-center gap-2.5">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className={`w-4 h-4 ${selectedClass ? "text-primary" : "text-text-muted"}`}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" /></svg>
                <span>{classes.find(c => c.id === selectedClass)?.name ?? "Select a class"}</span>
              </div>
              <ChevronDown className={`w-4 h-4 text-text-muted transition-transform ${classOpen ? "rotate-180" : ""}`} />
            </button>
            <AnimatePresence>
              {classOpen && (<>
                <div className="fixed inset-0 z-30" onClick={() => { setClassOpen(false); setClassSearch(""); }} />
                <motion.div initial={{ opacity: 0, y: -6, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -6, scale: 0.97 }} transition={{ duration: 0.15 }}
                  className="absolute left-0 right-0 top-full mt-2 z-40 bg-bg-card rounded-2xl border border-border shadow-xl overflow-hidden">
                  <div className="p-2 border-b border-border"><div className="relative"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg><input value={classSearch} onChange={e => setClassSearch(e.target.value)} placeholder="Search classes..." autoFocus className="w-full pl-9 pr-3 py-2 rounded-lg border border-border bg-bg text-sm text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/20" /></div></div>
                  <div className="p-2 max-h-[200px] overflow-y-auto">
                    {filteredClasses.length === 0 ? <p className="text-sm text-text-muted text-center py-4">No classes found</p> :
                      filteredClasses.map(c => (<button key={c.id} onClick={() => { updateSelectedClass(c.id); setClassOpen(false); setClassSearch(""); }}
                        className={`w-full text-left px-3 py-2 rounded-xl text-sm font-medium transition-all ${selectedClass === c.id ? "text-white bg-primary shadow-sm" : "text-text hover:bg-bg"}`}>
                        <span className="block truncate">{c.name}</span><span className={`text-[10px] ${selectedClass === c.id ? "text-white/70" : "text-text-muted"}`}>{c.subject} · Grade {c.grade}</span>
                      </button>))}
                  </div>
                </motion.div>
              </>)}
            </AnimatePresence>
          </div>

          {/* Scanner — square on mobile, fills space on desktop */}
          <div className="relative rounded-2xl overflow-hidden bg-black/5 border-2 border-dashed border-border min-h-0 aspect-square lg:aspect-auto lg:flex-1">
            <div id="qr-reader" ref={scannerRef} className="w-full h-full" />
            {!scanning && !cameraError && (<div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-text-muted"><Camera className="h-10 w-10" /><p className="text-sm">Camera preview</p></div>)}
            {cameraError && (<div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-6 text-center"><CameraOff className="h-10 w-10 text-danger" /><p className="text-xs text-danger">{cameraError}</p></div>)}
          </div>

          {/* Button */}
          <Button className="w-full flex-shrink-0 h-12 text-base" variant={scanning ? "danger" : "primary"} onClick={scanning ? stopScanner : startScanner}>
            {scanning ? "Stop Scanner" : "Start Scanner"}
          </Button>
        </div>

        {/* Right: Feed */}
        <div className="w-full lg:w-[300px] flex flex-col gap-3 flex-shrink-0 min-h-0">
          {/* Mini stats */}
          <div className="flex gap-3 flex-shrink-0">
            <div className="flex-1 bg-bg-card rounded-xl p-3 border border-border flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center text-white"><CheckCircle2 className="w-3.5 h-3.5" /></div>
              <div><p className="text-lg font-bold text-text leading-none">{successCount}</p><p className="text-[9px] text-text-muted uppercase font-semibold">Success</p></div>
            </div>
            <div className="flex-1 bg-bg-card rounded-xl p-3 border border-border flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center text-white"><XCircle className="w-3.5 h-3.5" /></div>
              <div><p className="text-lg font-bold text-text leading-none">{failCount}</p><p className="text-[9px] text-text-muted uppercase font-semibold">Failed</p></div>
            </div>
          </div>

          {/* Recent scans — fills remaining, internal scroll only */}
          <div className="bg-bg-card rounded-2xl border border-border flex-1 flex flex-col overflow-hidden min-h-0">
            <div className="px-4 py-2.5 border-b border-border flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-2"><Clock className="w-3.5 h-3.5 text-text-muted" /><p className="text-xs font-semibold text-text">Recent Scans</p></div>
              {recentScans.length > 0 && <span className="text-[9px] font-bold text-text-muted bg-bg rounded-full px-1.5 py-0.5">{recentScans.length}</span>}
            </div>
            <div className="flex-1 overflow-y-auto min-h-0">
              {recentScans.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-text-muted"><Camera className="w-6 h-6 mb-1.5 opacity-30" /><p className="text-[10px]">Scans appear here</p></div>
              ) : (
                <div className="divide-y divide-border">
                  {recentScans.map((scan, i) => (
                    <motion.div key={`${scan.code}-${scan.time}-${i}`} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-2.5 px-4 py-2">
                      <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${scan.success ? "bg-success" : "bg-danger"}`} />
                      <div className="flex-1 min-w-0">
                        <p className={`text-xs font-medium truncate ${scan.success ? "text-text" : "text-danger"}`}>{scan.success ? scan.name : scan.message}</p>
                        <p className="text-[9px] text-text-muted font-mono">{scan.code}</p>
                      </div>
                      <span className="text-[9px] text-text-muted whitespace-nowrap">{scan.time}</span>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Tips */}
          <div className="bg-primary/5 rounded-xl border border-primary/10 p-3 flex-shrink-0">
            <p className="text-[10px] font-semibold text-primary mb-1">💡 Tips</p>
            <ul className="space-y-0.5 text-[10px] text-text-muted">
              <li>• Hold QR steady with good lighting</li>
              <li>• Same student won&apos;t scan twice in 4s</li>
              <li>• Duplicate daily attendance auto-prevented</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
