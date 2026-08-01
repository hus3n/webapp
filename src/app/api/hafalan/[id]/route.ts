import { NextResponse } from "next/server";
import { z } from "zod";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { hafalan, santri, kelas, kelasGuru } from "@/lib/db/schema";
import { requireRole } from "@/lib/auth/rbac";
import { logAudit } from "@/lib/db/audit";
import type { SessionUser } from "@/lib/auth/session";
import { HAFALAN_STATUSES, isFutureTanggal, tanggalToDate } from "@/lib/hafalan";

const EDIT_WINDOW_MS = 24 * 60 * 60 * 1000;

const updateSchema = z.object({
  tanggal: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Format tanggal YYYY-MM-DD")
    .optional(),
  surah: z
    .number()
    .int("Surah harus bilangan bulat")
    .min(1, "Surah minimal 1")
    .max(114, "Surah maksimal 114")
    .optional(),
  ayatStart: z
    .number()
    .int("Ayat awal harus bilangan bulat")
    .min(1, "Ayat awal minimal 1")
    .optional(),
  ayatEnd: z
    .number()
    .int("Ayat akhir harus bilangan bulat")
    .min(1, "Ayat akhir minimal 1")
    .optional(),
  status: z.enum(HAFALAN_STATUSES).optional(),
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

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const { user, error } = await requireRole("guru", "admin", "superadmin");
  if (error) return error;
  const current = user!;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body tidak valid" }, { status: 400 });
  }

  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Input tidak valid" },
      { status: 400 }
    );
  }

  const [target] = await db
    .select()
    .from(hafalan)
    .where(eq(hafalan.id, params.id))
    .limit(1);
  if (!target || target.deletedAt) {
    return NextResponse.json({ error: "Hafalan tidak ditemukan" }, { status: 404 });
  }

  const windowOk = Date.now() - target.createdAt.getTime() <= EDIT_WINDOW_MS;
  if (!windowOk) {
    return NextResponse.json(
      { error: "Masa edit 24 jam sudah lewat" },
      { status: 400 }
    );
  }

  if (current.role === "guru") {
    if (target.guruId !== current.id) {
      return NextResponse.json(
        { error: "Anda hanya bisa mengedit hafalan milik Anda" },
        { status: 403 }
      );
    }
  } else if (current.role === "admin") {
    const hasAccess = await canAccessSantri(current, target.santriId);
    if (!hasAccess) {
      return NextResponse.json(
        { error: "Anda tidak memiliki akses ke hafalan ini" },
        { status: 403 }
      );
    }
  }

  const { data } = parsed;
  if (data.tanggal && isFutureTanggal(data.tanggal)) {
    return NextResponse.json(
      { error: "Tanggal tidak boleh di masa depan" },
      { status: 400 }
    );
  }

  const ayatStart = data.ayatStart ?? target.ayatStart;
  const ayatEnd = data.ayatEnd ?? target.ayatEnd;
  if (ayatEnd < ayatStart) {
    return NextResponse.json(
      { error: "Ayat akhir tidak boleh lebih kecil dari ayat awal" },
      { status: 400 }
    );
  }

  const update: Partial<typeof target> = {};
  if (data.tanggal !== undefined) update.tanggal = tanggalToDate(data.tanggal);
  if (data.surah !== undefined) update.surah = data.surah;
  if (data.ayatStart !== undefined) update.ayatStart = data.ayatStart;
  if (data.ayatEnd !== undefined) update.ayatEnd = data.ayatEnd;
  if (data.status !== undefined) update.status = data.status;
  if (data.catatan !== undefined) update.catatan = data.catatan;
  update.updatedAt = new Date();

  const [updated] = await db
    .update(hafalan)
    .set(update)
    .where(eq(hafalan.id, params.id))
    .returning();

  await logAudit({
    userId: current.id,
    action: "update",
    tableName: "hafalan",
    recordId: updated.id,
    oldData: {
      surah: target.surah,
      ayatStart: target.ayatStart,
      ayatEnd: target.ayatEnd,
      status: target.status,
    },
    newData: {
      surah: updated.surah,
      ayatStart: updated.ayatStart,
      ayatEnd: updated.ayatEnd,
      status: updated.status,
    },
  });

  return NextResponse.json({ hafalan: updated });
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const { user, error } = await requireRole("guru", "admin", "superadmin");
  if (error) return error;
  const current = user!;

  const [target] = await db
    .select()
    .from(hafalan)
    .where(eq(hafalan.id, params.id))
    .limit(1);
  if (!target || target.deletedAt) {
    return NextResponse.json({ error: "Hafalan tidak ditemukan" }, { status: 404 });
  }

  if (current.role === "guru") {
    if (target.guruId !== current.id) {
      return NextResponse.json(
        { error: "Anda hanya bisa menghapus hafalan milik Anda" },
        { status: 403 }
      );
    }
  } else if (current.role === "admin") {
    const hasAccess = await canAccessSantri(current, target.santriId);
    if (!hasAccess) {
      return NextResponse.json(
        { error: "Anda tidak memiliki akses ke hafalan ini" },
        { status: 403 }
      );
    }
  }

  await db
    .update(hafalan)
    .set({ deletedAt: new Date(), updatedAt: new Date() })
    .where(eq(hafalan.id, params.id));

  await logAudit({
    userId: current.id,
    action: "delete",
    tableName: "hafalan",
    recordId: target.id,
    oldData: {
      santriId: target.santriId,
      surah: target.surah,
      ayatStart: target.ayatStart,
      ayatEnd: target.ayatEnd,
    },
  });

  return NextResponse.json({ ok: true });
}
