"use client";

import { useState, useEffect, useCallback } from "react";

export default function WhatsAppConnectPage() {
  const [status, setStatus] = useState<"connected" | "disconnected" | "loading" | "connecting">("loading");
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [waNumber, setWaNumber] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchQrStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/whatsapp/qr");
      const data = await res.json();
      if (res.ok) {
        if (data.status === "connected") {
          setStatus("connected");
          setWaNumber(data.waNumber || null);
          setQrCodeUrl(null);
        } else if (data.qrDataUrl) {
          setQrCodeUrl(data.qrDataUrl);
          setStatus("connecting");
        } else if (data.status === "connecting") {
          setStatus("connecting");
        } else {
          setStatus("disconnected");
        }
      }
    } catch {
      setStatus("disconnected");
    }
  }, []);

  useEffect(() => {
    fetchQrStatus();
    const interval = setInterval(fetchQrStatus, 2500);
    return () => clearInterval(interval);
  }, [fetchQrStatus]);

  async function handleStartPairing() {
    try {
      setLoading(true);
      await fetchQrStatus();
    } finally {
      setLoading(false);
    }
  }

  async function handleDisconnect() {
    if (!confirm("Apakah Anda yakin ingin memutuskan koneksi WhatsApp ini?")) return;
    try {
      setLoading(true);
      await fetch("/api/whatsapp/qr", { method: "DELETE" });
      setStatus("disconnected");
      setQrCodeUrl(null);
      setWaNumber(null);
    } catch {
      alert("Gagal memutuskan koneksi WhatsApp.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-8 animate-fade-in">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-800 via-teal-800 to-slate-900 text-white rounded-3xl p-6 md:p-8 shadow-xl relative overflow-hidden">
        <div className="relative z-10 space-y-2">
          <span className="inline-block px-3 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 rounded-full text-xs font-bold uppercase tracking-wider">
            Integrasi WhatsApp Gateway (Baileys)
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Hubungkan WhatsApp Guru
          </h1>
          <p className="text-slate-300 text-sm max-w-xl">
            Scan QR Code di bawah menggunakan aplikasi WhatsApp Anda untuk menghubungkan akun WA Guru ke Webapp Hafalan. Ini memungkinkan pengiriman pesan massal jadwal murajaah langsung ke wali murid.
          </p>
        </div>
      </div>

      {/* Status Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-800">Status Koneksi WhatsApp</h2>
            <p className="text-xs text-slate-500">Perangkat WhatsApp aktif untuk kirim notifikasi massal</p>
          </div>
          <div>
            {status === "connected" ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Terhubung ({waNumber ? `+${waNumber}` : "WA Aktif"})
              </span>
            ) : status === "connecting" ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-100 text-amber-700 text-xs font-bold">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                Menunggu Scan QR...
              </span>
            ) : status === "loading" ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 text-slate-600 text-xs font-medium">
                Memeriksa status...
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 text-slate-600 text-xs font-bold">
                Belum Terhubung
              </span>
            )}
          </div>
        </div>

        {/* QR Code Section */}
        <div className="flex flex-col items-center justify-center p-6 bg-slate-50 border border-dashed border-slate-300 rounded-2xl space-y-4 text-center">
          {status === "connected" ? (
            <div className="py-6 space-y-4 text-center">
              <div className="text-5xl">✅</div>
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-slate-800">WhatsApp Berhasil Terhubung!</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Akun WhatsApp Guru Anda (+{waNumber}) telah aktif dan siap digunakan untuk pengiriman pesan massal ke wali murid.
                </p>
              </div>
              <button
                onClick={handleDisconnect}
                disabled={loading}
                className="px-5 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 font-bold text-xs border border-red-200 transition"
              >
                Putuskan Koneksi WhatsApp
              </button>
            </div>
          ) : qrCodeUrl ? (
            <div className="space-y-4 flex flex-col items-center">
              <div className="p-3 bg-white border border-slate-200 rounded-2xl shadow-md">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={qrCodeUrl} alt="WhatsApp Web Pairing QR Code" className="w-60 h-60 rounded-xl" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-bold text-slate-800">Buka WhatsApp → Tautkan Perangkat (Linked Devices)</p>
                <p className="text-xs text-slate-500">Arahkan kamera smartphone ke QR Code di atas untuk menghubungkan WA Guru Anda.</p>
              </div>
            </div>
          ) : (
            <div className="space-y-3 py-4 max-w-md">
              <div className="text-4xl">📱</div>
              <h3 className="text-base font-bold text-slate-800">Scan QR Code Pairing WhatsApp Web</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Klik tombol di bawah untuk memuat QR Code pairing WhatsApp resmi dari Baileys Gateway.
              </p>
              <button
                onClick={handleStartPairing}
                disabled={loading}
                className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md transition disabled:opacity-50"
              >
                {loading ? "Memuat QR Code..." : "Tampilkan QR Code Pairing"}
              </button>
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="bg-emerald-50/50 rounded-xl p-4 border border-emerald-100 text-xs text-emerald-900 space-y-2">
          <p className="font-bold flex items-center gap-1.5 text-sm">
            💡 Petunjuk Cara Menghubungkan:
          </p>
          <ol className="list-decimal list-inside space-y-1 text-slate-700">
            <li>Buka aplikasi <strong>WhatsApp</strong> di smartphone Anda.</li>
            <li>Buka menu <strong>Pengaturan / Settings</strong> (atau titik tiga di kanan atas).</li>
            <li>Pilih <strong>Perangkat Tertaut (Linked Devices)</strong> → Tekan <strong>Tautkan Perangkat (Link a Device)</strong>.</li>
            <li>Arahkan kamera smartphone ke gambar <strong>QR Code</strong> di atas.</li>
            <li>Setelah terhubung, Anda dapat langsung mengirim pesan massal ke wali murid dari menu <strong>Pesan Massal</strong>.</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
