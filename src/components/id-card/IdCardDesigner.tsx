"use client";
import { useState, useRef, useCallback, useEffect } from "react";
import { toast } from "sonner";
import { Trash2, Plus, GripVertical, Lock, Type, QrCode, Square, RotateCcw, Save, Loader2, ChevronDown } from "lucide-react";
import { CardDesign, CardElement, DEFAULT_DESIGN, VARIABLES, CARD_W, CARD_H } from "./types";
import { getIdCardDesign, saveIdCardDesign } from "@/services/api";

const SAMPLE: Record<string, string> = {
  "{{studentName}}": "Kasun Perera",
  "{{studentCode}}": "STU-0042",
  "{{enrolledDate}}": "Jan 15, 2025",
  "{{teacherName}}": "Mr. Silva",
  "{{subject}}": "Mathematics",
  "{{grade}}": "10",
};

const resolve = (content: string) => {
  let out = content;
  for (const [k, v] of Object.entries(SAMPLE)) out = out.replaceAll(k, v);
  return out;
};

let _id = 0;
const uid = () => `el_${Date.now()}_${++_id}`;

const PALETTE = [
  { name: "White", value: "#ffffff" },
  { name: "Light Gray", value: "#f1f5f9" },
  { name: "Gray", value: "#94a3b8" },
  { name: "Dark Gray", value: "#475569" },
  { name: "Charcoal", value: "#1e293b" },
  { name: "Black", value: "#111827" },
  { name: "Indigo", value: "#4F46E5" },
  { name: "Blue", value: "#3b82f6" },
  { name: "Sky", value: "#0ea5e9" },
  { name: "Teal", value: "#14b8a6" },
  { name: "Emerald", value: "#10b981" },
  { name: "Green", value: "#22c55e" },
  { name: "Yellow", value: "#eab308" },
  { name: "Amber", value: "#f59e0b" },
  { name: "Orange", value: "#f97316" },
  { name: "Red", value: "#ef4444" },
  { name: "Rose", value: "#f43f5e" },
  { name: "Pink", value: "#ec4899" },
  { name: "Purple", value: "#a855f7" },
  { name: "Violet", value: "#8b5cf6" },
];

const HEADER_PRESETS = [
  { name: "Indigo", value: "linear-gradient(135deg, #4F46E5, #3730A3)" },
  { name: "Blue", value: "linear-gradient(135deg, #3b82f6, #1d4ed8)" },
  { name: "Sky", value: "linear-gradient(135deg, #0ea5e9, #0369a1)" },
  { name: "Teal", value: "linear-gradient(135deg, #14b8a6, #0f766e)" },
  { name: "Emerald", value: "linear-gradient(135deg, #10b981, #047857)" },
  { name: "Purple", value: "linear-gradient(135deg, #a855f7, #7e22ce)" },
  { name: "Rose", value: "linear-gradient(135deg, #f43f5e, #be123c)" },
  { name: "Orange", value: "linear-gradient(135deg, #f97316, #c2410c)" },
  { name: "Amber", value: "linear-gradient(135deg, #f59e0b, #b45309)" },
  { name: "Slate", value: "linear-gradient(135deg, #475569, #1e293b)" },
  { name: "Dark", value: "linear-gradient(135deg, #1e293b, #0f172a)" },
  { name: "Black", value: "#111827" },
];

function ColorPicker({ value, onChange, label }: { value: string; onChange: (v: string) => void; label: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <label className="text-[10px] font-semibold text-text-muted block mb-1">{label}</label>
      <div className="relative">
        <button type="button" onClick={() => setOpen(!open)} className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg border border-border bg-bg text-xs text-text hover:border-primary/30 transition-all">
          <div className="w-5 h-5 rounded border border-border flex-shrink-0" style={{ background: value }} />
          <span className="truncate flex-1 text-left">{PALETTE.find(c => c.value === value)?.name || "Custom"}</span>
          <ChevronDown className={`w-3 h-3 text-text-muted transition-transform ${open ? "rotate-180" : ""}`} />
        </button>
        {open && (
          <>
            <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
            <div className="absolute left-0 top-full mt-1 z-40 bg-bg-card rounded-xl border border-border shadow-xl w-56 p-3">
              <div className="grid grid-cols-5 gap-1.5 mb-3">
                {PALETTE.map(c => (
                  <button key={c.value} type="button" onClick={() => { onChange(c.value); setOpen(false); }} title={c.name}
                    className={`w-full aspect-square rounded-lg border-2 transition-all hover:scale-110 ${value === c.value ? "border-primary ring-1 ring-primary/30" : "border-transparent hover:border-border"}`}
                    style={{ background: c.value }} />
                ))}
              </div>
              <div className="flex items-center gap-2 pt-2 border-t border-border">
                <input type="color" value={value.startsWith("#") ? value : "#000000"} onChange={(e) => { onChange(e.target.value); setOpen(false); }} className="w-8 h-8 rounded-lg border border-border cursor-pointer flex-shrink-0" />
                <span className="text-[10px] text-text-muted">Custom color</span>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function IdCardDesigner() {
  const [design, setDesign] = useState<CardDesign>(DEFAULT_DESIGN);
  const [selected, setSelected] = useState<string | null>(null);
  const [dragging, setDragging] = useState<{ id: string; offX: number; offY: number } | null>(null);
  const [resizing, setResizing] = useState<{ id: string; startX: number; startY: number; startW: number; startH: number } | null>(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [resetting, setResetting] = useState(false);
  const [varDropdown, setVarDropdown] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  // Load saved design
  useEffect(() => {
    getIdCardDesign()
      .then((data) => {
        if (data.design) {
          try { setDesign(JSON.parse(data.design)); } catch { /* use default */ }
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Auto-scale canvas
  const [scale, setScale] = useState(1);
  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    const calc = () => setScale(Math.min(wrap.offsetWidth / CARD_W, 1));
    calc();
    window.addEventListener("resize", calc);
    return () => window.removeEventListener("resize", calc);
  }, [loading]);

  const updateElement = useCallback((id: string, patch: Partial<CardElement>) => {
    setDesign((d) => ({ ...d, elements: d.elements.map((e) => (e.id === id ? { ...e, ...patch } : e)) }));
  }, []);

  const deleteElement = useCallback((id: string) => {
    setDesign((d) => ({ ...d, elements: d.elements.filter((e) => e.id !== id) }));
    setSelected(null);
  }, []);

  const addElement = useCallback((type: CardElement["type"]) => {
    const el: CardElement = {
      id: uid(),
      type,
      label: type === "qr" ? "QR Code" : type === "shape" ? "Shape" : "Text",
      x: 5, y: 40, w: type === "qr" ? 20 : type === "shape" ? 15 : 30, h: type === "qr" ? 35 : type === "shape" ? 20 : 8,
      content: type === "qr" ? "qr" : type === "shape" ? "" : "New Text",
      fontSize: type === "shape" ? 12 : 12,
      fontWeight: "600",
      color: type === "shape" ? "#ffffff" : "#334155",
      bgColor: type === "shape" ? "#4F46E5" : undefined,
      borderRadius: type === "shape" ? 8 : undefined,
      textAlign: "left",
    };
    setDesign((d) => ({ ...d, elements: [...d.elements, el] }));
    setSelected(el.id);
  }, []);

  // Mouse handlers for drag
  const handleMouseDown = useCallback((e: React.MouseEvent, el: CardElement) => {
    e.stopPropagation();
    setSelected(el.id);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mx = (e.clientX - rect.left) / scale;
    const my = (e.clientY - rect.top) / scale;
    const elX = (el.x / 100) * CARD_W;
    const elY = (el.y / 100) * CARD_H;
    setDragging({ id: el.id, offX: mx - elX, offY: my - elY });
  }, [scale]);

  const handleResizeDown = useCallback((e: React.MouseEvent, el: CardElement) => {
    e.stopPropagation();
    e.preventDefault();
    setResizing({ id: el.id, startX: e.clientX, startY: e.clientY, startW: el.w, startH: el.h });
  }, []);

  useEffect(() => {
    if (!dragging && !resizing) return;
    const handleMove = (e: MouseEvent) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      if (dragging) {
        const mx = (e.clientX - rect.left) / scale;
        const my = (e.clientY - rect.top) / scale;
        const x = Math.max(0, Math.min(100, ((mx - dragging.offX) / CARD_W) * 100));
        const y = Math.max(0, Math.min(100, ((my - dragging.offY) / CARD_H) * 100));
        updateElement(dragging.id, { x: Math.round(x * 10) / 10, y: Math.round(y * 10) / 10 });
      }
      if (resizing) {
        const dx = ((e.clientX - resizing.startX) / scale / CARD_W) * 100;
        const dy = ((e.clientY - resizing.startY) / scale / CARD_H) * 100;
        const w = Math.max(5, Math.min(100, resizing.startW + dx));
        const h = Math.max(3, Math.min(100, resizing.startH + dy));
        updateElement(resizing.id, { w: Math.round(w * 10) / 10, h: Math.round(h * 10) / 10 });
      }
    };
    const handleUp = () => { setDragging(null); setResizing(null); };
    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", handleUp);
    return () => { window.removeEventListener("mousemove", handleMove); window.removeEventListener("mouseup", handleUp); };
  }, [dragging, resizing, scale, updateElement]);

  // Touch handlers for mobile drag
  const handleTouchStart = useCallback((e: React.TouchEvent, el: CardElement) => {
    e.stopPropagation();
    setSelected(el.id);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0];
    const mx = (touch.clientX - rect.left) / scale;
    const my = (touch.clientY - rect.top) / scale;
    const elX = (el.x / 100) * CARD_W;
    const elY = (el.y / 100) * CARD_H;
    setDragging({ id: el.id, offX: mx - elX, offY: my - elY });
  }, [scale]);

  useEffect(() => {
    if (!dragging) return;
    const handleTouchMove = (e: TouchEvent) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const touch = e.touches[0];
      const mx = (touch.clientX - rect.left) / scale;
      const my = (touch.clientY - rect.top) / scale;
      const x = Math.max(0, Math.min(100, ((mx - dragging.offX) / CARD_W) * 100));
      const y = Math.max(0, Math.min(100, ((my - dragging.offY) / CARD_H) * 100));
      updateElement(dragging.id, { x: Math.round(x * 10) / 10, y: Math.round(y * 10) / 10 });
      e.preventDefault();
    };
    const handleTouchEnd = () => setDragging(null);
    window.addEventListener("touchmove", handleTouchMove, { passive: false });
    window.addEventListener("touchend", handleTouchEnd);
    return () => { window.removeEventListener("touchmove", handleTouchMove); window.removeEventListener("touchend", handleTouchEnd); };
  }, [dragging, scale, updateElement]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveIdCardDesign(JSON.stringify(design));
      toast.success("ID card design saved");
    } catch { toast.error("Failed to save design"); }
    finally { setSaving(false); }
  };

  const handleReset = () => { setDesign(DEFAULT_DESIGN); setSelected(null); toast.success("Reset to default design"); };

  const handleUseDefault = async () => {
    setResetting(true);
    try {
      setDesign(DEFAULT_DESIGN);
      setSelected(null);
      await saveIdCardDesign(JSON.stringify(DEFAULT_DESIGN));
      toast.success("Default design applied & saved");
    } catch { toast.error("Failed to save"); }
    finally { setResetting(false); }
  };

  const selectedEl = design.elements.find((e) => e.id === selected);

  if (loading) return <div className="flex items-center justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-5">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <button onClick={() => addElement("text")} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-bg border border-border hover:border-primary/30 text-text transition-all">
          <Type className="w-3.5 h-3.5" /> Add Text
        </button>
        <button onClick={() => addElement("shape")} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-bg border border-border hover:border-primary/30 text-text transition-all">
          <Square className="w-3.5 h-3.5" /> Add Shape
        </button>
        <div className="flex-1" />
        <button onClick={handleReset} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-text-muted hover:text-text bg-bg border border-border transition-all">
          <RotateCcw className="w-3.5 h-3.5" /> Reset
        </button>
        <button onClick={handleUseDefault} disabled={resetting} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 transition-all disabled:opacity-50">
          {resetting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RotateCcw className="w-3.5 h-3.5" />} Use Default
        </button>
        <button onClick={handleSave} disabled={saving} className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white transition-all disabled:opacity-50" style={{ background: "linear-gradient(135deg, #4F46E5, #3730A3)" }}>
          {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />} Save Design
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-5">
        {/* Canvas */}
        <div className="flex-1 min-w-0">
          <div ref={wrapRef} className="w-full overflow-hidden" style={{ height: CARD_H * scale }}>
            <div
              ref={canvasRef}
              onClick={(e) => { if (e.target === e.currentTarget) setSelected(null); }}
              className="relative select-none border-2 border-dashed border-border rounded-2xl overflow-hidden origin-top-left"
              style={{ width: CARD_W, height: CARD_H, transform: `scale(${scale})`, background: design.bgColor }}
            >
              {/* Header background */}
              <div className="absolute inset-x-0 top-0 pointer-events-none" style={{ height: `${design.headerHeight}%`, background: design.headerBg }} />

              {/* Elements */}
              {design.elements.map((el) => {
                const isSel = el.id === selected;
                const left = `${el.x}%`;
                const top = `${el.y}%`;
                const width = `${el.w}%`;
                const height = `${el.h}%`;

                if (el.type === "qr") {
                  return (
                    <div
                      key={el.id}
                      onMouseDown={(e) => handleMouseDown(e, el)}
                      onTouchStart={(e) => handleTouchStart(e, el)}
                      className={`absolute flex items-center justify-center cursor-move ${isSel ? "ring-2 ring-primary ring-offset-1" : "hover:ring-1 hover:ring-primary/40"}`}
                      style={{ left, top, width, height }}
                    >
                      <div className="w-full h-full bg-white border-2 border-slate-100 rounded-xl flex items-center justify-center p-1">
                        <QrCode className="w-full h-full text-slate-800" />
                      </div>
                      {isSel && <div onMouseDown={(e) => handleResizeDown(e, el)} className="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-primary rounded-full cursor-se-resize border-2 border-white" />}
                    </div>
                  );
                }

                if (el.type === "shape") {
                  return (
                    <div
                      key={el.id}
                      onMouseDown={(e) => handleMouseDown(e, el)}
                      onTouchStart={(e) => handleTouchStart(e, el)}
                      className={`absolute flex items-center justify-center cursor-move overflow-hidden ${isSel ? "ring-2 ring-primary ring-offset-1" : "hover:ring-1 hover:ring-primary/40"}`}
                      style={{ left, top, width, height, backgroundColor: el.bgColor, borderRadius: el.borderRadius, padding: '0 4px' }}
                    >
                      {el.content && <span style={{ fontSize: el.fontSize, fontWeight: el.fontWeight, color: el.color, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%', display: 'block', textAlign: 'center' }}>{resolve(el.content)}</span>}
                      {isSel && <div onMouseDown={(e) => handleResizeDown(e, el)} className="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-primary rounded-full cursor-se-resize border-2 border-white" />}
                    </div>
                  );
                }

                return (
                  <div
                    key={el.id}
                    onMouseDown={(e) => handleMouseDown(e, el)}
                    onTouchStart={(e) => handleTouchStart(e, el)}
                    className={`absolute cursor-move overflow-hidden whitespace-nowrap text-ellipsis ${isSel ? "ring-2 ring-primary ring-offset-1 rounded" : "hover:ring-1 hover:ring-primary/40 rounded"}`}
                    style={{ left, top, width, height, fontSize: el.fontSize, fontWeight: el.fontWeight, color: el.color, textAlign: el.textAlign, lineHeight: 1.3, display: "flex", alignItems: "center" }}
                  >
                    <span className="w-full truncate" style={{ textAlign: el.textAlign }}>{resolve(el.content)}</span>
                    {isSel && <div onMouseDown={(e) => handleResizeDown(e, el)} className="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-primary rounded-full cursor-se-resize border-2 border-white" />}
                  </div>
                );
              })}
            </div>
          </div>
          <p className="text-[10px] text-text-muted mt-2 text-center">Click an element to select · Drag to move · Corner handle to resize</p>
        </div>

        {/* Properties Panel */}
        <div className="w-full lg:w-72 flex-shrink-0 space-y-4">
          {/* Card Settings */}
          <div className="rounded-xl border border-border bg-bg-card p-4 space-y-3">
            <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Card Settings</p>
            <div className="grid grid-cols-2 gap-3">
              <ColorPicker label="Background" value={design.bgColor} onChange={(v) => setDesign({ ...design, bgColor: v })} />
              <div>
                <label className="text-[10px] font-semibold text-text-muted block mb-1">Header Height</label>
                <input type="range" min={0} max={50} value={design.headerHeight} onChange={(e) => setDesign({ ...design, headerHeight: Number(e.target.value) })} className="w-full accent-primary" />
                <p className="text-[10px] text-text-muted text-center">{design.headerHeight}%</p>
              </div>
            </div>
            <div>
              <label className="text-[10px] font-semibold text-text-muted block mb-1.5">Header Style</label>
              <div className="grid grid-cols-4 gap-1.5">
                {HEADER_PRESETS.map(p => (
                  <button key={p.name} type="button" onClick={() => setDesign({ ...design, headerBg: p.value })} title={p.name}
                    className={`h-7 rounded-lg border-2 transition-all hover:scale-105 ${design.headerBg === p.value ? "border-primary ring-1 ring-primary/30" : "border-transparent hover:border-border"}`}
                    style={{ background: p.value }} />
                ))}
              </div>
            </div>
          </div>

          {/* Selected Element Properties */}
          {selectedEl ? (
            <div className="rounded-xl border border-primary/30 bg-bg-card p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {selectedEl.locked && <Lock className="w-3 h-3 text-text-muted" />}
                  <p className="text-xs font-bold text-text">{selectedEl.label}</p>
                </div>
                {!selectedEl.locked && (
                  <button onClick={() => deleteElement(selectedEl.id)} className="p-1.5 rounded-lg text-danger/60 hover:text-danger hover:bg-danger/10 transition-all">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {selectedEl.type !== "qr" && (
                <>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[10px] font-semibold text-text-muted">Content</label>
                      <div className="relative">
                        <button onClick={() => setVarDropdown(!varDropdown)} className="text-[10px] font-semibold text-primary hover:text-primary-dark flex items-center gap-0.5">
                          + Variable <ChevronDown className="w-3 h-3" />
                        </button>
                        {varDropdown && (
                          <>
                            <div className="fixed inset-0 z-30" onClick={() => setVarDropdown(false)} />
                            <div className="absolute right-0 top-full mt-1 z-40 bg-bg-card rounded-xl border border-border shadow-xl w-44 p-1">
                              {VARIABLES.map((v) => (
                                <button key={v.key} onClick={() => {
                                  const resolved = SAMPLE[v.key as keyof typeof SAMPLE] || v.key;
                                  const charW = (selectedEl.fontSize || 12) * 0.6;
                                  const neededW = ((resolved.length * charW + 16) / CARD_W) * 100;
                                  const patch: Partial<CardElement> = { content: v.key };
                                  if (selectedEl.type === "shape" && selectedEl.w < neededW) {
                                    patch.w = Math.min(Math.round(neededW), 50);
                                  }
                                  updateElement(selectedEl.id, patch);
                                  setVarDropdown(false);
                                }}
                                  className="w-full text-left px-3 py-2 rounded-lg text-xs font-medium text-text hover:bg-bg transition-all">
                                  {v.label} <span className="text-text-muted font-mono text-[10px]">{v.key}</span>
                                </button>
                              ))}
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                    <input value={selectedEl.content} onChange={(e) => updateElement(selectedEl.id, { content: e.target.value })} className="w-full px-2 py-1.5 rounded-lg border border-border bg-bg text-xs text-text" />
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="text-[10px] font-semibold text-text-muted block mb-1">Size</label>
                      <input type="number" min={6} max={48} value={selectedEl.fontSize} onChange={(e) => updateElement(selectedEl.id, { fontSize: Number(e.target.value) })} className="w-full px-2 py-1.5 rounded-lg border border-border bg-bg text-xs text-text" />
                    </div>
                    <div>
                      <label className="text-[10px] font-semibold text-text-muted block mb-1">Weight</label>
                      <select value={selectedEl.fontWeight} onChange={(e) => updateElement(selectedEl.id, { fontWeight: e.target.value })} className="w-full px-1 py-1.5 rounded-lg border border-border bg-bg text-xs text-text">
                        <option value="400">Normal</option>
                        <option value="500">Medium</option>
                        <option value="600">Semi</option>
                        <option value="700">Bold</option>
                        <option value="800">Extra</option>
                        <option value="900">Black</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-semibold text-text-muted block mb-1">Align</label>
                      <select value={selectedEl.textAlign || "left"} onChange={(e) => updateElement(selectedEl.id, { textAlign: e.target.value as "left" | "center" | "right" })} className="w-full px-1 py-1.5 rounded-lg border border-border bg-bg text-xs text-text">
                        <option value="left">Left</option>
                        <option value="center">Center</option>
                        <option value="right">Right</option>
                      </select>
                    </div>
                  </div>
                  <div className={`grid ${selectedEl.type === "shape" ? "grid-cols-2" : "grid-cols-1"} gap-2`}>
                    <ColorPicker label="Text Color" value={selectedEl.color || "#000000"} onChange={(v) => updateElement(selectedEl.id, { color: v })} />
                    {selectedEl.type === "shape" && (
                      <ColorPicker label="Fill Color" value={selectedEl.bgColor || "#4F46E5"} onChange={(v) => updateElement(selectedEl.id, { bgColor: v })} />
                    )}
                  </div>
                  {selectedEl.type === "shape" && (
                    <div>
                      <label className="text-[10px] font-semibold text-text-muted block mb-1">Border Radius</label>
                      <input type="number" min={0} max={50} value={selectedEl.borderRadius || 0} onChange={(e) => updateElement(selectedEl.id, { borderRadius: Number(e.target.value) })} className="w-full px-2 py-1.5 rounded-lg border border-border bg-bg text-xs text-text" />
                    </div>
                  )}
                </>
              )}

              <div>
                <label className="text-[10px] font-semibold text-text-muted block mb-1">Label</label>
                <input value={selectedEl.label} onChange={(e) => updateElement(selectedEl.id, { label: e.target.value })} className="w-full px-2 py-1.5 rounded-lg border border-border bg-bg text-xs text-text" />
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-border bg-bg-card p-6 text-center">
              <GripVertical className="w-5 h-5 text-text-muted/30 mx-auto mb-2" />
              <p className="text-xs text-text-muted">Select an element to edit its properties</p>
            </div>
          )}

          {/* Elements List */}
          <div className="rounded-xl border border-border bg-bg-card p-4 space-y-2">
            <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-2">Elements ({design.elements.length})</p>
            <div className="space-y-1 max-h-[200px] overflow-y-auto">
              {design.elements.map((el) => (
                <button key={el.id} onClick={() => setSelected(el.id)}
                  className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-left text-xs transition-all ${el.id === selected ? "bg-primary/10 text-primary font-semibold" : "text-text hover:bg-bg"}`}>
                  {el.type === "qr" ? <QrCode className="w-3 h-3 flex-shrink-0" /> : el.type === "shape" ? <Square className="w-3 h-3 flex-shrink-0" /> : <Type className="w-3 h-3 flex-shrink-0" />}
                  <span className="truncate flex-1">{el.label}</span>
                  {el.locked && <Lock className="w-3 h-3 text-text-muted flex-shrink-0" />}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
