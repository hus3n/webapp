"use client";

import { useState, type FormEvent } from "react";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function quickFill(roleEmail: string) {
    setEmail(roleEmail);
    setPassword("password123");
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Login gagal. Cek email dan password Anda.");
        return;
      }
      window.location.href = "/dashboard";
    } catch {
      setError("Terjadi kesalahan koneksi server, coba lagi.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full space-y-6">
      <form onSubmit={onSubmit} className="space-y-4">
        {error && (
          <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium animate-fade-in flex items-center gap-2">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        <div className="space-y-1.5">
          <label htmlFor="email" className="block text-xs font-bold uppercase tracking-wider text-slate-300">
            Email Alamat
          </label>
          <div className="relative">
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nama@hafalan.id"
              className="w-full rounded-xl bg-slate-900/70 border border-slate-700/80 px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition text-sm"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="password" className="block text-xs font-bold uppercase tracking-wider text-slate-300">
            Kata Sandi
          </label>
          <div className="relative">
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-xl bg-slate-900/70 border border-slate-700/80 px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition text-sm"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-bold py-3.5 px-4 shadow-lg shadow-emerald-500/20 transition-all duration-200 active:scale-98 disabled:opacity-50 text-sm tracking-wide"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Memproses Masuk...
            </span>
          ) : (
            "Masuk ke Portal"
          )}
        </button>
      </form>

      {/* Quick Access Account Pills */}
      <div className="pt-4 border-t border-slate-800 space-y-2">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 text-center">
          ⚡ Akses Cepat Akun Demo (Klik untuk isi)
        </p>
        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => quickFill("superadmin@hafalan.id")}
            className="px-2 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-[11px] font-medium text-slate-300 hover:text-emerald-400 border border-slate-700 transition truncate"
          >
            Superadmin
          </button>
          <button
            type="button"
            onClick={() => quickFill("admin@hafalan.id")}
            className="px-2 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-[11px] font-medium text-slate-300 hover:text-emerald-400 border border-slate-700 transition truncate"
          >
            Admin
          </button>
          <button
            type="button"
            onClick={() => quickFill("guru@hafalan.id")}
            className="px-2 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-[11px] font-medium text-slate-300 hover:text-emerald-400 border border-slate-700 transition truncate"
          >
            Guru
          </button>
        </div>
      </div>
    </div>
  );
}
