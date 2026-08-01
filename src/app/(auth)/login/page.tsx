import LoginForm from "@/components/forms/LoginForm";

export default function LoginPage() {
  return (
    <main className="min-h-screen w-full bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 flex items-center justify-center p-4 sm:p-6 md:p-8 relative overflow-hidden">
      {/* Background Decorative Blur Blobs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-slate-900/80 backdrop-blur-2xl rounded-3xl border border-slate-800 p-6 sm:p-8 shadow-2xl shadow-emerald-950/50 space-y-6 relative z-10 animate-fade-in">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-white text-3xl font-extrabold shadow-xl shadow-emerald-500/30 mb-2">
            🕌
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Portal Hafalan Santri
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm">
            Sistem Pemantauan Setoran Hafalan & Murajaah
          </p>
        </div>


        {/* Form Component */}
        <LoginForm />

        {/* Footer info */}
        <p className="text-center text-xs text-slate-500 pt-2">
          Hafalan Santri App v1.0 • Multi-Role Access Control
        </p>
      </div>
    </main>
  );
}
