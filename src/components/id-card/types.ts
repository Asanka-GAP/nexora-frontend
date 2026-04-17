export interface CardElement {
  id: string;
  type: "text" | "qr" | "image" | "shape";
  label: string;
  x: number; // percentage 0-100
  y: number; // percentage 0-100
  w: number; // percentage 0-100
  h: number; // percentage 0-100
  content: string; // static text or variable like {{studentName}}
  fontSize?: number;
  fontWeight?: string;
  color?: string;
  textAlign?: "left" | "center" | "right";
  bgColor?: string;
  borderRadius?: number;
  locked?: boolean; // cannot be deleted (QR, studentName)
}

export interface CardDesign {
  bgColor: string;
  headerBg: string;
  headerHeight: number; // percentage
  elements: CardElement[];
}

export const VARIABLES = [
  { key: "{{studentName}}", label: "Student Name" },
  { key: "{{studentCode}}", label: "Student Code" },
  { key: "{{enrolledDate}}", label: "Enrolled Date" },
  { key: "{{teacherName}}", label: "Teacher Name" },
  { key: "{{subject}}", label: "Subject" },
  { key: "{{grade}}", label: "Grade" },
] as const;

export const CARD_W = 450;
export const CARD_H = 284;

let _id = 0;
const uid = () => `el_${Date.now()}_${++_id}`;

export const DEFAULT_DESIGN: CardDesign = {
  bgColor: "#ffffff",
  headerBg: "linear-gradient(135deg, #4F46E5, #3730A3)",
  headerHeight: 17,
  elements: [
    { id: uid(), type: "text", label: "Title", x: 3.5, y: 2, w: 60, h: 8, content: "Nexora", fontSize: 16, fontWeight: "700", color: "#ffffff", locked: false },
    { id: uid(), type: "text", label: "Subtitle", x: 3.5, y: 9, w: 60, h: 5, content: "Student Identity Card", fontSize: 9, fontWeight: "600", color: "rgba(255,255,255,0.7)", locked: false },
    { id: uid(), type: "shape", label: "Logo", x: 87, y: 2.5, w: 9, h: 12, content: "N", fontSize: 14, fontWeight: "900", color: "#ffffff", bgColor: "rgba(255,255,255,0.2)", borderRadius: 8, locked: false },
    { id: uid(), type: "text", label: "Name Label", x: 3.5, y: 21, w: 55, h: 4, content: "Student Name", fontSize: 8, fontWeight: "600", color: "#94a3b8", locked: false },
    { id: uid(), type: "text", label: "Student Name", x: 3.5, y: 25, w: 55, h: 9, content: "{{studentName}}", fontSize: 17, fontWeight: "700", color: "#1e293b", locked: true },
    { id: uid(), type: "text", label: "ID Label", x: 3.5, y: 40, w: 27, h: 4, content: "Student ID", fontSize: 8, fontWeight: "600", color: "#94a3b8", locked: false },
    { id: uid(), type: "text", label: "Student ID", x: 3.5, y: 44, w: 27, h: 6, content: "{{studentCode}}", fontSize: 12, fontWeight: "700", color: "#4F46E5", locked: false },
    { id: uid(), type: "text", label: "Enrolled Label", x: 33, y: 40, w: 27, h: 4, content: "Enrolled", fontSize: 8, fontWeight: "600", color: "#94a3b8", locked: false },
    { id: uid(), type: "text", label: "Enrolled Date", x: 33, y: 44, w: 27, h: 6, content: "{{enrolledDate}}", fontSize: 12, fontWeight: "600", color: "#334155", locked: false },
    { id: uid(), type: "text", label: "Teacher Label", x: 3.5, y: 55, w: 27, h: 4, content: "Teacher", fontSize: 8, fontWeight: "600", color: "#94a3b8", locked: false },
    { id: uid(), type: "text", label: "Teacher Name", x: 3.5, y: 59, w: 27, h: 6, content: "{{teacherName}}", fontSize: 12, fontWeight: "600", color: "#334155", locked: false },
    { id: uid(), type: "text", label: "Subject Label", x: 33, y: 55, w: 27, h: 4, content: "Subject", fontSize: 8, fontWeight: "600", color: "#94a3b8", locked: false },
    { id: uid(), type: "text", label: "Subject", x: 33, y: 59, w: 27, h: 6, content: "{{subject}}", fontSize: 12, fontWeight: "600", color: "#334155", locked: false },
    { id: uid(), type: "qr", label: "QR Code", x: 64, y: 20, w: 33, h: 55, content: "qr", fontSize: 0, color: "#111827", locked: true },
    { id: uid(), type: "text", label: "QR Label", x: 64, y: 76, w: 33, h: 4, content: "Scan for attendance", fontSize: 7, fontWeight: "400", color: "#94a3b8", textAlign: "center", locked: false },
    { id: uid(), type: "text", label: "Footer Left", x: 2, y: 90, w: 55, h: 5, content: "Valid throughout student's enrollment", fontSize: 7, fontWeight: "400", color: "#94a3b8", locked: false },
    { id: uid(), type: "text", label: "Footer Right", x: 60, y: 90, w: 38, h: 5, content: "nexora.app", fontSize: 7, fontWeight: "600", color: "#94a3b8", textAlign: "right", locked: false },
  ],
};
