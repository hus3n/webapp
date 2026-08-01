import { randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { and, eq, gt, ne } from "drizzle-orm";
import { db } from "@/lib/db";
import { sessions, users } from "@/lib/db/schema";
import { AUTH_COOKIE_NAME, SESSION_MAX_AGE_MS } from "./config";

export type SessionUser = {
  id: string;
  email: string;
  nama: string;
  role: "guru" | "admin" | "superadmin";
  whatsappNumber: string | null;
};

export async function createSession(
  userId: string,
  deviceInfo?: string
): Promise<string> {
  const token = randomBytes(32).toString("hex");
  await db.insert(sessions).values({
    userId,
    token,
    expiresAt: new Date(Date.now() + SESSION_MAX_AGE_MS),
    deviceInfo: deviceInfo ?? null,
  });
  return token;
}

export async function getSessionUser(
  token: string
): Promise<SessionUser | null> {
  if (!token) return null;
  const rows = await db
    .select({
      id: users.id,
      email: users.email,
      nama: users.nama,
      role: users.role,
      whatsappNumber: users.whatsappNumber,
      expiresAt: sessions.expiresAt,
    })
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .where(
      and(
        eq(sessions.token, token),
        gt(sessions.expiresAt, new Date()),
        eq(users.status, "active")
      )
    )
    .limit(1);
  if (rows.length === 0) return null;
  return {
    id: rows[0].id,
    email: rows[0].email,
    nama: rows[0].nama,
    role: rows[0].role,
    whatsappNumber: rows[0].whatsappNumber,
  };
}

export async function extendSession(token: string): Promise<void> {
  await db
    .update(sessions)
    .set({ expiresAt: new Date(Date.now() + SESSION_MAX_AGE_MS) })
    .where(eq(sessions.token, token));
}

export async function destroySession(token: string): Promise<void> {
  await db.delete(sessions).where(eq(sessions.token, token));
}

export async function destroyUserSessions(
  userId: string,
  exceptToken?: string
): Promise<void> {
  if (exceptToken) {
    await db
      .delete(sessions)
      .where(and(eq(sessions.userId, userId), ne(sessions.token, exceptToken)));
  } else {
    await db.delete(sessions).where(eq(sessions.userId, userId));
  }
}

export async function currentSessionUser(): Promise<SessionUser | null> {
  const cookieStore = cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
  if (!token) return null;
  const user = await getSessionUser(token);
  if (user) {
    await extendSession(token);
  }
  return user;
}

export function getTokenFromRequest(req: Request): string | null {
  const auth = req.headers.get("authorization");
  if (auth?.startsWith("Bearer ")) {
    return auth.slice("Bearer ".length);
  }
  const cookie = req.headers.get("cookie");
  if (cookie) {
    const match = cookie.match(
      new RegExp(`(?:^|; )${AUTH_COOKIE_NAME}=([^;]+)`)
    );
    if (match) return match[1];
  }
  return null;
}
