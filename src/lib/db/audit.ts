import { db } from "./index";
import { auditLogs } from "./schema";

export async function logAudit(entry: {
  userId?: string | null;
  action: string;
  tableName: string;
  recordId: string;
  oldData?: unknown;
  newData?: unknown;
}) {
  await db.insert(auditLogs).values({
    userId: entry.userId ?? null,
    action: entry.action,
    tableName: entry.tableName,
    recordId: entry.recordId,
    oldData: entry.oldData !== undefined ? JSON.stringify(entry.oldData) : null,
    newData: entry.newData !== undefined ? JSON.stringify(entry.newData) : null,
  });
}
