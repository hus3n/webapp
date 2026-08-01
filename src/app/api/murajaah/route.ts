import { NextResponse } from "next/server";
import { and, asc, desc, eq, gte, inArray, isNull, type SQL } from "drizzle-orm";
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
import type { SessionUser } from "@/lib/auth/session";

const MURAJAJA_STATUSES = ["pending", "completed", "missed"] as const;

async function allowedKelasFor(user: SessionUser): Promise<string[] | null> {
  if (user.role === "superadmin") return null;
  if (user.role === "admin") {
    const rows = await db
      .select({ id: kelas.id })
      .from(kelas)
      .where(eq(kelas.adminId, user.id));
    return rows.map((r) => r.id);
  }
  const rows = await db
    .select({ kelasId: kelasGuru.kelasId })
    .from(kelasGuru)
    .where(eq(kelasGuru.guruId, user.id));
  return rows.map((r) => r.kelasId);
}

export async function GET(req: Request) {
  const { user, error } = await requireRole("guru", "admin", "superadmin");
  if (error) return error;
  const current = user!;

  const { searchParams } = new URL(req.url);
  const statusFilter = searchParams.get("status") as
    | (typeof MURAJAJA_STATUSES)[number]
    | null;
  const santriId = searchParams.get("santriId");
  const guruIdFilter = searchParams.get("guruId");
  const kelasIdFilter = searchParams.get("kelasId");
  const upcoming = searchParams.get("upcoming") === "true";

  const allowedKelasIds = await allowedKelasFor(current);

  if (kelasIdFilter && allowedKelasIds && !allowedKelasIds.includes(kelasIdFilter)) {
    return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
  }

  const conditions: SQL[] = [isNull(hafalan.deletedAt)];
  if (statusFilter && MURAJAJA_STATUSES.includes(statusFilter)) {
    conditions.push(eq(jadwalMurajaah.status, statusFilter));
  }
  if (santriId) conditions.push(eq(hafalan.santriId, santriId));
  if (guruIdFilter && current.role !== "guru") {
    conditions.push(eq(hafalan.guruId, guruIdFilter));
  }
  if (kelasIdFilter) conditions.push(eq(santri.kelasId, kelasIdFilter));
  if (allowedKelasIds !== null) {
    if (allowedKelasIds.length === 0) {
      return NextResponse.json({ murajaah: [] });
    }
    conditions.push(inArray(santri.kelasId, allowedKelasIds));
  }
  if (upcoming) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    conditions.push(gte(jadwalMurajaah.tanggalMurajaah, today));
  }

  const rows = await db
    .select({
      id: jadwalMurajaah.id,
      hafalanId: jadwalMurajaah.hafalanId,
      tanggalMurajaah: jadwalMurajaah.tanggalMurajaah,
      status: jadwalMurajaah.status,
      completedAt: jadwalMurajaah.completedAt,
      santriId: hafalan.santriId,
      santriNama: santri.nama,
      santriNis: santri.nis,
      kelasId: santri.kelasId,
      kelasNama: kelas.namaKelas,
      guruId: hafalan.guruId,
      guruNama: users.nama,
      surah: hafalan.surah,
      ayatStart: hafalan.ayatStart,
      ayatEnd: hafalan.ayatEnd,
      hafalanTanggal: hafalan.tanggal,
    })
    .from(jadwalMurajaah)
    .innerJoin(hafalan, eq(jadwalMurajaah.hafalanId, hafalan.id))
    .innerJoin(santri, eq(hafalan.santriId, santri.id))
    .innerJoin(kelas, eq(santri.kelasId, kelas.id))
    .innerJoin(users, eq(hafalan.guruId, users.id))
    .where(and(...conditions))
    .orderBy(
      upcoming
        ? asc(jadwalMurajaah.tanggalMurajaah)
        : desc(jadwalMurajaah.tanggalMurajaah)
    );

  return NextResponse.json({ murajaah: rows });
}
