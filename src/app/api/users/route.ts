import { NextResponse } from "next/server";
import { z } from "zod";
import { and, desc, eq, or, type SQL } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { requireRole } from "@/lib/auth/rbac";
import { hashPassword } from "@/lib/auth/password";
import { logAudit } from "@/lib/db/audit";

const publicCols = {
  id: users.id,
  email: users.email,
  nama: users.nama,
  role: users.role,
  whatsappNumber: users.whatsappNumber,
  status: users.status,
  createdAt: users.createdAt,
};

const createSchema = z.object({
  email: z.string().email("Email tidak valid"),
  password: z.string().min(8, "Password minimal 8 karakter"),
  nama: z.string().min(1, "Nama wajib diisi"),
  whatsappNumber: z.string().optional(),
});

const VALID_ROLES = ["guru", "admin", "superadmin"] as const;

export async function GET(req: Request) {
  const { user, error } = await requireRole("admin", "superadmin");
  if (error) return error;
  const current = user!;

  const { searchParams } = new URL(req.url);
  const roleFilter = searchParams.get("role") as
    | (typeof VALID_ROLES)[number]
    | null;

  let base: SQL | undefined;
  if (current.role === "superadmin") {
    base = undefined;
  } else {
    base = or(eq(users.role, "guru"), eq(users.id, current.id));
  }

  let where: SQL | undefined = base;
  if (roleFilter && VALID_ROLES.includes(roleFilter)) {
    const roleCond = eq(users.role, roleFilter);
    where = base ? and(base, roleCond) : roleCond;
  }

  const query = db.select(publicCols).from(users);
  const rows = where
    ? await query.where(where).orderBy(desc(users.createdAt))
    : await query.orderBy(desc(users.createdAt));

  return NextResponse.json({ users: rows });
}

export async function POST(req: Request) {
  const { user, error } = await requireRole("superadmin");
  if (error) return error;

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
      role: "admin",
      whatsappNumber: parsed.data.whatsappNumber ?? null,
      status: "active",
      createdBy: user!.id,
    })
    .returning();

  await logAudit({
    userId: user!.id,
    action: "create",
    tableName: "users",
    recordId: created.id,
    newData: {
      email: created.email,
      nama: created.nama,
      role: created.role,
    },
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
