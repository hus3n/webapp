import { NextResponse } from "next/server";
import {
  and,
  count,
  countDistinct,
  desc,
  eq,
  inArray,
  isNull,
  sql,
  type SQL,
} from "drizzle-orm";
import { db } from "@/lib/db";
import { hafalan, santri, kelas, kelasGuru, users } from "@/lib/db/schema";
import { requireRole } from "@/lib/auth/rbac";
import type { HafalanStatus } from "@/lib/hafalan";

const EMPTY = {
  stats: {
    totalHafalan: 0,
    totalSantri: 0,
    totalSurah: 0,
    totalAyat: 0,
    statusBreakdown: {
      lancar: 0,
      kurang_lancar: 0,
      tidak_lancar: 0,
    },
  },
  perGuru: [],
  perKelas: [],
  recent: [],
};

export async function GET(req: Request) {
  const { user, error } = await requireRole("admin", "superadmin");
  if (error) return error;
  const current = user!;

  const { searchParams } = new URL(req.url);
  const guruIdFilter = searchParams.get("guruId");
  const kelasIdFilter = searchParams.get("kelasId");

  let allowedKelasIds: string[] | null = null;
  if (current.role === "admin") {
    const rows = await db
      .select({ id: kelas.id })
      .from(kelas)
      .where(eq(kelas.adminId, current.id));
    allowedKelasIds = rows.map((r) => r.id);
  }

  if (
    current.role === "admin" &&
    kelasIdFilter &&
    allowedKelasIds &&
    !allowedKelasIds.includes(kelasIdFilter)
  ) {
    return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
  }

  const conditions: SQL[] = [isNull(hafalan.deletedAt)];
  if (kelasIdFilter) {
    conditions.push(eq(santri.kelasId, kelasIdFilter));
  }
  if (allowedKelasIds !== null) {
    if (allowedKelasIds.length === 0) {
      return NextResponse.json(EMPTY);
    }
    conditions.push(inArray(santri.kelasId, allowedKelasIds));
  }
  if (guruIdFilter) {
    if (current.role === "admin" && allowedKelasIds) {
      const assigned = await db
        .select({ id: kelasGuru.id })
        .from(kelasGuru)
        .where(
          and(
            eq(kelasGuru.guruId, guruIdFilter),
            inArray(kelasGuru.kelasId, allowedKelasIds)
          )
        )
        .limit(1);
      if (assigned.length === 0) {
        return NextResponse.json(EMPTY);
      }
    }
    conditions.push(eq(hafalan.guruId, guruIdFilter));
  }

  const where = and(...conditions);

  const [{ totalHafalan }] = await db
    .select({ totalHafalan: count() })
    .from(hafalan)
    .innerJoin(santri, eq(hafalan.santriId, santri.id))
    .where(where);

  const [{ totalSantri }] = await db
    .select({ totalSantri: countDistinct(hafalan.santriId) })
    .from(hafalan)
    .innerJoin(santri, eq(hafalan.santriId, santri.id))
    .where(where);

  const [{ totalSurah }] = await db
    .select({ totalSurah: countDistinct(hafalan.surah) })
    .from(hafalan)
    .innerJoin(santri, eq(hafalan.santriId, santri.id))
    .where(where);

  const [{ totalAyat }] = await db
    .select({
      totalAyat: sql<number>`sum(${hafalan.ayatEnd} - ${hafalan.ayatStart} + 1)`,
    })
    .from(hafalan)
    .innerJoin(santri, eq(hafalan.santriId, santri.id))
    .where(where);

  const statusRows = await db
    .select({
      status: hafalan.status,
      value: count(),
    })
    .from(hafalan)
    .innerJoin(santri, eq(hafalan.santriId, santri.id))
    .where(where)
    .groupBy(hafalan.status);

  const statusBreakdown: Record<HafalanStatus, number> = {
    lancar: 0,
    kurang_lancar: 0,
    tidak_lancar: 0,
  };
  for (const row of statusRows) {
    statusBreakdown[row.status] = row.value;
  }

  const perGuru = await db
    .select({
      guruId: hafalan.guruId,
      guruNama: users.nama,
      total: count(),
    })
    .from(hafalan)
    .innerJoin(santri, eq(hafalan.santriId, santri.id))
    .innerJoin(users, eq(hafalan.guruId, users.id))
    .where(where)
    .groupBy(hafalan.guruId, users.nama)
    .orderBy(desc(count()));

  const perKelas = await db
    .select({
      kelasId: santri.kelasId,
      kelasNama: kelas.namaKelas,
      total: count(),
    })
    .from(hafalan)
    .innerJoin(santri, eq(hafalan.santriId, santri.id))
    .innerJoin(kelas, eq(santri.kelasId, kelas.id))
    .where(where)
    .groupBy(santri.kelasId, kelas.namaKelas)
    .orderBy(desc(count()));

  const recent = await db
    .select({
      id: hafalan.id,
      santriId: hafalan.santriId,
      guruId: hafalan.guruId,
      tanggal: hafalan.tanggal,
      surah: hafalan.surah,
      ayatStart: hafalan.ayatStart,
      ayatEnd: hafalan.ayatEnd,
      status: hafalan.status,
      createdAt: hafalan.createdAt,
      santriNama: santri.nama,
      santriNis: santri.nis,
      guruNama: users.nama,
      kelasNama: kelas.namaKelas,
    })
    .from(hafalan)
    .innerJoin(santri, eq(hafalan.santriId, santri.id))
    .innerJoin(kelas, eq(santri.kelasId, kelas.id))
    .innerJoin(users, eq(hafalan.guruId, users.id))
    .where(where)
    .orderBy(desc(hafalan.createdAt))
    .limit(10);

  return NextResponse.json({
    stats: {
      totalHafalan,
      totalSantri,
      totalSurah,
      totalAyat,
      statusBreakdown,
    },
    perGuru,
    perKelas,
    recent,
  });
}
