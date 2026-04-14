"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, Camera, CameraOff, CheckCircle2, ChevronDown, XCircle, Clock, WifiOff, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Button from "@/components/ui/Button";
import { markAttendance, getClasses } from "@/services/api";
import type { ClassItem } from "@/lib/types";
import jsQR from "jsqr";
import { loadTodayCache, saveTodayCache, getOfflineQueue, addToOfflineQueue, clearOfflineQueue } from "@/lib/offlineScan";

const DUPLICATE_COOLDOWN = 4000;
interface ScanRecord { name: string; code: string; time: string; success: boolean; message?: string; }
interface ScanFeedback { type: "success" | "error"; name: string; message: string; }

function playBeep() { try { const c = new AudioContext(), o = c.createOscillator(), g = c.createGain(); o.connect(g); g.connect(c.destination); o.frequency.value = 1200; g.gain.value = 0.3; o.start(); o.stop(c.currentTime + 0.15); } catch {} }
function playError() { try { const c = new AudioContext(), o = c.createOscillator(), g = c.createGain(); o.connect(g); g.connect(c.destination); o.frequency.value = 400; g.gain.value = 0.3; o.start(); o.stop(c.currentTime + 0.3); } catch {} }

export default function ScannerPage() {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number>(0);
  const lastScanRef = useRef<{ code: string; time: number }>({ code: "", time: 0 });
  const markedTodayRef = useRef<Set<string>>(new Set());
  const mountedRef = useRef(true);
  const [isOnline, setIsOnline] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);
  const [syncing, setSyncing] = useState(false);

  const [scanning, setScanning] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [selectedClass, setSelectedClass] = useState("");
  const selectedClassRef = useRef("");
  const updateSelectedClass = (id: string) => { setSelectedClass(id); selectedClassRef.current = id; };
  const [classSearch, setClassSearch] = useState("");
  const [classOpen, setClassOpen] = useState(false);
  const [recentScans, setRecentScans] = useState<ScanRecord[]>([]);
  const [scanFeedback, setScanFeedback] = useState<ScanFeedback | null>(null);
  const feedbackTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [scanPage, setScanPage] = useState(0);

  const showFeedback = useCallback((fb: ScanFeedback) => {
    if (feedbackTimer.current) clearTimeout(feedbackTimer.current);
    setScanFeedback(fb);
    feedbackTimer.current = setTimeout(() => setScanFeedback(null), 1200);
  }, []);

  // Load persisted today cache + offline queue count on mount
  useEffect(() => {
    markedTodayRef.current = loadTodayCache();
    setPendingCount(getOfflineQueue().length);
  }, []);

  // Online/offline detection
  useEffect(() => {
    const goOnline = () => setIsOnline(true);
    const goOffline = () => setIsOnline(false);
    setIsOnline(navigator.onLine);
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    return () => { window.removeEventListener("online", goOnline); window.removeEventListener("offline", goOffline); };
  }, []);

  // Auto-sync when back online
  const syncOfflineQueue = useCallback(async () => {
    const queue = getOfflineQueue();
    if (!queue.length || syncing) return;
    setSyncing(true);
    let synced = 0;
    for (const scan of queue) {
      try {
        await markAttendance({ studentCode: scan.studentCode, classId: scan.classId });
        synced++;
      } catch {}
    }
    clearOfflineQueue();
    setPendingCount(0);
    setSyncing(false);
    if (synced > 0) toast.success(`Synced ${synced} offline scan${synced > 1 ? "s" : ""}`);
  }, [syncing]);

  useEffect(() => {
    if (isOnline) syncOfflineQueue();
  }, [isOnline, syncOfflineQueue]);

  const filteredClasses = classes.filter(c => {
    if (!classSearch.trim()) return true;
    const q = classSearch.toLowerCase();
    return c.name.toLowerCase().includes(q) || (c.subject?.toLowerCase().includes(q));
  });

  useEffect(() => { getClasses().then(c => { setClasses(c); if (c.length) { setSelectedClass(c[0].id); selectedClassRef.current = c[0].id; } }).catch(() => {}); }, []);

  const onQrDetected = useCallback((decodedText: string) => {
    const now = Date.now();
    if (lastScanRef.current.code === decodedText && now - lastScanRef.current.time < DUPLICATE_COOLDOWN) return;
    lastScanRef.current = { code: decodedText, time: now };
    if (!selectedClassRef.current) { toast.error("Select a class first"); return; }
    const time = new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    const cacheKey = `${decodedText}_${selectedClassRef.current}`;
    if (markedTodayRef.current.has(cacheKey)) {
      playError();
      showFeedback({ type: "error", name: "", message: "" });
      return;
    }

    if (!navigator.onLine) {
      // Offline: queue + cache + green
      playBeep();
      addToOfflineQueue({ studentCode: decodedText, classId: selectedClassRef.current, scannedAt: new Date().toISOString() });
      markedTodayRef.current.add(cacheKey);
      saveTodayCache(markedTodayRef.current);
      setPendingCount(getOfflineQueue().length);
      setRecentScans(prev => [{ name: decodedText, code: decodedText, time, success: true, message: "Queued offline" }, ...prev].slice(0, 8));
      setScanPage(0);
      showFeedback({ type: "success", name: "", message: "" });
      return;
    }

    // Online: call API
    playBeep();
    markAttendance({ studentCode: decodedText, classId: selectedClassRef.current }).then(res => {
      markedTodayRef.current.add(cacheKey);
      saveTodayCache(markedTodayRef.current);
      setRecentScans(prev => [{ name: res.studentName, code: decodedText, time, success: true }, ...prev].slice(0, 8));
      setScanPage(0);
      showFeedback({ type: "success", name: "", message: "" });
    }).catch((err: unknown) => {
      const msg = err && typeof err === "object" && "response" in err ? ((err as { response?: { data?: { message?: string } } }).response?.data?.message ?? "Scan failed") : "Scan failed";
      if (msg.includes("already marked")) { markedTodayRef.current.add(cacheKey); saveTodayCache(markedTodayRef.current); }
      playError();
      setRecentScans(prev => [{ name: "", code: decodedText, time, success: false, message: msg }, ...prev].slice(0, 8));
      setScanPage(0);
      showFeedback({ type: "error", name: "", message: "" });
    });
  }, [showFeedback]);

  const onQrDetectedRef = useRef(onQrDetected);
  onQrDetectedRef.current = onQrDetected;

  const scanFrame = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.readyState !== video.HAVE_ENOUGH_DATA) {
      rafRef.current = requestAnimationFrame(scanFrame);
      return;
    }
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) { rafRef.current = requestAnimationFrame(scanFrame); return; }
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const code = jsQR(imageData.data, imageData.width, imageData.height, { inversionAttempts: "dontInvert" });
    if (code?.data) {
      onQrDetectedRef.current(code.data);
    }
    rafRef.current = requestAnimationFrame(scanFrame);
  }, []);

  const startScanner = useCallback(async () => {
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } }
      });
      if (!mountedRef.current) { stream.getTracks().forEach(t => t.stop()); return; }
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setScanning(true);
      rafRef.current = requestAnimationFrame(scanFrame);
    } catch {
      setCameraError("Camera access denied. Please allow camera permissions.");
    }
  }, [scanFrame]);

  const stopScanner = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) videoRef.current.srcObject = null;
    setScanning(false);
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; stopScanner(); };
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
          {!isOnline && (
            <div className="flex items-center gap-1.5 bg-amber-500/10 rounded-xl px-2.5 py-1.5">
              <WifiOff className="h-3.5 w-3.5 text-amber-600" />
              <span className="text-[10px] font-bold text-amber-600">Offline</span>
            </div>
          )}
          {pendingCount > 0 && (
            <div className="flex items-center gap-1.5 bg-amber-500/10 rounded-xl px-2.5 py-1.5">
              {syncing ? <Loader2 className="h-3.5 w-3.5 text-amber-600 animate-spin" /> : <Clock className="h-3.5 w-3.5 text-amber-600" />}
              <span className="text-[10px] font-bold text-amber-600">{pendingCount} pending</span>
            </div>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 flex flex-col lg:flex-row gap-3 p-3 lg:p-4 lg:gap-4 min-h-0 overflow-hidden">

        {/* Left: Scanner */}
        <div className="flex-1 flex flex-col gap-2 lg:gap-3 min-h-0">
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

          {/* Scanner */}
          <div className="relative rounded-2xl overflow-hidden bg-black border-2 border-border flex-1 min-h-0">
            <video ref={videoRef} playsInline muted className="w-full h-full object-cover" />
            <canvas ref={canvasRef} className="hidden" />

            {/* Corner brackets */}
            {scanning && (
              <div className="absolute inset-0 pointer-events-none z-[5] flex items-center justify-center">
                <div className="relative" style={{ width: "70%", maxWidth: "280px", aspectRatio: "1" }}>
                  {(() => {
                    const color = scanFeedback?.type === "success" ? "border-emerald-400" : scanFeedback?.type === "error" ? "border-red-400" : "border-white";
                    return (<>
                      <div className={`absolute top-0 left-0 w-6 h-6 border-t-3 border-l-3 rounded-tl-lg transition-colors duration-300 ${color}`} />
                      <div className={`absolute top-0 right-0 w-6 h-6 border-t-3 border-r-3 rounded-tr-lg transition-colors duration-300 ${color}`} />
                      <div className={`absolute bottom-0 left-0 w-6 h-6 border-b-3 border-l-3 rounded-bl-lg transition-colors duration-300 ${color}`} />
                      <div className={`absolute bottom-0 right-0 w-6 h-6 border-b-3 border-r-3 rounded-br-lg transition-colors duration-300 ${color}`} />
                    </>);
                  })()}
                  <div className={`absolute left-2 right-2 h-0.5 rounded-full animate-[scanline_2s_ease-in-out_infinite] transition-colors duration-300 ${
                    scanFeedback?.type === "success" ? "bg-emerald-400" : scanFeedback?.type === "error" ? "bg-red-400" : "bg-primary/80"
                  }`} />
                </div>
              </div>
            )}

            {!scanning && !cameraError && (<div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-text-muted"><Camera className="h-10 w-10" /><p className="text-sm">Camera preview</p></div>)}
            {cameraError && (<div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-6 text-center"><CameraOff className="h-10 w-10 text-danger" /><p className="text-xs text-danger">{cameraError}</p></div>)}

            {/* Scan feedback overlay */}
            <AnimatePresence>
              {scanFeedback && (
                <motion.div
                  key={scanFeedback.name + scanFeedback.message}
                  initial={{ opacity: 0, scale: 0.7 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.7 }}
                  transition={{ type: "spring", duration: 0.3 }}
                  className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none"
                >
                  <div className={`rounded-full w-20 h-20 shadow-2xl flex items-center justify-center ${
                    scanFeedback.type === "success"
                      ? "bg-emerald-500"
                      : "bg-red-500"
                  }`}>
                    {scanFeedback.type === "success"
                      ? <CheckCircle2 className="w-10 h-10 text-white" />
                      : <XCircle className="w-10 h-10 text-white" />
                    }
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Button */}
          <Button className="w-full flex-shrink-0 h-11 lg:h-12 text-base" variant={scanning ? "danger" : "primary"} onClick={scanning ? stopScanner : startScanner}>
            {scanning ? "Stop Scanner" : "Start Scanner"}
          </Button>
        </div>

        {/* Right: Feed */}
        <div className="w-full lg:w-[300px] flex flex-col gap-2 lg:gap-3 flex-shrink-0 h-[180px] lg:h-auto lg:min-h-0">
          {/* Mini stats */}
          <div className="flex gap-2 lg:gap-3 flex-shrink-0">
            <div className="flex-1 bg-bg-card rounded-xl p-2 lg:p-3 border border-border flex items-center gap-2">
              <div className="w-7 h-7 lg:w-8 lg:h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center text-white"><CheckCircle2 className="w-3.5 h-3.5" /></div>
              <div><p className="text-base lg:text-lg font-bold text-text leading-none">{successCount}</p><p className="text-[9px] text-text-muted uppercase font-semibold">Success</p></div>
            </div>
            <div className="flex-1 bg-bg-card rounded-xl p-2 lg:p-3 border border-border flex items-center gap-2">
              <div className="w-7 h-7 lg:w-8 lg:h-8 rounded-lg bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center text-white"><XCircle className="w-3.5 h-3.5" /></div>
              <div><p className="text-base lg:text-lg font-bold text-text leading-none">{failCount}</p><p className="text-[9px] text-text-muted uppercase font-semibold">Failed</p></div>
            </div>
          </div>

          {/* Recent scans — paginated on mobile */}
          <div className="bg-bg-card rounded-2xl border border-border flex-1 flex flex-col overflow-hidden min-h-0">
            <div className="px-3 lg:px-4 py-2 lg:py-2.5 border-b border-border flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-2"><Clock className="w-3.5 h-3.5 text-text-muted" /><p className="text-xs font-semibold text-text">Recent Scans</p></div>
              <div className="flex items-center gap-2">
                {recentScans.length > 3 && (
                  <div className="flex items-center gap-1 lg:hidden">
                    {Array.from({ length: Math.ceil(recentScans.length / 3) }, (_, i) => (
                      <button key={i} onClick={() => setScanPage(i)}
                        className={`w-1.5 h-1.5 rounded-full transition-all ${scanPage === i ? "bg-primary w-3" : "bg-border"}`} />
                    ))}
                  </div>
                )}
                {recentScans.length > 0 && <span className="text-[9px] font-bold text-text-muted bg-bg rounded-full px-1.5 py-0.5">{recentScans.length}</span>}
              </div>
            </div>
            <div className="flex-1 overflow-y-auto min-h-0">
              {recentScans.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-text-muted"><Camera className="w-6 h-6 mb-1.5 opacity-30" /><p className="text-[10px]">Scans appear here</p></div>
              ) : (
                <div className="divide-y divide-border">
                  {(() => {
                    const isMobile = typeof window !== "undefined" && window.innerWidth < 1024;
                    const items = isMobile ? recentScans.slice(scanPage * 3, scanPage * 3 + 3) : recentScans;
                    return items.map((scan, i) => (
                      <motion.div key={`${scan.code}-${scan.time}-${i}`} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-2.5 px-3 lg:px-4 py-2">
                        <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${scan.success ? "bg-success" : "bg-danger"}`} />
                        <div className="flex-1 min-w-0">
                          <p className={`text-xs font-medium truncate ${scan.success ? "text-text" : "text-danger"}`}>{scan.success ? scan.name : scan.message}</p>
                          <p className="text-[9px] text-text-muted font-mono">{scan.code}</p>
                        </div>
                        <span className="text-[9px] text-text-muted whitespace-nowrap">{scan.time}</span>
                      </motion.div>
                    ));
                  })()}
                </div>
              )}
            </div>
          </div>

          {/* Tips — hidden on mobile to save space */}
          <div className="hidden lg:block bg-primary/5 rounded-xl border border-primary/10 p-3 flex-shrink-0">
            <p className="text-[10px] font-semibold text-primary mb-1">💡 Tips</p>
            <ul className="space-y-0.5 text-[10px] text-text-muted">
              <li>• Hold QR steady with good lighting</li>
              <li>• Same student won&apos;t scan twice in 4s</li>
              <li>• Duplicate daily attendance auto-prevented</li>
            </ul>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes scanline { 0%, 100% { top: 10%; } 50% { top: 85%; } }
      `}</style>
    </div>
  );
}
