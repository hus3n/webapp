import { NextResponse } from "next/server";
import { z } from "zod";
import { and, desc, eq, inArray, like, or, type SQL } from "drizzle-orm";
import { db } from "@/lib/db";
import { santri, kelas, kelasGuru } from "@/lib/db/schema";
import { requireRole } from "@/lib/auth/rbac";
import { logAudit } from "@/lib/db/audit";
import type { SessionUser } from "@/lib/auth/session";

const santriCols = {
  id: santri.id,
  nama: santri.nama,
  nis: santri.nis,
  kelasId: santri.kelasId,
  kontakWali: santri.kontakWali,
  whatsappNumber: santri.whatsappNumber,
  createdAt: santri.createdAt,
};

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

const createSchema = z.object({
  nama: z.string().min(1, "Nama santri wajib diisi"),
  nis: z.string().min(1, "NIS wajib diisi"),
  kelasId: z.string().min(1, "Kelas wajib diisi"),
  kontakWali: z.string().optional(),
  whatsappNumber: z.string().optional(),
});

export async function GET(req: Request) {
  const { user, error } = await requireRole("guru", "admin", "superadmin");
  if (error) return error;
  const current = user!;

  const { searchParams } = new URL(req.url);
  const kelasIdFilter = searchParams.get("kelasId");
  const q = searchParams.get("q");

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

  const conditions: SQL[] = [];
  if (kelasIdFilter) conditions.push(eq(santri.kelasId, kelasIdFilter));
  if (q) {
    const pattern = `%${q}%`;
    conditions.push(
      or(like(santri.nama, pattern), like(santri.nis, pattern)) as SQL
    );
  }
  if (allowedKelasIds !== null) {
    if (allowedKelasIds.length === 0) {
      return NextResponse.json({ santri: [] });
    }
    conditions.push(inArray(santri.kelasId, allowedKelasIds));
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;
  const rows = where
    ? await db
        .select(santriCols)
        .from(santri)
        .where(where)
        .orderBy(desc(santri.createdAt))
    : await db.select(santriCols).from(santri).orderBy(desc(santri.createdAt));

  const kelasIds = [...new Set(rows.map((r) => r.kelasId))];
  const kelasRows = kelasIds.length
    ? await db
        .select({ id: kelas.id, namaKelas: kelas.namaKelas })
        .from(kelas)
        .where(inArray(kelas.id, kelasIds))
    : [];
  const kelasNameById = new Map(kelasRows.map((k) => [k.id, k.namaKelas]));

  // Fetch latest hafalan and next upcoming murajaah for each santri
  const santriIds = rows.map((r) => r.id);
  const { isNull } = await import("drizzle-orm");
  const { hafalan, jadwalMurajaah } = await import("@/lib/db/schema");
  const { getSurahName } = await import("@/lib/surah");

  const allHafalan = santriIds.length > 0
    ? await db
        .select({
          id: hafalan.id,
          santriId: hafalan.santriId,
          surah: hafalan.surah,
          ayatStart: hafalan.ayatStart,
          ayatEnd: hafalan.ayatEnd,
          status: hafalan.status,
          catatan: hafalan.catatan,
          tanggal: hafalan.tanggal,
        })
        .from(hafalan)
        .where(and(inArray(hafalan.santriId, santriIds), isNull(hafalan.deletedAt)))
        .orderBy(desc(hafalan.tanggal))
    : [];

  const latestHafalanBySantri = new Map<string, {
    surah: number;
    surahNama: string;
    ayatStart: number;
    ayatEnd: number;
    status: string;
    catatan: string | null;
    tanggal: string;
  }>();

  for (const h of allHafalan) {
    if (!latestHafalanBySantri.has(h.santriId)) {
      const tglStr = h.tanggal instanceof Date
        ? h.tanggal.toISOString().slice(0, 10)
        : String(h.tanggal).slice(0, 10);
      latestHafalanBySantri.set(h.santriId, {
        surah: h.surah,
        surahNama: getSurahName(h.surah),
        ayatStart: h.ayatStart,
        ayatEnd: h.ayatEnd,
        status: h.status,
        catatan: h.catatan,
        tanggal: tglStr,
      });
    }
  }

  const allMurajaah = santriIds.length > 0
    ? await db
        .select({
          id: jadwalMurajaah.id,
          santriId: hafalan.santriId,
          tanggalMurajaah: jadwalMurajaah.tanggalMurajaah,
          surah: hafalan.surah,
          ayatStart: hafalan.ayatStart,
          ayatEnd: hafalan.ayatEnd,
          status: jadwalMurajaah.status,
        })
        .from(jadwalMurajaah)
        .innerJoin(hafalan, eq(jadwalMurajaah.hafalanId, hafalan.id))
        .where(
          and(
            inArray(hafalan.santriId, santriIds),
            eq(jadwalMurajaah.status, "pending"),
            isNull(hafalan.deletedAt)
          )
        )
        .orderBy(jadwalMurajaah.tanggalMurajaah)
    : [];

  const nextMurajaahBySantri = new Map<string, {
    tanggalMurajaah: string;
    surah: number;
    surahNama: string;
    ayatStart: number;
    ayatEnd: number;
    status: string;
  }>();

  for (const m of allMurajaah) {
    if (!nextMurajaahBySantri.has(m.santriId)) {
      const tglStr = m.tanggalMurajaah instanceof Date
        ? m.tanggalMurajaah.toISOString().slice(0, 10)
        : String(m.tanggalMurajaah).slice(0, 10);
      nextMurajaahBySantri.set(m.santriId, {
        tanggalMurajaah: tglStr,
        surah: m.surah,
        surahNama: getSurahName(m.surah),
        ayatStart: m.ayatStart,
        ayatEnd: m.ayatEnd,
        status: m.status,
      });
    }
  }

  const result = rows.map((r) => ({
    ...r,
    kelasNama: kelasNameById.get(r.kelasId) ?? null,
    latestHafalan: latestHafalanBySantri.get(r.id) ?? null,
    nextMurajaah: nextMurajaahBySantri.get(r.id) ?? null,
  }));

  return NextResponse.json({ santri: result });
}

export async function POST(req: Request) {
  const { user, error } = await requireRole("admin", "superadmin");
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

  const hasAccess = await canAccessKelas(current, parsed.data.kelasId);
  if (!hasAccess) {
    return NextResponse.json(
      { error: "Anda tidak memiliki akses ke kelas ini" },
      { status: 403 }
    );
  }

  const existing = await db
    .select({ id: santri.id })
    .from(santri)
    .where(eq(santri.nis, parsed.data.nis))
    .limit(1);
  if (existing.length > 0) {
    return NextResponse.json({ error: "NIS sudah terdaftar" }, { status: 409 });
  }

  const [created] = await db
    .insert(santri)
    .values({
      nama: parsed.data.nama,
      nis: parsed.data.nis,
      kelasId: parsed.data.kelasId,
      kontakWali: parsed.data.kontakWali ?? null,
      whatsappNumber: parsed.data.whatsappNumber ?? null,
    })
    .returning();

  await logAudit({
    userId: current.id,
    action: "create",
    tableName: "santri",
    recordId: created.id,
    newData: { nama: created.nama, nis: created.nis, kelasId: created.kelasId },
  });

  return NextResponse.json({ santri: created }, { status: 201 });
}
