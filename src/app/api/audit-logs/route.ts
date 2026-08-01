import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/rbac";
import { db } from "@/lib/db";
import { auditLogs, users } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    const { error } = await requireRole("admin", "superadmin");
    if (error) return error;

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const offset = (page - 1) * limit;

    const logs = await db
      .select({
        id: auditLogs.id,
        userId: auditLogs.userId,
        userNama: users.nama,
        action: auditLogs.action,
        tableName: auditLogs.tableName,
        recordId: auditLogs.recordId,
        oldData: auditLogs.oldData,
        newData: auditLogs.newData,
        timestamp: auditLogs.timestamp,
      })
      .from(auditLogs)
      .leftJoin(users, eq(auditLogs.userId, users.id))
      .orderBy(desc(auditLogs.timestamp))
      .limit(limit)
      .offset(offset);

    return NextResponse.json({
      page,
      limit,
      logs,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Gagal mengambil audit logs";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
