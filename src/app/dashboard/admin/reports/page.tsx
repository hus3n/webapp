import { requirePageUser } from "@/lib/auth/rbac";

export default async function AdminReportsPage() {
  await requirePageUser("admin", "superadmin");

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Laporan & Ekspor Data</h1>
        <p className="text-slate-500 text-sm">
          Unduh laporan hafalan santri dan jadwal murajaah dalam format CSV.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Laporan Hafalan */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <div className="w-12 h-12 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold text-xl">
            📊
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-800">Laporan Hafalan Santri</h2>
            <p className="text-slate-500 text-sm">
              Ekspor seluruh data rekaman setoran hafalan (surah, ayat, kelancaran, catatan).
            </p>
          </div>
          <a
            href="/api/reports/hafalan"
            download
            className="inline-block w-full text-center bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2.5 px-4 rounded-lg transition"
          >
            Download CSV Hafalan
          </a>
        </div>

        {/* Laporan Murajaah */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <div className="w-12 h-12 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xl">
            📅
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-800">Laporan Jadwal Murajaah</h2>
            <p className="text-slate-500 text-sm">
              Ekspor rekap jadwal pengulangan hafalan santri beserta status penyelesaiannya.
            </p>
          </div>
          <a
            href="/api/reports/murajaah"
            download
            className="inline-block w-full text-center bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-4 rounded-lg transition"
          >
            Download CSV Murajaah
          </a>
        </div>
      </div>
    </div>
  );
}
