/** Minimal CSV helpers for admin exports. */

export function escapeCsvCell(value: string | number | boolean | null | undefined): string {
  if (value == null) {
    return "";
  }

  const text = String(value);
  if (/[",\n\r]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

export function rowsToCsv(
  headers: string[],
  rows: Array<Array<string | number | boolean | null | undefined>>
): string {
  const lines = [
    headers.map(escapeCsvCell).join(","),
    ...rows.map((row) => row.map(escapeCsvCell).join(",")),
  ];
  // BOM helps Excel open UTF-8 correctly
  return `\uFEFF${lines.join("\r\n")}\r\n`;
}

export function csvDownloadResponse(
  filename: string,
  csv: string
): Response {
  const safeName = filename.replace(/[^\w.\-]+/g, "_").slice(0, 120) || "export.csv";
  return new Response(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${safeName}"`,
      "Cache-Control": "no-store",
    },
  });
}
