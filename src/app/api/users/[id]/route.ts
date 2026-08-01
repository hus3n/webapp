import { NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users, sessions } from "@/lib/db/schema";
import { requireRole } from "@/lib/auth/rbac";
import { logAudit } from "@/lib/db/audit";

const updateSchema = z.object({
  nama: z.string().min(1, "Nama wajib diisi").optional(),
  whatsappNumber: z.string().optional(),
  status: z.enum(["active", "inactive"]).optional(),
  role: z.enum(["guru", "admin", "superadmin"]).optional(),
  email: z.string().email("Email tidak valid").optional(),
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
    .from(users)
    .where(eq(users.id, params.id))
    .limit(1);
  if (!target) {
    return NextResponse.json({ error: "User tidak ditemukan" }, { status: 404 });
  }

  if (current.role === "admin") {
    if (target.role !== "guru") {
      return NextResponse.json(
        { error: "Admin hanya bisa mengubah data guru" },
        { status: 403 }
      );
    }
    if (parsed.data.role && parsed.data.role !== "guru") {
      return NextResponse.json(
        { error: "Admin tidak bisa mengubah role guru" },
        { status: 403 }
      );
    }
  }
  if (target.role === "superadmin" && current.role !== "superadmin") {
    return NextResponse.json(
      { error: "Tidak bisa mengubah superadmin" },
      { status: 403 }
    );
  }

  const update: Partial<typeof target> = {};
  if (parsed.data.nama !== undefined) update.nama = parsed.data.nama;
  if (parsed.data.whatsappNumber !== undefined)
    update.whatsappNumber = parsed.data.whatsappNumber;
  if (parsed.data.status !== undefined) update.status = parsed.data.status;
  if (parsed.data.email !== undefined)
    update.email = parsed.data.email.toLowerCase();
  if (parsed.data.role !== undefined && current.role === "superadmin")
    update.role = parsed.data.role;
  update.updatedAt = new Date();

  const [updated] = await db
    .update(users)
    .set(update)
    .where(eq(users.id, params.id))
    .returning();

  await logAudit({
    userId: current.id,
    action: "update",
    tableName: "users",
    recordId: updated.id,
    oldData: {
      nama: target.nama,
      status: target.status,
      role: target.role,
      email: target.email,
    },
    newData: {
      nama: updated.nama,
      status: updated.status,
      role: updated.role,
      email: updated.email,
    },
  });

  const pub = {
    id: updated.id,
    email: updated.email,
    nama: updated.nama,
    role: updated.role,
    whatsappNumber: updated.whatsappNumber,
    status: updated.status,
    createdAt: updated.createdAt,
  };
  return NextResponse.json({ user: pub });
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const { user, error } = await requireRole("superadmin");
  if (error) return error;

  const [target] = await db
    .select({ id: users.id, nama: users.nama })
    .from(users)
    .where(eq(users.id, params.id))
    .limit(1);
  if (!target) {
    return NextResponse.json({ error: "User tidak ditemukan" }, { status: 404 });
  }
  if (target.id === user!.id) {
    return NextResponse.json(
      { error: "Tidak bisa menonaktifkan akun sendiri" },
      { status: 400 }
    );
  }

  await db
    .update(users)
    .set({ status: "inactive", updatedAt: new Date() })
    .where(eq(users.id, params.id));
  await db.delete(sessions).where(eq(sessions.userId, params.id));

  await logAudit({
    userId: user!.id,
    action: "delete",
    tableName: "users",
    recordId: target.id,
    oldData: { nama: target.nama },
  });

  return NextResponse.json({ ok: true });
}
