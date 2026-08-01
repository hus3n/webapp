export const HAFALAN_STATUSES = ["lancar", "kurang_lancar", "tidak_lancar"] as const;
export type HafalanStatus = (typeof HAFALAN_STATUSES)[number];

export function tanggalToDate(value: string): Date {
  return new Date(`${value}T00:00:00`);
}

export function isFutureTanggal(value: string): boolean {
  return tanggalToDate(value).getTime() > Date.now();
}
