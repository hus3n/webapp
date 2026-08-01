import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/rbac";
import { sendWhatsAppMessageWithRetry } from "@/lib/whatsapp/retry";

export async function POST(req: NextRequest) {
  try {
    const { error } = await requireRole("guru", "admin", "superadmin");
    if (error) return error;
    const body = await req.json();
    const { to, message } = body;

    if (!to || !message) {
      return NextResponse.json(
        { error: "Tujuan (to) dan pesan (message) wajib diisi" },
        { status: 400 }
      );
    }

    const result = await sendWhatsAppMessageWithRetry(to, message);

    return NextResponse.json({
      success: true,
      message: "Pesan WhatsApp berhasil dikirim",
      result,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Gagal mengirim pesan WhatsApp";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
