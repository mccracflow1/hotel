import autoTable from 'jspdf-autotable';
import { jsPDF } from 'jspdf';

export type PdfColumn = { header: string; key: string };

/** Tabla compacta en PDF (A4 vertical). */
export function downloadPdfTable(
  filename: string,
  title: string,
  columns: PdfColumn[],
  rows: Record<string, unknown>[],
): void {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  doc.setFontSize(14);
  doc.text(title, 14, 16);
  autoTable(doc, {
    startY: 22,
    head: [columns.map((c) => c.header)],
    body: rows.map((r) => columns.map((c) => String(r[c.key] ?? ''))),
    styles: { fontSize: 8 },
    headStyles: { fillColor: [66, 66, 66] },
  });
  doc.save(filename.endsWith('.pdf') ? filename : `${filename}.pdf`);
}
