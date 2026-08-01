export function convertToCSV<T extends Record<string, unknown>>(
  data: T[],
  headers: Array<{ key: keyof T; label: string }>
): string {
  if (!data || data.length === 0) {
    return headers.map((h) => `"${h.label}"`).join(",") + "\n";
  }

  const headerRow = headers.map((h) => `"${h.label}"`).join(",");
  const rows = data.map((item) =>
    headers
      .map((h) => {
        const raw = item[h.key];
        let valStr = "";
        if (raw !== null && raw !== undefined) {
          if (raw instanceof Date) {
            valStr = raw.toISOString().slice(0, 10);
          } else {
            valStr = String(raw).replace(/"/g, '""');
          }
        }
        return `"${valStr}"`;
      })
      .join(",")
  );

  return [headerRow, ...rows].join("\n");
}
