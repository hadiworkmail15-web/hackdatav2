import type { GeneratedTable, Row } from '@/types/generation';
import type { Invoice, BankStatement } from '@/types/documents';

function escapeCSV(value: unknown): string {
  const str = value === null || value === undefined ? '' : String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function rowsToCSV(rows: Row[], columns: string[]): string {
  const header = columns.map(escapeCSV).join(',');
  const body = rows
    .map((row) => columns.map((c) => escapeCSV(row[c])).join(','))
    .join('\n');
  return `${header}\n${body}`;
}

export function tableToCSV(table: GeneratedTable): string {
  const columns = table.schema.columns.map((c) => c.name);
  return rowsToCSV(table.rows, columns);
}

export function tablesToCSVMap(tables: GeneratedTable[]): Map<string, string> {
  const map = new Map<string, string>();
  for (const table of tables) {
    map.set(table.schema.name, tableToCSV(table));
  }
  return map;
}

export function rowsToJSON(rows: Row[]): string {
  return JSON.stringify(rows, null, 2);
}

export function tablesToJSON(tables: GeneratedTable[]): string {
  const obj: Record<string, Row[]> = {};
  for (const table of tables) {
    obj[table.schema.name] = table.rows;
  }
  return JSON.stringify(obj, null, 2);
}

export function invoiceToJSON(invoice: Invoice): string {
  return JSON.stringify(invoice, null, 2);
}

export function bankStatementToJSON(statement: BankStatement): string {
  return JSON.stringify(statement, null, 2);
}

/**
 * Minimal ZIP builder for relational CSV export.
 * Creates a valid ZIP archive containing multiple CSV files using STORE method (no compression).
 */
export function buildZip(files: Map<string, string>): Blob {
  const encoder = new TextEncoder();
  const chunks: Uint8Array[] = [];
  const centralDir: Uint8Array[] = [];
  let offset = 0;

  for (const [name, content] of files) {
    const nameBytes = encoder.encode(name);
    const dataBytes = encoder.encode(content);
    const crc = crc32(dataBytes);

    // Local file header
    const localHeader = new Uint8Array(30 + nameBytes.length);
    const dv = new DataView(localHeader.buffer);
    dv.setUint32(0, 0x04034b50, true); // signature
    dv.setUint16(4, 20, true); // version
    dv.setUint16(6, 0, true); // flags
    dv.setUint16(8, 0, true); // compression: store
    dv.setUint16(10, 0, true); // mod time
    dv.setUint16(12, 0, true); // mod date
    dv.setUint32(14, crc, true); // crc32
    dv.setUint32(18, dataBytes.length, true); // compressed size
    dv.setUint32(22, dataBytes.length, true); // uncompressed size
    dv.setUint16(26, nameBytes.length, true);
    dv.setUint16(28, 0, true);
    localHeader.set(nameBytes, 30);

    // Central directory header
    const cdHeader = new Uint8Array(46 + nameBytes.length);
    const cdv = new DataView(cdHeader.buffer);
    cdv.setUint32(0, 0x02014b50, true);
    cdv.setUint16(4, 20, true); // version made by
    cdv.setUint16(6, 20, true); // version needed
    cdv.setUint16(8, 0, true);
    cdv.setUint16(10, 0, true);
    cdv.setUint16(12, 0, true);
    cdv.setUint16(14, 0, true);
    cdv.setUint32(16, crc, true);
    cdv.setUint32(20, dataBytes.length, true);
    cdv.setUint32(24, dataBytes.length, true);
    cdv.setUint16(28, nameBytes.length, true);
    cdv.setUint16(30, 0, true);
    cdv.setUint16(32, 0, true);
    cdv.setUint16(34, 0, true);
    cdv.setUint16(36, 0, true);
    cdv.setUint32(38, 0, true);
    cdv.setUint32(42, offset, true); // local header offset
    cdHeader.set(nameBytes, 46);

    chunks.push(localHeader, dataBytes);
    centralDir.push(cdHeader);
    offset += localHeader.length + dataBytes.length;
  }

  let cdSize = 0;
  for (const cd of centralDir) cdSize += cd.length;

  // End of central directory
  const eocd = new Uint8Array(22);
  const edv = new DataView(eocd.buffer);
  edv.setUint32(0, 0x06054b50, true);
  edv.setUint16(4, 0, true);
  edv.setUint16(6, 0, true);
  edv.setUint16(8, files.size, true);
  edv.setUint16(10, files.size, true);
  edv.setUint32(12, cdSize, true);
  edv.setUint32(16, offset, true);
  edv.setUint16(20, 0, true);

  return new Blob([...chunks, ...centralDir, eocd], { type: 'application/zip' });
}

function crc32(data: Uint8Array): number {
  let crc = 0xffffffff;
  for (let i = 0; i < data.length; i++) {
    crc ^= data[i];
    for (let j = 0; j < 8; j++) {
      crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 100);
}

export function downloadText(content: string, filename: string, mime: string): void {
  const blob = new Blob([content], { type: mime });
  downloadBlob(blob, filename);
}
