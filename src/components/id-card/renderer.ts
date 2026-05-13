import { CardDesign, CardElement, CARD_W, CARD_H } from "./types";

interface StudentData {
  studentName: string;
  studentCode: string;
  enrolledDate: string;
  teacherName: string;
  subject: string;
  grade: string;
}

const decodeHtml = (str: string): string =>
  str.replace(/&amp;/g, "&")
     .replace(/&quot;/g, '"')
     .replace(/&#39;/g, "'")
     .replace(/&lt;/g, "<")
     .replace(/&gt;/g, ">");

const resolve = (content: string, data: StudentData) =>
  content
    .replace(/\{\{studentName\}\}/g, decodeHtml(data.studentName))
    .replace(/\{\{studentCode\}\}/g, decodeHtml(data.studentCode))
    .replace(/\{\{enrolledDate\}\}/g, decodeHtml(data.enrolledDate))
    .replace(/\{\{teacherName\}\}/g, decodeHtml(data.teacherName))
    .replace(/\{\{subject\}\}/g, decodeHtml(data.subject))
    .replace(/\{\{grade\}\}/g, decodeHtml(data.grade));

export { resolve as resolveContent };

export function renderCardHtml(design: CardDesign, data: StudentData, qrUrl: string): string {
  const els = renderCardElements(design, data, qrUrl);
  return `<div style="position:relative;width:85.6mm;height:54mm;background:${design.bgColor};overflow:hidden;border:1px solid #e2e8f0;page-break-inside:avoid;font-family:'Inter',sans-serif;letter-spacing:-0.01em;">
<div style="position:absolute;top:0;left:0;right:0;height:${design.headerHeight}%;background:${design.headerBg};"></div>
${els}
</div>`;
}

export function renderBulkCardsHtml(design: CardDesign, students: { data: StudentData; qrUrl: string }[]): string {
  const cards = students.map(({ data, qrUrl }) => renderCardHtml(design, data, qrUrl)).join("\n");
  return `<div style="display:grid;grid-template-columns:repeat(2,85.6mm);gap:4mm;">${cards}</div>`;
}

export function renderCardInnerHtml(design: CardDesign, data: StudentData, qrUrl: string): string {
  const els = renderCardElements(design, data, qrUrl);
  return `<div style="position:absolute;top:0;left:0;right:0;height:${design.headerHeight}%;background:${design.headerBg};"></div>
${els}`;
}

function renderCardElements(design: CardDesign, data: StudentData, qrUrl: string): string {
  return design.elements.map((el) => {
    const style = `position:absolute;left:${el.x}%;top:${el.y}%;width:${el.w}%;height:${el.h}%;`;
    const fontSizePt = el.fontSize ? `${(el.fontSize * 0.75).toFixed(1)}pt` : "8pt";

    if (el.type === "qr") {
      return `<div style="${style}display:flex;align-items:center;justify-content:center;"><div style="width:100%;height:100%;background:#fff;border:2px solid #f1f5f9;border-radius:10px;padding:3px;display:flex;align-items:center;justify-content:center;"><img src="${qrUrl}" style="width:100%;height:100%;display:block;" /></div></div>`;
    }

    if (el.type === "shape") {
      return `<div style="${style}background:${el.bgColor || "#4F46E5"};border-radius:${el.borderRadius || 0}px;display:flex;align-items:center;justify-content:center;overflow:hidden;padding:0 4px;"><span style="font-size:${fontSizePt};font-weight:${el.fontWeight};color:${el.color};max-width:100%;display:block;text-align:center;">${resolve(el.content, data)}</span></div>`;
    }

    return `<div style="${style}font-size:${fontSizePt};font-weight:${el.fontWeight};color:${el.color};text-align:${el.textAlign || "left"};line-height:1.2;"><span style="width:100%;text-align:${el.textAlign || "left"}">${resolve(el.content, data)}</span></div>`;
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

export function renderBulkCardPrintStyles(): string {
  return `<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
<style>
@page { size: A4 portrait; margin: 8mm; }
* { margin: 0; padding: 0; box-sizing: border-box; font-family: 'Inter', sans-serif; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; color-adjust: exact !important; }
body { background: #fff; }
</style>`;
}
