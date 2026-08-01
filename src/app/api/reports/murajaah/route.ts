import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/rbac";
import { db } from "@/lib/db";
import { jadwalMurajaah, hafalan, santri } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { convertToCSV } from "@/lib/csv-export";

export async function GET() {
  try {
    const { error } = await requireRole("admin", "superadmin");
    if (error) return error;

    const records = await db
      .select({
        id: jadwalMurajaah.id,
        santriNama: santri.nama,
        santriNis: santri.nis,
        surah: hafalan.surah,
        ayatStart: hafalan.ayatStart,
        ayatEnd: hafalan.ayatEnd,
        tanggalMurajaah: jadwalMurajaah.tanggalMurajaah,
        status: jadwalMurajaah.status,
        completedAt: jadwalMurajaah.completedAt,
      })
      .from(jadwalMurajaah)
      .innerJoin(hafalan, eq(jadwalMurajaah.hafalanId, hafalan.id))
      .innerJoin(santri, eq(hafalan.santriId, santri.id))
      .orderBy(desc(jadwalMurajaah.tanggalMurajaah));

    const csvData = convertToCSV(records, [
      { key: "santriNis", label: "NIS Santri" },
      { key: "santriNama", label: "Nama Santri" },
      { key: "surah", label: "Surah" },
      { key: "ayatStart", label: "Ayat Awal" },
      { key: "ayatEnd", label: "Ayat Akhir" },
      { key: "tanggalMurajaah", label: "Jadwal Murajaah" },
      { key: "status", label: "Status" },
      { key: "completedAt", label: "Tanggal Selesai" },
    ]);

    return new NextResponse(csvData, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="laporan_murajaah_${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Gagal meng-export laporan murajaah CSV";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
