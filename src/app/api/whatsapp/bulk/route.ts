import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/rbac";
import { checkRateLimit } from "@/lib/rate-limit";
import { processBulkWhatsAppQueue, BulkJobItem } from "@/lib/whatsapp/queue";

export async function POST(req: NextRequest) {
  try {
    const { user, error } = await requireRole("guru", "admin", "superadmin");
    if (error || !user) return error || NextResponse.json({ error: "Tidak terautentikasi" }, { status: 401 });

    // Check rate limit per user (max 5 bulk operations per minute)
    const rateCheck = checkRateLimit(`bulk_wa_${user.id}`, 5, 60000);
    if (!rateCheck.success) {
      return NextResponse.json(
        {
          error: "Batas pengiriman massal terlampaui. Coba lagi dalam beberapa saat.",
          resetInMs: rateCheck.resetInMs,
        },
        { status: 429 }
      );
    }

    const body = await req.json();
    const { items } = body as { items: BulkJobItem[] };

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "Daftar penerima (items) tidak boleh kosong." },
        { status: 400 }
      );
    }

    if (items.length > 50) {
      return NextResponse.json(
        { error: "Maksimal 50 pesan sekaligus per sesi pengiriman." },
        { status: 400 }
      );
    }

    const results = await processBulkWhatsAppQueue(items);
    const successCount = results.filter((r) => r.success).length;
    const failureCount = results.filter((r) => !r.success).length;

    return NextResponse.json({
      success: true,
      total: items.length,
      successCount,
      failureCount,
      details: results,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Gagal memproses pengiriman massal.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
