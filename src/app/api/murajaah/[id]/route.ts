import { NextResponse } from "next/server";
import { z } from "zod";
import { and, eq, isNull } from "drizzle-orm";
import { db } from "@/lib/db";
import { jadwalMurajaah, hafalan, santri, kelas, kelasGuru } from "@/lib/db/schema";
import { requireRole } from "@/lib/auth/rbac";
import { logAudit } from "@/lib/db/audit";
import type { SessionUser } from "@/lib/auth/session";

const updateSchema = z.object({
  status: z.enum(["pending", "completed", "missed"]),
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
    .select({
      id: jadwalMurajaah.id,
      hafalanId: jadwalMurajaah.hafalanId,
      santriId: hafalan.santriId,
      status: jadwalMurajaah.status,
    })
    .from(jadwalMurajaah)
    .innerJoin(hafalan, eq(jadwalMurajaah.hafalanId, hafalan.id))
    .where(
      and(eq(jadwalMurajaah.id, params.id), isNull(hafalan.deletedAt))
    )
    .limit(1);
  if (!target) {
    return NextResponse.json(
      { error: "Jadwal murajaah tidak ditemukan" },
      { status: 404 }
    );
  }

  const hasAccess = await canAccessSantri(current, target.santriId);
  if (!hasAccess) {
    return NextResponse.json(
      { error: "Anda tidak memiliki akses ke jadwal ini" },
      { status: 403 }
    );
  }

  const isCompleted = parsed.data.status === "completed";

  const [updated] = await db
    .update(jadwalMurajaah)
    .set({
      status: parsed.data.status,
      completedAt: isCompleted ? new Date() : null,
    })
    .where(eq(jadwalMurajaah.id, params.id))
    .returning();

  await logAudit({
    userId: current.id,
    action: "update",
    tableName: "jadwal_murajaah",
    recordId: updated.id,
    oldData: { status: target.status, hafalanId: target.hafalanId },
    newData: { status: updated.status, hafalanId: updated.hafalanId },
  });

  return NextResponse.json({ murajaah: updated });
}
