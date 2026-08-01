import { NextResponse } from "next/server";
import { desc, eq, gt } from "drizzle-orm";
import { db } from "@/lib/db";
import { sessions, users } from "@/lib/db/schema";
import { requireRole } from "@/lib/auth/rbac";

export async function GET() {
  const { error } = await requireRole("admin", "superadmin");
  if (error) return error;

  const rows = await db
    .select({
      id: sessions.id,
      userId: users.id,
      email: users.email,
      nama: users.nama,
      role: users.role,
      deviceInfo: sessions.deviceInfo,
      createdAt: sessions.createdAt,
      expiresAt: sessions.expiresAt,
    })
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .where(gt(sessions.expiresAt, new Date()))
    .orderBy(desc(sessions.createdAt));

  return NextResponse.json({ sessions: rows });
}
