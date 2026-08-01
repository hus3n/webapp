import { NextResponse } from "next/server";
import { and, desc, eq, isNull, type SQL } from "drizzle-orm";
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

async function canAccessKelas(
  user: SessionUser,
  kelasId: string
): Promise<boolean> {
  if (user.role === "superadmin") return true;
  if (user.role === "admin") {
    const rows = await db
      .select({ id: kelas.id })
      .from(kelas)
      .where(and(eq(kelas.id, kelasId), eq(kelas.adminId, user.id)))
      .limit(1);
    return rows.length > 0;
  }
  const rows = await db
    .select({ id: kelasGuru.id })
    .from(kelasGuru)
    .where(and(eq(kelasGuru.kelasId, kelasId), eq(kelasGuru.guruId, user.id)))
    .limit(1);
  return rows.length > 0;
}

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  const { user, error } = await requireRole("guru", "admin", "superadmin");
  if (error) return error;
  const current = user!;

  const [s] = await db
    .select({ kelasId: santri.kelasId })
    .from(santri)
    .where(eq(santri.id, params.id))
    .limit(1);
  if (!s) {
    return NextResponse.json({ error: "Santri tidak ditemukan" }, { status: 404 });
  }

  const hasAccess = await canAccessKelas(current, s.kelasId);
  if (!hasAccess) {
    return NextResponse.json(
      { error: "Anda tidak memiliki akses ke santri ini" },
      { status: 403 }
    );
  }

  const { searchParams } = new URL(req.url);
  const statusFilter = searchParams.get("status") as
    | (typeof MURAJAJA_STATUSES)[number]
    | null;

  const conditions: SQL[] = [
    isNull(hafalan.deletedAt),
    eq(hafalan.santriId, params.id),
  ];
  if (statusFilter && MURAJAJA_STATUSES.includes(statusFilter)) {
    conditions.push(eq(jadwalMurajaah.status, statusFilter));
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
    .orderBy(desc(jadwalMurajaah.tanggalMurajaah));

  return NextResponse.json({ murajaah: rows });
}
