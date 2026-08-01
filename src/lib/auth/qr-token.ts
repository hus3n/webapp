import { randomBytes } from "node:crypto";
import { and, eq, gt, lt } from "drizzle-orm";
import { db } from "@/lib/db";
import { qrTokens } from "@/lib/db/schema";
import { QR_TOKEN_EXPIRY_MS } from "./config";

export async function createQrToken(): Promise<string> {
  await db.delete(qrTokens).where(lt(qrTokens.expiresAt, new Date()));
  const token = randomBytes(32).toString("hex");
  await db.insert(qrTokens).values({
    token,
    expiresAt: new Date(Date.now() + QR_TOKEN_EXPIRY_MS),
    used: false,
    sessionToken: null,
  });
  return token;
}

export async function isQrTokenValid(token: string): Promise<boolean> {
  const rows = await db
    .select({ id: qrTokens.id })
    .from(qrTokens)
    .where(
      and(eq(qrTokens.token, token), eq(qrTokens.used, false), gt(qrTokens.expiresAt, new Date()))
    )
    .limit(1);
  return rows.length > 0;
}

export async function consumeQrToken(
  token: string,
  sessionToken: string
): Promise<boolean> {
  const result = await db
    .update(qrTokens)
    .set({ used: true, sessionToken })
    .where(
      and(
        eq(qrTokens.token, token),
        eq(qrTokens.used, false),
        gt(qrTokens.expiresAt, new Date())
      )
    )
    .returning({ id: qrTokens.id });
  return result.length > 0;
}

export async function getQrSessionToken(
  token: string
): Promise<string | null> {
  const rows = await db
    .select({ sessionToken: qrTokens.sessionToken })
    .from(qrTokens)
    .where(eq(qrTokens.token, token))
    .limit(1);
  return rows[0]?.sessionToken ?? null;
}
