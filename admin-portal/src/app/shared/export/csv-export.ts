export type CsvColumn<T extends Record<string, unknown>> = { key: keyof T & string; header: string };

function escapeCell(value: unknown, separator: string): string {
  const s = value == null ? '' : String(value);
  if (s.includes('"') || s.includes('\n') || s.includes(separator)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

/** Descarga CSV en el navegador (UTF-8). */
export function downloadCsv<T extends Record<string, unknown>>(
  filename: string,
  rows: T[],
  columns: CsvColumn<T>[],
  separator = ';',
): void {
  const header = columns.map((c) => escapeCell(c.header, separator)).join(separator);
  const lines = rows.map((row) =>
    columns.map((c) => escapeCell(row[c.key], separator)).join(separator),
  );
  const blob = new Blob([header + '\n' + lines.join('\n')], {
    type: 'text/csv;charset=utf-8;',
  });
  triggerDownload(blob, filename.endsWith('.csv') ? filename : `${filename}.csv`);
}

function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export { triggerDownload };
