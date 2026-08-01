import { NextResponse } from "next/server";
import {
  getQrSessionToken,
  isQrTokenValid,
} from "@/lib/auth/qr-token";
import { AUTH_COOKIE_NAME, SESSION_MAX_AGE_SECONDS } from "@/lib/auth/config";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get("token");
  if (!token) {
    return NextResponse.json({ error: "Token tidak ada" }, { status: 400 });
  }

  const sessionToken = await getQrSessionToken(token);
  if (sessionToken) {
    const res = NextResponse.json({ status: "ready", sessionToken });
    res.cookies.set(AUTH_COOKIE_NAME, sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_MAX_AGE_SECONDS,
    });
    return res;
  }

  const valid = await isQrTokenValid(token);
  if (!valid) {
    return NextResponse.json({ status: "expired" });
  }

  return NextResponse.json({ status: "waiting" });
}
