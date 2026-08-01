import { and, eq, isNull } from "drizzle-orm";
import { db } from "@/lib/db";
import { hafalan, jadwalMurajaah } from "@/lib/db/schema";

const DEFAULT_INTERVALS = [3, 7, 14, 30];

export function getMurajaahIntervals(): number[] {
  const raw = process.env.MURAJAAH_INTERVALS ?? "3,7,14,30";
  const intervals = raw
    .split(",")
    .map((s) => Number(s.trim()))
    .filter((n) => Number.isInteger(n) && n > 0);
  return intervals.length > 0 ? [...new Set(intervals)].sort((a, b) => a - b) : DEFAULT_INTERVALS;
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export type HafalanRow = {
  id: string;
  santriId: string;
  tanggal: Date;
};

export async function generateMurajaahForHafalan(
  hafalanRow: HafalanRow
): Promise<void> {
  const intervals = getMurajaahIntervals();
  if (intervals.length === 0) return;

  const existing = await db
    .select({ tanggalMurajaah: jadwalMurajaah.tanggalMurajaah })
    .from(jadwalMurajaah)
    .innerJoin(hafalan, eq(jadwalMurajaah.hafalanId, hafalan.id))
    .where(
      and(
        eq(hafalan.santriId, hafalanRow.santriId),
        eq(jadwalMurajaah.status, "pending"),
        isNull(hafalan.deletedAt)
      )
    );

  const busy = new Set<number>(
    existing.map((e) => startOfDay(e.tanggalMurajaah).getTime())
  );

  const base = startOfDay(hafalanRow.tanggal);
  const values: { hafalanId: string; tanggalMurajaah: Date }[] = [];

  for (const interval of intervals) {
    const date = new Date(base);
    date.setDate(date.getDate() + interval);

    let guard = 0;
    while (busy.has(date.getTime()) && guard < 60) {
      date.setDate(date.getDate() + 1);
      guard += 1;
    }
    busy.add(date.getTime());
    values.push({ hafalanId: hafalanRow.id, tanggalMurajaah: date });
  }

  if (values.length > 0) {
    await db.insert(jadwalMurajaah).values(values);
  }
}
