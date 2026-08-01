import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/rbac";
import { db } from "@/lib/db";
import { hafalan, santri, users } from "@/lib/db/schema";
import { eq, desc, isNull } from "drizzle-orm";
import { convertToCSV } from "@/lib/csv-export";

export async function GET() {
  try {
    const { error } = await requireRole("admin", "superadmin");
    if (error) return error;

    const records = await db
      .select({
        id: hafalan.id,
        santriNama: santri.nama,
        santriNis: santri.nis,
        guruNama: users.nama,
        tanggal: hafalan.tanggal,
        surah: hafalan.surah,
        ayatStart: hafalan.ayatStart,
        ayatEnd: hafalan.ayatEnd,
        status: hafalan.status,
        catatan: hafalan.catatan,
      })
      .from(hafalan)
      .innerJoin(santri, eq(hafalan.santriId, santri.id))
      .innerJoin(users, eq(hafalan.guruId, users.id))
      .where(isNull(hafalan.deletedAt))
      .orderBy(desc(hafalan.tanggal));

    const csvData = convertToCSV(records, [
      { key: "santriNis", label: "NIS Santri" },
      { key: "santriNama", label: "Nama Santri" },
      { key: "guruNama", label: "Guru Pengampu" },
      { key: "tanggal", label: "Tanggal" },
      { key: "surah", label: "Surah" },
      { key: "ayatStart", label: "Ayat Awal" },
      { key: "ayatEnd", label: "Ayat Akhir" },
      { key: "status", label: "Status Kelancaran" },
      { key: "catatan", label: "Catatan" },
    ]);

    return new NextResponse(csvData, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="laporan_hafalan_${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Gagal meng-export laporan hafalan CSV";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
