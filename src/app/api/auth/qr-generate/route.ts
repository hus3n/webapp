import { NextResponse } from "next/server";
import QRCode from "qrcode";
import { createQrToken } from "@/lib/auth/qr-token";
import { QR_TOKEN_EXPIRY_MS } from "@/lib/auth/config";

export async function GET() {
  const token = await createQrToken();
  const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
  const verifyUrl = `${baseUrl}/qr-login/verify?token=${token}`;

  const qrDataUrl = await QRCode.toDataURL(verifyUrl);

  return NextResponse.json({
    token,
    qrDataUrl,
    verifyUrl,
    expiresIn: QR_TOKEN_EXPIRY_MS,
  });
}
