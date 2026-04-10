"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, Camera, CameraOff, CheckCircle2 } from "lucide-react";
import Button from "@/components/ui/Button";
import { markAttendance } from "@/services/api";
import type { ClassItem } from "@/lib/types";
import { getClasses } from "@/services/api";

const DUPLICATE_COOLDOWN = 4000;

function playBeep() {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 1200;
    gain.gain.value = 0.3;
    osc.start();
    osc.stop(ctx.currentTime + 0.15);
  } catch { /* silent fail */ }
}

export default function ScannerPage() {
  const router = useRouter();
  const scannerRef = useRef<HTMLDivElement>(null);
  const html5QrRef = useRef<unknown>(null);
  const lastScanRef = useRef<{ code: string; time: number }>({ code: "", time: 0 });

  const [scanning, setScanning] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<string | null>(null);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>("");

  useEffect(() => {
    getClasses().then((c) => {
      setClasses(c);
      if (c.length) setSelectedClass(c[0].id);
    }).catch(() => {});
  }, []);

  const onScanSuccess = useCallback(async (decodedText: string) => {
    const now = Date.now();
    if (
      lastScanRef.current.code === decodedText &&
      now - lastScanRef.current.time < DUPLICATE_COOLDOWN
    ) return;

    lastScanRef.current = { code: decodedText, time: now };

    if (!selectedClass) {
      toast.error("Please select a class first");
      return;
    }

    try {
      const res = await markAttendance({ studentCode: decodedText, classId: selectedClass });
      playBeep();
      setLastResult(res.studentName);
      toast.success(`Marked: ${res.studentName}`);
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "response" in err
          ? ((err as { response?: { data?: { message?: string } } }).response?.data?.message ?? "Scan failed")
          : "Scan failed";
      toast.error(msg);
    }
  }, [selectedClass]);

  const startScanner = useCallback(async () => {
    if (!scannerRef.current) return;
    setCameraError(null);
    try {
      const { Html5Qrcode } = await import("html5-qrcode");
      const scanner = new Html5Qrcode("qr-reader");
      html5QrRef.current = scanner;
      await scanner.start(
        { facingMode: "environment" },
        { fps: 15, qrbox: { width: 250, height: 250 }, aspectRatio: 1 },
        onScanSuccess,
        () => {}
      );
      setScanning(true);
    } catch {
      setCameraError("Camera access denied. Please allow camera permissions and try again.");
    }
  }, [onScanSuccess]);

  const stopScanner = useCallback(async () => {
    try {
      const scanner = html5QrRef.current as { stop: () => Promise<void>; clear: () => void } | null;
      if (scanner) {
        await scanner.stop();
        scanner.clear();
      }
    } catch { /* ignore */ }
    html5QrRef.current = null;
    setScanning(false);
  }, []);

  useEffect(() => {
    return () => { stopScanner(); };
  }, [stopScanner]);

  return (
    <div className="min-h-screen bg-bg flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 bg-bg-card border-b border-border">
        <button onClick={() => { stopScanner(); router.push("/dashboard"); }} className="rounded-xl p-2 hover:bg-border/50">
          <ArrowLeft className="h-5 w-5 text-text" />
        </button>
        <h1 className="text-lg font-semibold text-text">QR Scanner</h1>
      </div>

      <div className="flex-1 flex flex-col items-center px-4 py-6 max-w-lg mx-auto w-full gap-4">
        {/* Class selector */}
        <select
          value={selectedClass}
          onChange={(e) => setSelectedClass(e.target.value)}
          className="w-full rounded-xl border border-border bg-bg-card px-4 py-2.5 text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/50"
        >
          <option value="">Select a class</option>
          {classes.map((c) => (
            <option key={c.id} value={c.id}>{c.name} — {c.subject}</option>
          ))}
        </select>

        {/* Scanner viewport */}
        <div className="relative w-full aspect-square rounded-2xl overflow-hidden bg-black/5 border-2 border-dashed border-border">
          <div id="qr-reader" ref={scannerRef} className="w-full h-full" />
          {!scanning && !cameraError && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-text-muted">
              <Camera className="h-12 w-12" />
              <p className="text-sm">Camera preview will appear here</p>
            </div>
          )}
          {cameraError && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center">
              <CameraOff className="h-12 w-12 text-danger" />
              <p className="text-sm text-danger">{cameraError}</p>
            </div>
          )}
        </div>

        {/* Controls */}
        <Button
          size="lg"
          className="w-full"
          variant={scanning ? "danger" : "primary"}
          onClick={scanning ? stopScanner : startScanner}
        >
          {scanning ? "Stop Scanner" : "Start Scanner"}
        </Button>

        {/* Last result */}
        {lastResult && (
          <div className="w-full rounded-2xl bg-success/10 border border-success/30 p-4 flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 text-success shrink-0" />
            <div>
              <p className="text-sm font-medium text-text">Attendance Marked</p>
              <p className="text-sm text-text-muted">{lastResult}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
