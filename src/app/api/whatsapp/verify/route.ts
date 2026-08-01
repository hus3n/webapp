import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/rbac";
import { db } from "@/lib/db";
import { whatsappSessions, users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { formatPhoneNumber } from "@/lib/whatsapp/client";
import { state } from "@/lib/whatsapp/baileys";

export async function GET() {
  const isBaileysConnected = state.status === "connected";
  return NextResponse.json({
    connected: isBaileysConnected,
    waNumber: state.waNumber || null,
    status: state.status,
  });
}

export async function POST(req: NextRequest) {
  try {
    const { user, error } = await requireRole("guru", "admin", "superadmin");
    if (error || !user) return error || NextResponse.json({ error: "Tidak terautentikasi" }, { status: 401 });
    const body = await req.json();
    const { waNumber } = body;

    if (!waNumber) {
      return NextResponse.json(
        { error: "Nomor WhatsApp wajib diisi" },
        { status: 400 }
      );
    }

    const formattedPhone = formatPhoneNumber(waNumber);

    // Check if session exists
    const existing = await db
      .select()
      .from(whatsappSessions)
      .where(eq(whatsappSessions.userId, user.id))
      .limit(1);

    if (existing.length > 0) {
      await db
        .update(whatsappSessions)
        .set({
          waNumber: formattedPhone,
          verifiedAt: new Date(),
        })
        .where(eq(whatsappSessions.id, existing[0].id));
    } else {
      await db.insert(whatsappSessions).values({
        userId: user.id,
        waNumber: formattedPhone,
        verifiedAt: new Date(),
      });
    }

    // Also update user's whatsappNumber
    await db
      .update(users)
      .set({ whatsappNumber: formattedPhone })
      .where(eq(users.id, user.id));

    return NextResponse.json({
      success: true,
      message: "Nomor WhatsApp berhasil diverifikasi",
      waNumber: formattedPhone,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Terjadi kesalahan server";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
