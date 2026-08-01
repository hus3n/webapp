import { NextResponse } from "next/server";
import { z } from "zod";
import {
  createSession,
  getSessionUser,
  getTokenFromRequest,
} from "@/lib/auth/session";
import { consumeQrToken } from "@/lib/auth/qr-token";

const verifySchema = z.object({
  token: z.string().min(1, "Token tidak valid"),
});

export async function POST(req: Request) {
  const token = getTokenFromRequest(req);
  if (!token) {
    return NextResponse.json({ error: "Tidak terautentikasi" }, { status: 401 });
  }

  const user = await getSessionUser(token);
  if (!user) {
    return NextResponse.json(
      { error: "Sesi tidak valid atau kedaluwarsa" },
      { status: 401 }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body tidak valid" }, { status: 400 });
  }

  const parsed = verifySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Input tidak valid" },
      { status: 400 }
    );
  }

  const qrToken = parsed.data.token;
  const newSessionToken = await createSession(user.id, "qr-login");

  const consumed = await consumeQrToken(qrToken, newSessionToken);
  if (!consumed) {
    return NextResponse.json(
      { error: "QR code tidak valid atau sudah kedaluwarsa" },
      { status: 400 }
    );
  }

  return NextResponse.json({
    ok: true,
    sessionToken: newSessionToken,
  });
}
