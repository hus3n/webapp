import { NextResponse } from "next/server";
import { getOrInitBaileysSocket, waitForQrCode, state } from "@/lib/whatsapp/baileys";

export async function GET() {
  try {
    await getOrInitBaileysSocket();
    if (!state.qrCodeUrl && state.status !== "connected") {
      await waitForQrCode(4000);
    }

    return NextResponse.json({
      status: state.status,
      qrDataUrl: state.qrCodeUrl,
      waNumber: state.waNumber,
      connectedAt: state.connectedAt,
    });
  } catch {
    return NextResponse.json(
      { error: "Gagal memproses QR Code WhatsApp Baileys." },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  try {
    const { disconnectBaileys } = await import("@/lib/whatsapp/baileys");
    await disconnectBaileys();
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Gagal mematikan koneksi WhatsApp" }, { status: 500 });
  }
}
