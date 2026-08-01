import Link from "next/link";

export default function QrLoginPage() {
  return (
    <main className="min-h-screen w-full bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 flex items-center justify-center p-4 sm:p-6 md:p-8 relative overflow-hidden">
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-slate-900/80 backdrop-blur-2xl rounded-3xl border border-slate-800 p-6 sm:p-8 shadow-2xl shadow-emerald-950/50 space-y-6 relative z-10 text-center animate-fade-in">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-amber-500/20 text-amber-400 text-3xl font-extrabold border border-amber-500/30 mb-2">
          📱
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-extrabold text-white">
            Fitur QR Code WhatsApp
          </h1>
          <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
            QR Code digunakan untuk <strong>menghubungkan akun WhatsApp Guru</strong> di dalam Dashboard untuk mengirim pesan massal ke wali murid, bukan untuk login akun.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-3">
          <p className="text-xs text-slate-400">
            Silakan masuk menggunakan Email & Password Anda di portal login resmi.
          </p>
          <Link
            href="/login"
            className="block w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-bold text-sm shadow-lg shadow-emerald-500/20 transition"
          >
            Kembali ke Login Email & Password
          </Link>
        </div>
      </div>
    </main>
  );
}
