import { CardDesign, CardElement, CARD_W, CARD_H } from "./types";

interface StudentData {
  studentName: string;
  studentCode: string;
  enrolledDate: string;
  teacherName: string;
  subject: string;
  grade: string;
}

const resolve = (content: string, data: StudentData) =>
  content
    .replace(/\{\{studentName\}\}/g, data.studentName)
    .replace(/\{\{studentCode\}\}/g, data.studentCode)
    .replace(/\{\{enrolledDate\}\}/g, data.enrolledDate)
    .replace(/\{\{teacherName\}\}/g, data.teacherName)
    .replace(/\{\{subject\}\}/g, data.subject)
    .replace(/\{\{grade\}\}/g, data.grade);

export { resolve as resolveContent };

export function renderCardHtml(design: CardDesign, data: StudentData, qrUrl: string): string {
  const els = renderCardElements(design, data, qrUrl);

  return `<div style="position:relative;width:85.6mm;height:54mm;background:${design.bgColor};overflow:hidden;border:1px solid #e2e8f0;page-break-after:always;page-break-inside:avoid;font-family:'Inter',sans-serif;letter-spacing:-0.01em;">
<div style="position:absolute;top:0;left:0;right:0;height:${design.headerHeight}%;background:${design.headerBg};"></div>
${els}
</div>`;
}

export function renderCardInnerHtml(design: CardDesign, data: StudentData, qrUrl: string): string {
  const els = renderCardElements(design, data, qrUrl);
  return `<div style="position:absolute;top:0;left:0;right:0;height:${design.headerHeight}%;background:${design.headerBg};"></div>
${els}`;
}

function renderCardElements(design: CardDesign, data: StudentData, qrUrl: string): string {
  return design.elements.map((el) => {
    const style = `position:absolute;left:${el.x}%;top:${el.y}%;width:${el.w}%;height:${el.h}%;`;

    if (el.type === "qr") {
      return `<div style="${style}display:flex;align-items:center;justify-content:center;"><div style="width:100%;height:100%;background:#fff;border:2px solid #f1f5f9;border-radius:10px;padding:3px;display:flex;align-items:center;justify-content:center;"><img src="${qrUrl}" style="width:100%;height:100%;display:block;" /></div></div>`;
    }

    if (el.type === "shape") {
      return `<div style="${style}background:${el.bgColor || "#4F46E5"};border-radius:${el.borderRadius || 0}px;display:flex;align-items:center;justify-content:center;overflow:hidden;padding:0 4px;"><span style="font-size:${el.fontSize}px;font-weight:${el.fontWeight};color:${el.color};white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:100%;display:block;text-align:center;">${resolve(el.content, data)}</span></div>`;
    }

    return `<div style="${style}font-size:${el.fontSize}px;font-weight:${el.fontWeight};color:${el.color};text-align:${el.textAlign || "left"};line-height:1.3;display:flex;align-items:center;overflow:hidden;white-space:nowrap;text-overflow:ellipsis;"><span style="width:100%;text-align:${el.textAlign || "left"};overflow:hidden;white-space:nowrap;text-overflow:ellipsis;">${resolve(el.content, data)}</span></div>`;
  }).join("\n");
}

export function renderCardPrintStyles(): string {
  return `<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
<style>
@page { size: 85.6mm 54mm; margin: 0; }
* { margin: 0; padding: 0; box-sizing: border-box; font-family: 'Inter', sans-serif; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; color-adjust: exact !important; }
body { background: #fff; }
</style>`;
}
