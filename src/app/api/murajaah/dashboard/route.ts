import { NextResponse } from "next/server";
import {
  and,
  asc,
  count,
  desc,
  eq,
  gte,
  inArray,
  isNull,
  lt,
  sql,
  type SQL,
} from "drizzle-orm";
import { db } from "@/lib/db";
import {
  jadwalMurajaah,
  hafalan,
  santri,
  kelas,
  kelasGuru,
  users,
} from "@/lib/db/schema";
import { requireRole } from "@/lib/auth/rbac";

const EMPTY = {
  stats: {
    total: 0,
    pending: 0,
    completed: 0,
    missed: 0,
    completionRate: 0,
  },
  perGuru: [],
  perKelas: [],
  upcoming: [],
};

export async function GET(req: Request) {
  const { user, error } = await requireRole("admin", "superadmin");
  if (error) return error;
  const current = user!;

  const { searchParams } = new URL(req.url);
  const guruIdFilter = searchParams.get("guruId");
  const kelasIdFilter = searchParams.get("kelasId");
  const month = searchParams.get("month");

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
  if (kelasIdFilter) conditions.push(eq(santri.kelasId, kelasIdFilter));
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
  if (month) {
    const match = /^(\d{4})-(\d{2})$/.exec(month);
    if (!match) {
      return NextResponse.json(
        { error: "Format bulan YYYY-MM" },
        { status: 400 }
      );
    }
    const year = Number(match[1]);
    const m = Number(match[2]);
    if (m < 1 || m > 12) {
      return NextResponse.json(
        { error: "Format bulan YYYY-MM" },
        { status: 400 }
      );
    }
    conditions.push(
      gte(jadwalMurajaah.tanggalMurajaah, new Date(year, m - 1, 1))
    );
    conditions.push(
      lt(jadwalMurajaah.tanggalMurajaah, new Date(year, m, 1))
    );
  }

  const where = and(...conditions);

  const [{ total, completed, missed, pending }] = await db
    .select({
      total: count(),
      completed: sql<number>`sum(case when ${jadwalMurajaah.status} = 'completed' then 1 else 0 end)`,
      missed: sql<number>`sum(case when ${jadwalMurajaah.status} = 'missed' then 1 else 0 end)`,
      pending: sql<number>`sum(case when ${jadwalMurajaah.status} = 'pending' then 1 else 0 end)`,
    })
    .from(jadwalMurajaah)
    .innerJoin(hafalan, eq(jadwalMurajaah.hafalanId, hafalan.id))
    .innerJoin(santri, eq(hafalan.santriId, santri.id))
    .where(where);

  const decided = completed + missed;
  const completionRate = decided > 0 ? Math.round((completed / decided) * 100) : 0;

  const perGuru = await db
    .select({
      guruId: hafalan.guruId,
      guruNama: users.nama,
      total: count(),
      completed: sql<number>`sum(case when ${jadwalMurajaah.status} = 'completed' then 1 else 0 end)`,
      missed: sql<number>`sum(case when ${jadwalMurajaah.status} = 'missed' then 1 else 0 end)`,
      pending: sql<number>`sum(case when ${jadwalMurajaah.status} = 'pending' then 1 else 0 end)`,
    })
    .from(jadwalMurajaah)
    .innerJoin(hafalan, eq(jadwalMurajaah.hafalanId, hafalan.id))
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
      completed: sql<number>`sum(case when ${jadwalMurajaah.status} = 'completed' then 1 else 0 end)`,
      missed: sql<number>`sum(case when ${jadwalMurajaah.status} = 'missed' then 1 else 0 end)`,
      pending: sql<number>`sum(case when ${jadwalMurajaah.status} = 'pending' then 1 else 0 end)`,
    })
    .from(jadwalMurajaah)
    .innerJoin(hafalan, eq(jadwalMurajaah.hafalanId, hafalan.id))
    .innerJoin(santri, eq(hafalan.santriId, santri.id))
    .innerJoin(kelas, eq(santri.kelasId, kelas.id))
    .where(where)
    .groupBy(santri.kelasId, kelas.namaKelas)
    .orderBy(desc(count()));

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const upcoming = await db
    .select({
      id: jadwalMurajaah.id,
      tanggalMurajaah: jadwalMurajaah.tanggalMurajaah,
      santriNama: santri.nama,
      santriNis: santri.nis,
      kelasNama: kelas.namaKelas,
      guruNama: users.nama,
      surah: hafalan.surah,
      ayatStart: hafalan.ayatStart,
      ayatEnd: hafalan.ayatEnd,
    })
    .from(jadwalMurajaah)
    .innerJoin(hafalan, eq(jadwalMurajaah.hafalanId, hafalan.id))
    .innerJoin(santri, eq(hafalan.santriId, santri.id))
    .innerJoin(kelas, eq(santri.kelasId, kelas.id))
    .innerJoin(users, eq(hafalan.guruId, users.id))
    .where(
      and(
        ...conditions,
        eq(jadwalMurajaah.status, "pending"),
        gte(jadwalMurajaah.tanggalMurajaah, today)
      )
    )
    .orderBy(asc(jadwalMurajaah.tanggalMurajaah))
    .limit(10);

  return NextResponse.json({
    stats: {
      total,
      pending,
      completed,
      missed,
      completionRate,
    },
    perGuru,
    perKelas,
    upcoming,
  });
}
