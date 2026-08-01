import { NextResponse } from "next/server";
import { z } from "zod";
import { and, eq, ne } from "drizzle-orm";
import { db } from "@/lib/db";
import { santri, kelas, kelasGuru } from "@/lib/db/schema";
import { requireRole } from "@/lib/auth/rbac";
import { logAudit } from "@/lib/db/audit";
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

const updateSchema = z.object({
  nama: z.string().min(1, "Nama santri wajib diisi").optional(),
  nis: z.string().min(1, "NIS wajib diisi").optional(),
  kelasId: z.string().min(1, "Kelas wajib diisi").optional(),
  kontakWali: z.string().optional(),
  whatsappNumber: z.string().optional(),
});

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const { user, error } = await requireRole("admin", "superadmin");
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
    .from(santri)
    .where(eq(santri.id, params.id))
    .limit(1);
  if (!target) {
    return NextResponse.json({ error: "Santri tidak ditemukan" }, { status: 404 });
  }

  if (!(await canAccessKelas(current, target.kelasId))) {
    return NextResponse.json(
      { error: "Anda tidak memiliki akses ke santri ini" },
      { status: 403 }
    );
  }

  if (parsed.data.kelasId && parsed.data.kelasId !== target.kelasId) {
    if (!(await canAccessKelas(current, parsed.data.kelasId))) {
      return NextResponse.json(
        { error: "Anda tidak memiliki akses ke kelas tujuan" },
        { status: 403 }
      );
    }
  }

  if (parsed.data.nis && parsed.data.nis !== target.nis) {
    const dup = await db
      .select({ id: santri.id })
      .from(santri)
      .where(and(eq(santri.nis, parsed.data.nis), ne(santri.id, target.id)))
      .limit(1);
    if (dup.length > 0) {
      return NextResponse.json({ error: "NIS sudah terdaftar" }, { status: 409 });
    }
  }

  const update: Partial<typeof target> = {};
  if (parsed.data.nama !== undefined) update.nama = parsed.data.nama;
  if (parsed.data.nis !== undefined) update.nis = parsed.data.nis;
  if (parsed.data.kelasId !== undefined) update.kelasId = parsed.data.kelasId;
  if (parsed.data.kontakWali !== undefined)
    update.kontakWali = parsed.data.kontakWali;
  if (parsed.data.whatsappNumber !== undefined)
    update.whatsappNumber = parsed.data.whatsappNumber;

  const [updated] = await db
    .update(santri)
    .set(update)
    .where(eq(santri.id, params.id))
    .returning();

  await logAudit({
    userId: current.id,
    action: "update",
    tableName: "santri",
    recordId: updated.id,
    oldData: { nama: target.nama, nis: target.nis, kelasId: target.kelasId },
    newData: { nama: updated.nama, nis: updated.nis, kelasId: updated.kelasId },
  });

  return NextResponse.json({ santri: updated });
}
