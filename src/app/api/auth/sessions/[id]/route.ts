import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { sessions } from "@/lib/db/schema";
import { requireRole } from "@/lib/auth/rbac";

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const { error } = await requireRole("admin", "superadmin");
  if (error) return error;

  const [target] = await db
    .select({ id: sessions.id })
    .from(sessions)
    .where(eq(sessions.id, params.id))
    .limit(1);

  if (!target) {
    return NextResponse.json({ error: "Sesi tidak ditemukan" }, { status: 404 });
  }

  await db.delete(sessions).where(eq(sessions.id, params.id));

  return NextResponse.json({ ok: true });
}
