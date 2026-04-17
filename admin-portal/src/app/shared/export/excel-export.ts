import ExcelJS from 'exceljs';
import { triggerDownload } from './csv-export';

export type ExcelColumn = { header: string; key: string };

/** Genera un libro con una hoja y descarga `.xlsx`. */
export async function downloadExcelRows(
  filename: string,
  sheetName: string,
  columns: ExcelColumn[],
  rows: Record<string, unknown>[],
): Promise<void> {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet(sheetName.slice(0, 31) || 'Datos');
  ws.addRow(columns.map((c) => c.header));
  for (const row of rows) {
    ws.addRow(columns.map((c) => row[c.key] ?? ''));
  }
  const buf = await wb.xlsx.writeBuffer();
  const blob = new Blob([buf], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  triggerDownload(blob, filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`);
}
