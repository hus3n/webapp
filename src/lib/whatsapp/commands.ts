import { db } from "@/lib/db";
import { hafalan, santri } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";

export async function parseAndExecuteCommand(
  senderPhone: string,
  messageBody: string
): Promise<string> {
  const trimmed = messageBody.trim();

  // Command: !hafalan <santri_id or NIS>
  if (trimmed.startsWith("!hafalan")) {
    const parts = trimmed.split(/\s+/);
    if (parts.length < 2) {
      return "Format command salah. Gunakan: !hafalan [nis_atau_id_santri]";
    }

    const identifier = parts[1];

    // Find santri by NIS or ID
    let targetSantri = await db
      .select()
      .from(santri)
      .where(eq(santri.nis, identifier))
      .limit(1);

    if (!targetSantri.length) {
      targetSantri = await db
        .select()
        .from(santri)
        .where(eq(santri.id, identifier))
        .limit(1);
    }

    if (!targetSantri.length) {
      return `Santri dengan NIS/ID '${identifier}' tidak ditemukan.`;
    }

    const s = targetSantri[0];

    // Get latest 5 hafalan records
    const hafalanList = await db
      .select({
        tanggal: hafalan.tanggal,
        surah: hafalan.surah,
        ayatStart: hafalan.ayatStart,
        ayatEnd: hafalan.ayatEnd,
        status: hafalan.status,
        catatan: hafalan.catatan,
      })
      .from(hafalan)
      .where(eq(hafalan.santriId, s.id))
      .orderBy(desc(hafalan.tanggal))
      .limit(5);

    if (hafalanList.length === 0) {
      return `Belum ada catatan hafalan untuk Santri: ${s.nama} (NIS: ${s.nis}).`;
    }

    let response = `*Riwayat Hafalan Santri*\nNama: ${s.nama}\nNIS: ${s.nis}\n\n`;
    hafalanList.forEach((h, idx) => {
      const tgl = new Date(h.tanggal).toLocaleDateString("id-ID");
      response += `${idx + 1}. [${tgl}] Surah ${h.surah}:${h.ayatStart}-${h.ayatEnd} (${h.status.replace("_", " ")})\n`;
      if (h.catatan) response += `   Catatan: ${h.catatan}\n`;
    });

    return response;
  }

  if (trimmed.startsWith("!help") || trimmed.startsWith("!bantuan")) {
    return (
      "*Bot Hafalan Santri*\n\n" +
      "Perintah yang tersedia:\n" +
      "1. `!hafalan [NIS]` - Cek riwayat hafalan santri berdasarkan NIS.\n" +
      "2. `!bantuan` - Tampilkan daftar perintah ini."
    );
  }

  return "Perintah tidak dikenali. Ketik `!bantuan` untuk melihat daftar perintah yang tersedia.";
}
