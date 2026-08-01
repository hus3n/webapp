import { NextResponse } from "next/server";
import { z } from "zod";
import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { kelas, kelasGuru, users } from "@/lib/db/schema";
import { requireRole } from "@/lib/auth/rbac";
import { logAudit } from "@/lib/db/audit";

const updateSchema = z.object({
  namaKelas: z.string().min(1, "Nama kelas wajib diisi").optional(),
  guruIds: z.array(z.string().min(1)).optional(),
});

type Guru = { id: string; nama: string; email: string };

async function fetchGurus(kelasId: string, guruIds?: string[]): Promise<Guru[]> {
  if (guruIds !== undefined) {
    if (guruIds.length === 0) return [];
    return db
      .select({ id: users.id, nama: users.nama, email: users.email })
      .from(users)
      .where(inArray(users.id, guruIds));
  }
  return db
    .select({ id: users.id, nama: users.nama, email: users.email })
    .from(kelasGuru)
    .innerJoin(users, eq(kelasGuru.guruId, users.id))
    .where(eq(kelasGuru.kelasId, kelasId));
}

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
    .from(kelas)
    .where(eq(kelas.id, params.id))
    .limit(1);
  if (!target) {
    return NextResponse.json({ error: "Kelas tidak ditemukan" }, { status: 404 });
  }

  if (current.role === "admin" && target.adminId !== current.id) {
    return NextResponse.json(
      { error: "Anda tidak memiliki akses ke kelas ini" },
      { status: 403 }
    );
  }

  const guruIds = parsed.data.guruIds;
  if (guruIds !== undefined && guruIds.length > 0) {
    const valid = await db
      .select({ id: users.id })
      .from(users)
      .where(
        and(
          inArray(users.id, guruIds),
          eq(users.role, "guru"),
          eq(users.status, "active")
        )
      );
    if (valid.length !== guruIds.length) {
      return NextResponse.json(
        { error: "Salah satu guru tidak valid" },
        { status: 400 }
      );
    }
  }

  if (parsed.data.namaKelas !== undefined) {
    await db
      .update(kelas)
      .set({ namaKelas: parsed.data.namaKelas })
      .where(eq(kelas.id, params.id));
  }

  if (guruIds !== undefined) {
    await db.delete(kelasGuru).where(eq(kelasGuru.kelasId, params.id));
    if (guruIds.length > 0) {
      await db.insert(kelasGuru).values(
        guruIds.map((guruId) => ({ kelasId: params.id, guruId }))
      );
    }
  }

  const gurus = await fetchGurus(params.id, guruIds);

  await logAudit({
    userId: current.id,
    action: "update",
    tableName: "kelas",
    recordId: target.id,
    oldData: { namaKelas: target.namaKelas },
    newData: {
      ...(parsed.data.namaKelas !== undefined
        ? { namaKelas: parsed.data.namaKelas }
        : {}),
      ...(guruIds !== undefined ? { guruIds } : {}),
    },
  });

  const [updated] = await db
    .select({
      id: kelas.id,
      namaKelas: kelas.namaKelas,
      adminId: kelas.adminId,
      createdAt: kelas.createdAt,
    })
    .from(kelas)
    .where(eq(kelas.id, params.id))
    .limit(1);

  return NextResponse.json({ kelas: { ...updated, gurus } });
}
