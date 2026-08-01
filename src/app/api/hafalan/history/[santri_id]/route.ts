import { NextResponse } from "next/server";
import { and, count, desc, eq, isNull } from "drizzle-orm";
import { db } from "@/lib/db";
import { hafalan, santri, kelas, kelasGuru, users } from "@/lib/db/schema";
import { requireRole } from "@/lib/auth/rbac";
import type { SessionUser } from "@/lib/auth/session";

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
  { params }: { params: { santri_id: string } }
) {
  const { user, error } = await requireRole("guru", "admin", "superadmin");
  if (error) return error;
  const current = user!;

  const { searchParams } = new URL(req.url);
  const rawPage = Number(searchParams.get("page") ?? 1);
  const rawLimit = Number(searchParams.get("limit") ?? 20);
  const page = Number.isFinite(rawPage) && rawPage > 0 ? Math.floor(rawPage) : 1;
  const limit =
    Number.isFinite(rawLimit) && rawLimit > 0
      ? Math.min(100, Math.floor(rawLimit))
      : 20;

  const [s] = await db
    .select({ kelasId: santri.kelasId })
    .from(santri)
    .where(eq(santri.id, params.santri_id))
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

  const where = and(
    isNull(hafalan.deletedAt),
    eq(hafalan.santriId, params.santri_id)
  );

  const [{ total }] = await db
    .select({ total: count() })
    .from(hafalan)
    .where(where);
  const totalPages = Math.ceil(total / limit) || 1;

  const rows = await db
    .select({
      id: hafalan.id,
      santriId: hafalan.santriId,
      guruId: hafalan.guruId,
      tanggal: hafalan.tanggal,
      surah: hafalan.surah,
      ayatStart: hafalan.ayatStart,
      ayatEnd: hafalan.ayatEnd,
      status: hafalan.status,
      catatan: hafalan.catatan,
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
    .orderBy(desc(hafalan.tanggal), desc(hafalan.createdAt))
    .limit(limit)
    .offset((page - 1) * limit);

  return NextResponse.json({
    hafalan: rows,
    pagination: { page, limit, total, totalPages },
  });
}
