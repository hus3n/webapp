import { NextResponse } from "next/server";
import { z } from "zod";
import { and, desc, eq, inArray, isNull, type SQL } from "drizzle-orm";
import { db } from "@/lib/db";
import { hafalan, santri, kelas, kelasGuru, users } from "@/lib/db/schema";
import { requireRole } from "@/lib/auth/rbac";
import { logAudit } from "@/lib/db/audit";
import type { SessionUser } from "@/lib/auth/session";
import { HAFALAN_STATUSES, isFutureTanggal, tanggalToDate } from "@/lib/hafalan";
import { generateMurajaahForHafalan } from "@/lib/murajaah/generator";

const createSchema = z.object({
  santriId: z.string().min(1, "Santri wajib dipilih"),
  tanggal: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Format tanggal YYYY-MM-DD"),
  surah: z
    .number()
    .int("Surah harus bilangan bulat")
    .min(1, "Surah minimal 1")
    .max(114, "Surah maksimal 114"),
  ayatStart: z.number().int("Ayat awal harus bilangan bulat").min(1, "Ayat awal minimal 1"),
  ayatEnd: z.number().int("Ayat akhir harus bilangan bulat").min(1, "Ayat akhir minimal 1"),
  status: z.enum(HAFALAN_STATUSES),
  catatan: z.string().optional(),
});

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

async function canAccessSantri(
  user: SessionUser,
  santriId: string
): Promise<boolean> {
  const [s] = await db
    .select({ kelasId: santri.kelasId })
    .from(santri)
    .where(eq(santri.id, santriId))
    .limit(1);
  if (!s) return false;
  return canAccessKelas(user, s.kelasId);
}

export async function GET(req: Request) {
  const { user, error } = await requireRole("guru", "admin", "superadmin");
  if (error) return error;
  const current = user!;

  const { searchParams } = new URL(req.url);
  const santriId = searchParams.get("santriId");
  const guruIdFilter = searchParams.get("guruId");
  const statusFilter = searchParams.get(
    "status"
  ) as (typeof HAFALAN_STATUSES)[number] | null;

  let allowedKelasIds: string[] | null = null;
  if (current.role === "admin") {
    const rows = await db
      .select({ id: kelas.id })
      .from(kelas)
      .where(eq(kelas.adminId, current.id));
    allowedKelasIds = rows.map((r) => r.id);
  } else if (current.role === "guru") {
    const rows = await db
      .select({ kelasId: kelasGuru.kelasId })
      .from(kelasGuru)
      .where(eq(kelasGuru.guruId, current.id));
    allowedKelasIds = rows.map((r) => r.kelasId);
  }

  const conditions: SQL[] = [isNull(hafalan.deletedAt)];
  if (santriId) conditions.push(eq(hafalan.santriId, santriId));
  if (guruIdFilter && current.role !== "guru") {
    conditions.push(eq(hafalan.guruId, guruIdFilter));
  }
  if (statusFilter && HAFALAN_STATUSES.includes(statusFilter)) {
    conditions.push(eq(hafalan.status, statusFilter));
  }
  if (allowedKelasIds !== null) {
    if (allowedKelasIds.length === 0) {
      return NextResponse.json({ hafalan: [] });
    }
    conditions.push(inArray(santri.kelasId, allowedKelasIds));
  }

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
    .where(and(...conditions))
    .orderBy(desc(hafalan.tanggal), desc(hafalan.createdAt));

  return NextResponse.json({ hafalan: rows });
}

export async function POST(req: Request) {
  const { user, error } = await requireRole("guru", "admin", "superadmin");
  if (error) return error;
  const current = user!;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body tidak valid" }, { status: 400 });
  }

  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Input tidak valid" },
      { status: 400 }
    );
  }

  const { data } = parsed;
  if (data.ayatEnd < data.ayatStart) {
    return NextResponse.json(
      { error: "Ayat akhir tidak boleh lebih kecil dari ayat awal" },
      { status: 400 }
    );
  }
  if (isFutureTanggal(data.tanggal)) {
    return NextResponse.json(
      { error: "Tanggal tidak boleh di masa depan" },
      { status: 400 }
    );
  }

  const hasAccess = await canAccessSantri(current, data.santriId);
  if (!hasAccess) {
    return NextResponse.json(
      { error: "Anda tidak memiliki akses ke santri ini" },
      { status: 403 }
    );
  }

  const [created] = await db
    .insert(hafalan)
    .values({
      santriId: data.santriId,
      guruId: current.id,
      tanggal: tanggalToDate(data.tanggal),
      surah: data.surah,
      ayatStart: data.ayatStart,
      ayatEnd: data.ayatEnd,
      status: data.status,
      catatan: data.catatan ?? null,
    })
    .returning();

  await logAudit({
    userId: current.id,
    action: "create",
    tableName: "hafalan",
    recordId: created.id,
    newData: {
      santriId: created.santriId,
      surah: created.surah,
      ayatStart: created.ayatStart,
      ayatEnd: created.ayatEnd,
    },
  });

  try {
    await generateMurajaahForHafalan({
      id: created.id,
      santriId: created.santriId,
      tanggal: created.tanggal,
    });
  } catch (err) {
    console.error("Gagal generate jadwal murajaah:", err);
  }

  return NextResponse.json({ hafalan: created }, { status: 201 });
}
