import { NextResponse } from "next/server";
import { redirect } from "next/navigation";
import { currentSessionUser, type SessionUser } from "./session";
import type { Role } from "./config";

export async function requireRole(
  ...roles: Role[]
): Promise<{ user: SessionUser | null; error: NextResponse | null }> {
  const user = await currentSessionUser();
  if (!user) {
    return {
      user: null,
      error: NextResponse.json(
        { error: "Tidak terautentikasi" },
        { status: 401 }
      ),
    };
  }
  if (roles.length > 0 && !roles.includes(user.role)) {
    return {
      user,
      error: NextResponse.json({ error: "Akses ditolak" }, { status: 403 }),
    };
  }
  return { user, error: null };
}

export async function requirePageUser(...roles: Role[]): Promise<SessionUser> {
  const user = await currentSessionUser();
  if (!user) {
    redirect("/login");
  }
  if (roles.length > 0 && !roles.includes(user.role)) {
    redirect("/dashboard");
  }
  return user;
}
