import { NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { requireRole } from "@/lib/auth/rbac";
import { hashPassword } from "@/lib/auth/password";
import { logAudit } from "@/lib/db/audit";

const registerSchema = z.object({
  email: z.string().email("Email tidak valid"),
  password: z.string().min(8, "Password minimal 8 karakter"),
  nama: z.string().min(1, "Nama wajib diisi"),
  whatsappNumber: z
    .string()
    .regex(/^62\d{8,14}$/, "Nomor WhatsApp harus format 62xxxxxxxxxx")
    .optional(),
});

export async function POST(req: Request) {
  const { user, error } = await requireRole("admin", "superadmin");
  if (error) return error;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body tidak valid" }, { status: 400 });
  }

  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Input tidak valid" },
      { status: 400 }
    );
  }

  const email = parsed.data.email.toLowerCase();
  const existing = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);
  if (existing.length > 0) {
    return NextResponse.json(
      { error: "Email sudah terdaftar" },
      { status: 409 }
    );
  }

  if (parsed.data.whatsappNumber) {
    const waExists = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.whatsappNumber, parsed.data.whatsappNumber))
      .limit(1);
    if (waExists.length > 0) {
      return NextResponse.json(
        { error: "Nomor WhatsApp sudah digunakan" },
        { status: 409 }
      );
    }
  }

  const [created] = await db
    .insert(users)
    .values({
      email,
      passwordHash: hashPassword(parsed.data.password),
      nama: parsed.data.nama,
      role: "guru",
      whatsappNumber: parsed.data.whatsappNumber ?? null,
      status: "active",
      createdBy: user!.id,
    })
    .returning();

  await logAudit({
    userId: user!.id,
    action: "register_guru",
    tableName: "users",
    recordId: created.id,
    newData: { email, nama: created.nama, role: created.role },
  });

  const pub = {
    id: created.id,
    email: created.email,
    nama: created.nama,
    role: created.role,
    whatsappNumber: created.whatsappNumber,
    status: created.status,
    createdAt: created.createdAt,
  };
  return NextResponse.json({ user: pub }, { status: 201 });
}
