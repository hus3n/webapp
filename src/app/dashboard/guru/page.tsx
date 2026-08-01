import { requirePageUser } from "@/lib/auth/rbac";
import { db } from "@/lib/db";
import { hafalan, jadwalMurajaah } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";

export default async function GuruHome() {
  const user = await requirePageUser("guru");

  // Fetch quick stats for this guru
  const totalHafalanRes = await db
    .select({ count: sql<number>`count(*)` })
    .from(hafalan)
    .where(sql`${hafalan.guruId} = ${user.id} AND ${hafalan.deletedAt} IS NULL`);

  const pendingMurajaahRes = await db
    .select({ count: sql<number>`count(*)` })
    .from(jadwalMurajaah)
    .where(eq(jadwalMurajaah.status, "pending"));

  const totalHafalan = totalHafalanRes[0]?.count || 0;
  const pendingMurajaah = pendingMurajaahRes[0]?.count || 0;

  return (
    <div className="space-y-8 animate-fade-in max-w-6xl mx-auto">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-emerald-800 via-teal-800 to-slate-900 text-white rounded-3xl p-6 md:p-8 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 bottom-0 opacity-10 text-9xl select-none font-serif">
          📖
        </div>
        <div className="relative z-10 space-y-2">
          <span className="inline-block px-3 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 rounded-full text-xs font-bold uppercase tracking-wider">
            Portal Guru Pengampu
          </span>
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
            Assalamu&apos;alaikum, {user.nama}
          </h1>
          <p className="text-slate-300 text-sm sm:text-base max-w-xl">
            Selamat datang di Portal Pencatatan Hafalan Santri. Kelola setoran hafalan baru dan pantau jadwal murajaah santri binaan Anda dengan mudah.
          </p>
        </div>
      </div>

      {/* Quick Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Setoran</span>
            <span className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center text-xl font-bold">
              📚
            </span>
          </div>
          <p className="text-3xl font-extrabold text-slate-800">{totalHafalan}</p>
          <p className="text-xs text-slate-500">Catatan hafalan telah diinput</p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Murajaah Pending</span>
            <span className="w-10 h-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center text-xl font-bold">
              ⏳
            </span>
          </div>
          <p className="text-3xl font-extrabold text-slate-800">{pendingMurajaah}</p>
          <p className="text-xs text-slate-500">Jadwal murajaah menunggu evaluasi</p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition space-y-3 sm:col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Pesan WA Massal</span>
            <span className="w-10 h-10 rounded-xl bg-teal-100 text-teal-600 flex items-center justify-center text-xl font-bold">
              💬
            </span>
          </div>
          <p className="text-sm font-semibold text-slate-700">Kirim Notifikasi</p>
          <p className="text-xs text-slate-500">Notifikasi pengingat hafalan ke orang tua wali</p>
        </div>
      </div>

      {/* Quick Action Navigation Cards */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-slate-800">Aksi Cepat Menu Utama</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <a
            href="/dashboard/guru/hafalan"
            className="group bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-xl hover:border-emerald-500/50 transition-all duration-300 flex flex-col justify-between space-y-4"
          >
            <div className="space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center text-2xl group-hover:scale-110 transition duration-300">
                📖
              </div>
              <h3 className="text-lg font-bold text-slate-800 group-hover:text-emerald-600 transition">
                Input Setoran Hafalan
              </h3>
              <p className="text-slate-500 text-xs leading-relaxed">
                Catat setoran hafalan surah & ayat baru santri beserta penilaian kelancaran.
              </p>
            </div>
            <span className="text-xs font-bold text-emerald-600 flex items-center gap-1 group-hover:translate-x-1 transition">
              Buka Form Hafalan →
            </span>
          </a>

          <a
            href="/dashboard/guru/murajaah"
            className="group bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-xl hover:border-teal-500/50 transition-all duration-300 flex flex-col justify-between space-y-4"
          >
            <div className="space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-teal-600 text-white flex items-center justify-center text-2xl group-hover:scale-110 transition duration-300">
                📅
              </div>
              <h3 className="text-lg font-bold text-slate-800 group-hover:text-teal-600 transition">
                Jadwal Murajaah
              </h3>
              <p className="text-slate-500 text-xs leading-relaxed">
                Evaluasi dan perbarui status ulangan hafalan santri yang terjadwal.
              </p>
            </div>
            <span className="text-xs font-bold text-teal-600 flex items-center gap-1 group-hover:translate-x-1 transition">
              Lihat Jadwal Murajaah →
            </span>
          </a>

          <a
            href="/dashboard/guru/bulk-message"
            className="group bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-xl hover:border-blue-500/50 transition-all duration-300 flex flex-col justify-between space-y-4"
          >
            <div className="space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center text-2xl group-hover:scale-110 transition duration-300">
                💬
              </div>
              <h3 className="text-lg font-bold text-slate-800 group-hover:text-blue-600 transition">
                WhatsApp Massal
              </h3>
              <p className="text-slate-500 text-xs leading-relaxed">
                Kirim pesan pengingat hafalan massal ke kontak WhatsApp wali santri.
              </p>
            </div>
            <span className="text-xs font-bold text-blue-600 flex items-center gap-1 group-hover:translate-x-1 transition">
              Kirim Notifikasi →
            </span>
          </a>

          <a
            href="/dashboard/guru/whatsapp-connect"
            className="group bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-xl hover:border-amber-500/50 transition-all duration-300 flex flex-col justify-between space-y-4"
          >
            <div className="space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center text-2xl group-hover:scale-110 transition duration-300">
                📱
              </div>
              <h3 className="text-lg font-bold text-slate-800 group-hover:text-amber-600 transition">
                Pairing QR WhatsApp
              </h3>
              <p className="text-slate-500 text-xs leading-relaxed">
                Scan QR Code untuk menghubungkan akun WA Guru dan mengaktifkan pesan massal.
              </p>
            </div>
            <span className="text-xs font-bold text-amber-600 flex items-center gap-1 group-hover:translate-x-1 transition">
              Hubungkan WA →
            </span>
          </a>
        </div>
      </div>
    </div>
  );
}
