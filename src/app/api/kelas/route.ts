import { NextResponse } from "next/server";
import { z } from "zod";
import { and, desc, eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { kelas, kelasGuru, users } from "@/lib/db/schema";
import { requireRole } from "@/lib/auth/rbac";
import { logAudit } from "@/lib/db/audit";

const createSchema = z.object({
  namaKelas: z.string().min(1, "Nama kelas wajib diisi"),
  guruIds: z.array(z.string().min(1)).optional(),
});

export async function GET(req: Request) {
  const { user, error } = await requireRole("guru", "admin", "superadmin");
  if (error) return error;
  const current = user!;

  const { searchParams } = new URL(req.url);
  const namaFilter = searchParams.get("q");

  const rows = await db
    .select({
      id: kelas.id,
      namaKelas: kelas.namaKelas,
      adminId: kelas.adminId,
      createdAt: kelas.createdAt,
    })
    .from(kelas)
    .orderBy(desc(kelas.createdAt));

  let filtered = rows;
  if (current.role === "admin") {
    filtered = rows.filter((k) => k.adminId === current.id);
  } else if (current.role === "guru") {
    const assignments = await db
      .select({ kelasId: kelasGuru.kelasId })
      .from(kelasGuru)
      .where(eq(kelasGuru.guruId, current.id));
    const ids = new Set(assignments.map((a) => a.kelasId));
    filtered = rows.filter((k) => ids.has(k.id));
  }

  if (namaFilter) {
    const q = namaFilter.toLowerCase();
    filtered = filtered.filter((k) => k.namaKelas.toLowerCase().includes(q));
  }

  const ids = filtered.map((k) => k.id);
  const guruRows = ids.length
    ? await db
        .select({
          kelasId: kelasGuru.kelasId,
          id: users.id,
          nama: users.nama,
          email: users.email,
        })
        .from(kelasGuru)
        .innerJoin(users, eq(kelasGuru.guruId, users.id))
        .where(inArray(kelasGuru.kelasId, ids))
    : [];

  const gurusByKelas = new Map<string, { id: string; nama: string; email: string }[]>();
  for (const g of guruRows) {
    const list = gurusByKelas.get(g.kelasId) ?? [];
    list.push({ id: g.id, nama: g.nama, email: g.email });
    gurusByKelas.set(g.kelasId, list);
  }

  const result = filtered.map((k) => ({
    ...k,
    gurus: gurusByKelas.get(k.id) ?? [],
  }));

  return NextResponse.json({ kelas: result });
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

  const guruIds = parsed.data.guruIds ?? [];
  if (guruIds.length > 0) {
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

  const [created] = await db
    .insert(kelas)
    .values({
      namaKelas: parsed.data.namaKelas,
      adminId: current.id,
    })
    .returning();

  if (guruIds.length > 0) {
    await db.insert(kelasGuru).values(
      guruIds.map((guruId) => ({ kelasId: created.id, guruId }))
    );
  }

  await logAudit({
    userId: current.id,
    action: "create",
    tableName: "kelas",
    recordId: created.id,
    newData: { namaKelas: created.namaKelas, guruIds },
  });

  const gurus = guruIds.length
    ? await db
        .select({ id: users.id, nama: users.nama, email: users.email })
        .from(users)
        .where(inArray(users.id, guruIds))
    : [];

  return NextResponse.json(
    { kelas: { ...created, gurus } },
    { status: 201 }
  );
}
