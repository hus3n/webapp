"use client";

import { useState, useEffect } from "react";

interface SantriOption {
  id: string;
  nama: string;
  nis: string;
  kontakWali: string | null;
  whatsappNumber: string | null;
  latestHafalan?: {
    surah: number;
    surahNama: string;
    ayatStart: number;
    ayatEnd: number;
    status: string;
    catatan: string | null;
    tanggal: string;
  } | null;
  nextMurajaah?: {
    tanggalMurajaah: string;
    surah: number;
    surahNama: string;
    ayatStart: number;
    ayatEnd: number;
    status: string;
  } | null;
}

export default function BulkMessageForm() {
  const [santriList, setSantriList] = useState<SantriOption[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [template, setTemplate] = useState("reminder");
  const [customText, setCustomText] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [result, setResult] = useState<{
    successCount: number;
    failureCount: number;
    total: number;
    details?: Array<{
      santriId: string;
      phone: string;
      success: boolean;
      error?: string;
    }>;
  } | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchSantri();
  }, []);

  async function fetchSantri() {
    try {
      setFetching(true);
      const res = await fetch("/api/santri");
      const data = await res.json();
      if (res.ok) {
        setSantriList(data.santri || data || []);
      } else {
        setError(data.error || "Gagal memuat data santri");
      }
    } catch {
      setError("Gagal menghubungkan ke server");
    } finally {
      setFetching(false);
    }
  }

  function handleSelectAll(checked: boolean) {
    if (checked) {
      const valid = santriList
        .filter((s) => s.kontakWali || s.whatsappNumber)
        .map((s) => s.id);
      setSelectedIds(valid);
    } else {
      setSelectedIds([]);
    }
  }

  function toggleSelect(id: string) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  }

  function formatMessageBody(s: SantriOption): string {
    const hafalanText = s.latestHafalan
      ? `${s.latestHafalan.surahNama} (Ayat ${s.latestHafalan.ayatStart}-${s.latestHafalan.ayatEnd})`
      : "Belum ada catatan setoran";

    const murajaahMateri = s.nextMurajaah
      ? `${s.nextMurajaah.surahNama} (Ayat ${s.nextMurajaah.ayatStart}-${s.nextMurajaah.ayatEnd})`
      : s.latestHafalan
      ? `${s.latestHafalan.surahNama} (Ayat ${s.latestHafalan.ayatStart}-${s.latestHafalan.ayatEnd})`
      : "Sesuai Target Hafalan";

    const statusMap: Record<string, string> = {
      lancar: "Lancar",
      kurang_lancar: "Kurang Lancar",
      tidak_lancar: "Perlu Mengulang",
    };
    const statusText = s.latestHafalan
      ? statusMap[s.latestHafalan.status] || s.latestHafalan.status
      : "-";

    const tglMurajaah = s.nextMurajaah
      ? new Date(s.nextMurajaah.tanggalMurajaah).toLocaleDateString("id-ID", {
          day: "numeric",
          month: "long",
          year: "numeric",
        })
      : "Sesuai Jadwal Rutin";

    const murajaahLengkap = s.nextMurajaah
      ? `${tglMurajaah} (${murajaahMateri})`
      : tglMurajaah;

    const tglSetor = s.latestHafalan
      ? new Date(s.latestHafalan.tanggal).toLocaleDateString("id-ID", {
          day: "numeric",
          month: "long",
          year: "numeric",
        })
      : "-";

    const catatanText = s.latestHafalan?.catatan || "Tidak ada catatan khusus.";

    if (template === "reminder") {
      return (
        `Assalamu'alaikum Wr. Wb.\n\n` +
        `Mengingatkan jadwal Murajaah Hafalan Al-Qur'an untuk ananda *${s.nama}*.\n\n` +
        `📖 *Materi Murajaah*: ${murajaahMateri}\n` +
        `📅 *Tanggal Murajaah*: ${tglMurajaah}\n` +
        `📊 *Status Setoran Terakhir*: ${statusText}\n\n` +
        `Mohon untuk dapat dibimbing dan disimak murajaahnya di rumah. Terima kasih.\nBarakallahu fiikum.`
      );
    }

    if (template === "evaluasi") {
      return (
        `Assalamu'alaikum Wr. Wb.\n\n` +
        `Berikut pemberitahuan evaluasi perkembangan hafalan santri atas nama *${s.nama}*:\n\n` +
        `📖 *Setoran Terakhir*: ${hafalanText}\n` +
        `📊 *Hasil Evaluasi*: ${statusText}\n` +
        `🗓️ *Tanggal Setor*: ${tglSetor}\n` +
        `📝 *Catatan Guru*: ${catatanText}\n\n` +
        `📖 *Materi Murajaah Berikutnya*: ${murajaahMateri}\n` +
        `📅 *Tanggal Murajaah*: ${tglMurajaah}\n\n` +
        `Mohon senantiasa dimonitoring murajaahnya di rumah. Barakallahu fiikum.`
      );
    }

    return customText
      .replace(/\{nama\}/g, s.nama)
      .replace(/\{nis\}/g, s.nis)
      .replace(/\{hafalan\}/g, hafalanText)
      .replace(/\{materi_murajaah\}/g, murajaahMateri)
      .replace(/\{status\}/g, statusText)
      .replace(/\{catatan\}/g, catatanText)
      .replace(/\{tanggal_murajaah\}/g, tglMurajaah)
      .replace(/\{murajaah_lengkap\}/g, murajaahLengkap)
      .replace(/\{tanggal_setor\}/g, tglSetor);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (selectedIds.length === 0) {
      alert("Pilih minimal satu santri yang memiliki nomor WhatsApp.");
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);

    const items = selectedIds.map((id) => {
      const s = santriList.find((item) => item.id === id)!;
      const phone = s.whatsappNumber || s.kontakWali || "";
      return {
        santriId: s.id,
        phone,
        message: formatMessageBody(s),
      };
    });

    try {
      const res = await fetch("/api/whatsapp/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items }),
      });

      const data = await res.json();
      if (res.ok) {
        setResult(data);
      } else {
        setError(data.error || "Gagal mengirim pesan massal.");
      }
    } catch {
      setError("Terjadi kesalahan jaringan.");
    } finally {
      setLoading(false);
    }
  }

  const samplePreviewSantri = selectedIds.length > 0
    ? santriList.find((s) => s.id === selectedIds[0])
    : santriList.find((s) => s.latestHafalan || s.nextMurajaah) || santriList[0];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-800">Pesan Massal WhatsApp Murajaah</h2>
        <p className="text-slate-500 text-sm">
          Kirim notifikasi pengingat & evaluasi murajaah otomatis beserta data hafalan santri ke wali murid.
        </p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-700 rounded-lg text-sm font-medium">
          {error}
        </div>
      )}

      {result && (
        <div
          className={`p-4 rounded-lg text-sm space-y-2 border ${
            result.failureCount > 0
              ? "bg-amber-50 border-amber-200 text-amber-900"
              : "bg-emerald-50 border-emerald-200 text-emerald-800"
          }`}
        >
          <p className="font-bold">
            {result.failureCount === 0
              ? "✓ Pengiriman Selesai!"
              : result.successCount > 0
              ? "⚠️ Pengiriman Selesai dengan Sebagian Gagal"
              : "❌ Pengiriman Selesai dengan Gagal"}
          </p>
          <p>
            Berhasil: <strong>{result.successCount}</strong> / Gagal:{" "}
            <strong>{result.failureCount}</strong> (Total: {result.total})
          </p>
          {result.details && result.details.filter((d) => !d.success).length > 0 && (
            <div className="mt-2 text-xs space-y-1 bg-white/70 p-2.5 rounded border border-amber-200/80 max-h-36 overflow-y-auto">
              <p className="font-semibold text-amber-900">Rincian Penyebab Gagal:</p>
              {result.details
                .filter((d) => !d.success)
                .map((d, idx) => {
                  const s = santriList.find((item) => item.id === d.santriId);
                  return (
                    <p key={idx} className="text-red-600 font-mono">
                      • {s ? s.nama : d.santriId} ({d.phone || "No HP Kosong"}): {d.error || "Gagal"}
                    </p>
                  );
                })}
            </div>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Template Selector */}
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-slate-700">
            Pilih Template Pesan
          </label>
          <select
            value={template}
            onChange={(e) => setTemplate(e.target.value)}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800 text-sm font-medium"
          >
            <option value="reminder">Pengingat Jadwal Murajaah + Data Hafalan Terakhir</option>
            <option value="evaluasi">Evaluasi Perkembangan Hafalan + Catatan Guru</option>
            <option value="custom">Custom (Gunakan tag {`{nama}`}, {`{hafalan}`}, {`{status}`}, {`{catatan}`}, {`{tanggal_murajaah}`})</option>
          </select>
        </div>

        {template === "custom" && (
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-slate-700">
              Pesan Kustom
            </label>
            <p className="text-xs text-slate-500">
              Variabel yang dapat digunakan: <code className="bg-slate-100 px-1 py-0.5 rounded text-emerald-700 font-mono">{`{nama}`}</code>, <code className="bg-slate-100 px-1 py-0.5 rounded text-emerald-700 font-mono">{`{hafalan}`}</code>, <code className="bg-slate-100 px-1 py-0.5 rounded text-emerald-700 font-mono">{`{status}`}</code>, <code className="bg-slate-100 px-1 py-0.5 rounded text-emerald-700 font-mono">{`{catatan}`}</code>, <code className="bg-slate-100 px-1 py-0.5 rounded text-emerald-700 font-mono">{`{tanggal_murajaah}`}</code>
            </p>
            <textarea
              rows={4}
              value={customText}
              onChange={(e) => setCustomText(e.target.value)}
              placeholder="Contoh: Assalamu'alaikum, mohon murajaah ananda {nama} pada {hafalan} ditingkatkan..."
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
              required
            />
          </div>
        )}

        {/* Real-time Message Preview Box */}
        {samplePreviewSantri && (
          <div className="bg-slate-900 text-slate-100 p-4 rounded-xl space-y-2 font-sans border border-slate-700">
            <div className="flex items-center justify-between text-xs text-slate-400 pb-2 border-b border-slate-800">
              <span className="font-semibold uppercase tracking-wider text-emerald-400">
                💬 Pratinjau Pesan WhatsApp ({samplePreviewSantri.nama})
              </span>
              <span>WhatsApp Web Preview</span>
            </div>
            <pre className="text-xs sm:text-sm whitespace-pre-wrap font-sans text-slate-200 leading-relaxed bg-slate-800/80 p-3 rounded-lg border border-slate-700/60">
              {formatMessageBody(samplePreviewSantri)}
            </pre>
          </div>
        )}

        {/* Santri Checklist Table */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-semibold text-slate-700">
              Pilih Santri Penerima ({selectedIds.length} terpilih)
            </label>
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <input
                type="checkbox"
                id="select-all"
                onChange={(e) => handleSelectAll(e.target.checked)}
                className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
              />
              <label htmlFor="select-all" className="cursor-pointer">Pilih Semua</label>
            </div>
          </div>

          <div className="border border-slate-200 rounded-lg max-h-72 overflow-y-auto divide-y divide-slate-100">
            {fetching ? (
              <div className="p-4 text-center text-slate-400">Memuat data santri...</div>
            ) : santriList.length === 0 ? (
              <div className="p-4 text-center text-slate-400">Tidak ada santri ditemukan.</div>
            ) : (
              santriList.map((s) => {
                const phone = s.whatsappNumber || s.kontakWali;
                const hasPhone = Boolean(phone);
                const hafalanInfo = s.latestHafalan
                  ? `${s.latestHafalan.surahNama} (${s.latestHafalan.ayatStart}-${s.latestHafalan.ayatEnd})`
                  : null;
                const murajaahInfo = s.nextMurajaah
                  ? s.nextMurajaah.tanggalMurajaah
                  : null;

                return (
                  <div
                    key={s.id}
                    className={`flex items-center justify-between p-3 transition ${
                      hasPhone ? "hover:bg-slate-50 cursor-pointer" : "bg-slate-50 opacity-60"
                    }`}
                    onClick={() => hasPhone && toggleSelect(s.id)}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(s.id)}
                        disabled={!hasPhone}
                        onChange={() => {}}
                        className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                      />
                      <div>
                        <p className="font-medium text-slate-800 text-sm">{s.nama}</p>
                        <p className="text-xs text-slate-500 flex items-center gap-2">
                          <span>NIS: {s.nis}</span>
                          {hafalanInfo && (
                            <span className="text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded font-mono">
                              📖 {hafalanInfo}
                            </span>
                          )}
                          {murajaahInfo && (
                            <span className="text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded font-mono">
                              📅 {murajaahInfo}
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span
                        className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                          hasPhone
                            ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                            : "bg-slate-200 text-slate-600"
                        }`}
                      >
                        {phone || "Tanpa No. WA"}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || selectedIds.length === 0}
          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-4 rounded-xl shadow-md transition disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading ? (
            <span>Mengirim Pesan WhatsApp ({selectedIds.length} Santri)...</span>
          ) : (
            <span>🚀 Kirim Pesan WhatsApp Massal ({selectedIds.length} Santri)</span>
          )}
        </button>
      </form>
    </div>
  );
}

