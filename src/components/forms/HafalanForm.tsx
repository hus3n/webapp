"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";

type Santri = { id: string; nama: string; nis: string; kelasNama: string | null };

type Hafalan = {
  id: string;
  santriId: string;
  guruId: string;
  tanggal: string;
  surah: number;
  ayatStart: number;
  ayatEnd: number;
  status: "lancar" | "kurang_lancar" | "tidak_lancar";
  catatan: string | null;
  createdAt: string;
};

const STATUS_LABELS: Record<Hafalan["status"], string> = {
  lancar: "Lancar",
  kurang_lancar: "Kurang Lancar",
  tidak_lancar: "Tidak Lancar",
};

const STATUS_STYLES: Record<Hafalan["status"], string> = {
  lancar: "bg-green-100 text-green-700",
  kurang_lancar: "bg-amber-100 text-amber-700",
  tidak_lancar: "bg-red-100 text-red-700",
};

const EMPTY_FORM = {
  tanggal: new Date().toISOString().slice(0, 10),
  surah: "1",
  ayatStart: "1",
  ayatEnd: "1",
  status: "lancar" as Hafalan["status"],
  catatan: "",
};

function todayString(): string {
  return new Date().toISOString().slice(0, 10);
}

function formatDate(value: string): string {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function HafalanManagement() {
  const [santriList, setSantriList] = useState<Santri[]>([]);
  const [selectedSantriId, setSelectedSantriId] = useState("");
  const [hafalanList, setHafalanList] = useState<Hafalan[]>([]);
  const [loadingSantri, setLoadingSantri] = useState(true);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editTarget, setEditTarget] = useState<Hafalan | null>(null);

  const loadSantri = useCallback(async () => {
    setLoadingSantri(true);
    try {
      const res = await fetch("/api/santri");
      const data = await res.json();
      if (res.ok) setSantriList(data.santri ?? []);
    } catch {
      setError("Gagal memuat daftar santri");
    } finally {
      setLoadingSantri(false);
    }
  }, []);

  useEffect(() => {
    loadSantri();
  }, [loadSantri]);

  const loadHistory = useCallback(async (santriId: string) => {
    setLoadingHistory(true);
    setError(null);
    try {
      const res = await fetch(`/api/hafalan/history/${santriId}?limit=100`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Gagal memuat riwayat");
        setHafalanList([]);
      } else {
        setHafalanList(data.hafalan ?? []);
      }
    } catch {
      setError("Terjadi kesalahan saat memuat riwayat");
    } finally {
      setLoadingHistory(false);
    }
  }, []);

  useEffect(() => {
    if (selectedSantriId) {
      loadHistory(selectedSantriId);
    } else {
      setHafalanList([]);
    }
  }, [selectedSantriId, loadHistory]);

  async function handleDelete(hafalan: Hafalan) {
    if (!window.confirm("Hapus catatan hafalan ini?")) return;
    setError(null);
    try {
      const res = await fetch(`/api/hafalan/${hafalan.id}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Gagal menghapus");
        return;
      }
      setHafalanList((prev) => prev.filter((h) => h.id !== hafalan.id));
    } catch {
      setError("Terjadi kesalahan saat menghapus");
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">Input Hafalan</h1>
        <p className="text-sm text-neutral-500">
          Catat hafalan baru dan lihat riwayat santri.
        </p>
      </div>

      {error && (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <div className="flex items-center gap-2">
        <label
          htmlFor="santriId"
          className="text-sm font-medium text-neutral-600"
        >
          Santri
        </label>
        <select
          id="santriId"
          value={selectedSantriId}
          onChange={(e) => setSelectedSantriId(e.target.value)}
          className="rounded-md border border-neutral-300 px-3 py-2 text-sm"
        >
          <option value="">
            {loadingSantri ? "Memuat santri..." : "Pilih Santri..."}
          </option>
          {santriList.map((s) => (
            <option key={s.id} value={s.id}>
              {s.nama} ({s.nis}) - {s.kelasNama ?? "-"}
            </option>
          ))}
        </select>
      </div>

      {selectedSantriId && (
        <HafalanCreateForm
          santriId={selectedSantriId}
          onCreated={async () => loadHistory(selectedSantriId)}
        />
      )}

      <div className="overflow-x-auto rounded-md border border-neutral-200">
        <table className="w-full text-sm">
          <thead className="bg-neutral-50 text-left text-xs uppercase tracking-wide text-neutral-500">
            <tr>
              <th className="px-4 py-2">Tanggal</th>
              <th className="px-4 py-2">Surah</th>
              <th className="px-4 py-2">Ayat</th>
              <th className="px-4 py-2">Status</th>
              <th className="px-4 py-2">Catatan</th>
              <th className="px-4 py-2 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {!selectedSantriId ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-6 text-center text-neutral-500"
                >
                  Pilih santri untuk melihat riwayat.
                </td>
              </tr>
            ) : loadingHistory ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-6 text-center text-neutral-500"
                >
                  Memuat...
                </td>
              </tr>
            ) : hafalanList.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-6 text-center text-neutral-500"
                >
                  Belum ada catatan hafalan.
                </td>
              </tr>
            ) : (
              hafalanList.map((h) => (
                <tr key={h.id} className="border-t border-neutral-200">
                  <td className="px-4 py-2">{formatDate(h.tanggal)}</td>
                  <td className="px-4 py-2">Surah {h.surah}</td>
                  <td className="px-4 py-2">
                    Ayat {h.ayatStart}-{h.ayatEnd}
                  </td>
                  <td className="px-4 py-2">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs ${STATUS_STYLES[h.status]}`}
                    >
                      {STATUS_LABELS[h.status]}
                    </span>
                  </td>
                  <td className="px-4 py-2">{h.catatan ?? "-"}</td>
                  <td className="px-4 py-2">
                    <div className="flex justify-end gap-3">
                      <button
                        onClick={() => setEditTarget(h)}
                        className="text-blue-600 hover:underline"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(h)}
                        className="text-red-600 hover:underline"
                      >
                        Hapus
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {editTarget && (
        <EditHafalanForm
          hafalan={editTarget}
          onClose={() => setEditTarget(null)}
          onSaved={async () => {
            setEditTarget(null);
            await loadHistory(selectedSantriId);
          }}
        />
      )}
    </div>
  );
}

function HafalanCreateForm({
  santriId,
  onCreated,
}: {
  santriId: string;
  onCreated: () => Promise<void>;
}) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    setForm({ ...EMPTY_FORM, tanggal: todayString() });
    setLocalError(null);
  }, [santriId]);

  function setField<K extends keyof typeof form>(key: K, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLocalError(null);

    const surah = Number(form.surah);
    const ayatStart = Number(form.ayatStart);
    const ayatEnd = Number(form.ayatEnd);

    if (!form.tanggal) {
      setLocalError("Tanggal wajib diisi");
      return;
    }
    if (!Number.isInteger(surah) || surah < 1 || surah > 114) {
      setLocalError("Surah harus antara 1 - 114");
      return;
    }
    if (!Number.isInteger(ayatStart) || ayatStart < 1) {
      setLocalError("Ayat awal harus minimal 1");
      return;
    }
    if (!Number.isInteger(ayatEnd) || ayatEnd < ayatStart) {
      setLocalError("Ayat akhir tidak boleh kurang dari ayat awal");
      return;
    }
    if (form.tanggal > todayString()) {
      setLocalError("Tanggal tidak boleh di masa depan");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/hafalan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          santriId,
          tanggal: form.tanggal,
          surah,
          ayatStart,
          ayatEnd,
          status: form.status,
          catatan: form.catatan || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setLocalError(data.error ?? "Gagal menyimpan");
        return;
      }
      setForm({ ...EMPTY_FORM, tanggal: todayString() });
      await onCreated();
    } catch {
      setLocalError("Terjadi kesalahan, coba lagi");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="flex flex-col gap-4 rounded-md border border-neutral-200 bg-neutral-50 p-4"
    >
      <h2 className="font-semibold">Hafalan Baru</h2>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <div>
          <label htmlFor="tanggal" className="mb-1 block text-sm font-medium">
            Tanggal
          </label>
          <input
            id="tanggal"
            type="date"
            required
            max={todayString()}
            value={form.tanggal}
            onChange={(e) => setField("tanggal", e.target.value)}
            className="w-full rounded-md border border-neutral-300 px-3 py-2"
          />
        </div>
        <div>
          <label htmlFor="surah" className="mb-1 block text-sm font-medium">
            Surah (1-114)
          </label>
          <input
            id="surah"
            type="number"
            required
            min={1}
            max={114}
            value={form.surah}
            onChange={(e) => setField("surah", e.target.value)}
            className="w-full rounded-md border border-neutral-300 px-3 py-2"
          />
        </div>
        <div>
          <label htmlFor="status" className="mb-1 block text-sm font-medium">
            Status
          </label>
          <select
            id="status"
            value={form.status}
            onChange={(e) =>
              setField("status", e.target.value as Hafalan["status"])
            }
            className="w-full rounded-md border border-neutral-300 px-3 py-2"
          >
            <option value="lancar">Lancar</option>
            <option value="kurang_lancar">Kurang Lancar</option>
            <option value="tidak_lancar">Tidak Lancar</option>
          </select>
        </div>
        <div>
          <label htmlFor="ayatStart" className="mb-1 block text-sm font-medium">
            Ayat Awal
          </label>
          <input
            id="ayatStart"
            type="number"
            required
            min={1}
            value={form.ayatStart}
            onChange={(e) => setField("ayatStart", e.target.value)}
            className="w-full rounded-md border border-neutral-300 px-3 py-2"
          />
        </div>
        <div>
          <label htmlFor="ayatEnd" className="mb-1 block text-sm font-medium">
            Ayat Akhir
          </label>
          <input
            id="ayatEnd"
            type="number"
            required
            min={1}
            value={form.ayatEnd}
            onChange={(e) => setField("ayatEnd", e.target.value)}
            className="w-full rounded-md border border-neutral-300 px-3 py-2"
          />
        </div>
      </div>
      <div>
        <label htmlFor="catatan" className="mb-1 block text-sm font-medium">
          Catatan (opsional)
        </label>
        <textarea
          id="catatan"
          rows={2}
          value={form.catatan}
          onChange={(e) => setField("catatan", e.target.value)}
          className="w-full rounded-md border border-neutral-300 px-3 py-2"
        />
      </div>

      {localError && <p className="text-sm text-red-600">{localError}</p>}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={submitting}
          className="rounded-md bg-neutral-900 px-4 py-2 text-sm text-white hover:bg-neutral-700 disabled:opacity-50"
        >
          {submitting ? "Menyimpan..." : "Simpan Hafalan"}
        </button>
      </div>
    </form>
  );
}

function EditHafalanForm({
  hafalan,
  onClose,
  onSaved,
}: {
  hafalan: Hafalan;
  onClose: () => void;
  onSaved: () => Promise<void>;
}) {
  const [form, setForm] = useState({
    tanggal: hafalan.tanggal.slice(0, 10),
    surah: String(hafalan.surah),
    ayatStart: String(hafalan.ayatStart),
    ayatEnd: String(hafalan.ayatEnd),
    status: hafalan.status,
    catatan: hafalan.catatan ?? "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLocalError(null);

    const surah = Number(form.surah);
    const ayatStart = Number(form.ayatStart);
    const ayatEnd = Number(form.ayatEnd);

    if (!Number.isInteger(surah) || surah < 1 || surah > 114) {
      setLocalError("Surah harus antara 1 - 114");
      return;
    }
    if (ayatEnd < ayatStart) {
      setLocalError("Ayat akhir tidak boleh kurang dari ayat awal");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/hafalan/${hafalan.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tanggal: form.tanggal,
          surah,
          ayatStart,
          ayatEnd,
          status: form.status,
          catatan: form.catatan || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setLocalError(data.error ?? "Gagal menyimpan");
        return;
      }
      await onSaved();
    } catch {
      setLocalError("Terjadi kesalahan, coba lagi");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <form
        onSubmit={onSubmit}
        className="flex w-full max-w-md flex-col gap-4 rounded-md bg-white p-6"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold">Edit Hafalan</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup"
            className="text-neutral-400 hover:text-neutral-600"
          >
            &times;
          </button>
        </div>

        <div>
          <label htmlFor="e-tanggal" className="mb-1 block text-sm font-medium">
            Tanggal
          </label>
          <input
            id="e-tanggal"
            type="date"
            required
            value={form.tanggal}
            onChange={(e) => setForm((p) => ({ ...p, tanggal: e.target.value }))}
            className="w-full rounded-md border border-neutral-300 px-3 py-2"
          />
        </div>
        <div>
          <label htmlFor="e-surah" className="mb-1 block text-sm font-medium">
            Surah (1-114)
          </label>
          <input
            id="e-surah"
            type="number"
            required
            min={1}
            max={114}
            value={form.surah}
            onChange={(e) => setForm((p) => ({ ...p, surah: e.target.value }))}
            className="w-full rounded-md border border-neutral-300 px-3 py-2"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="e-ayatStart" className="mb-1 block text-sm font-medium">
              Ayat Awal
            </label>
            <input
              id="e-ayatStart"
              type="number"
              required
              min={1}
              value={form.ayatStart}
              onChange={(e) =>
                setForm((p) => ({ ...p, ayatStart: e.target.value }))
              }
              className="w-full rounded-md border border-neutral-300 px-3 py-2"
            />
          </div>
          <div>
            <label htmlFor="e-ayatEnd" className="mb-1 block text-sm font-medium">
              Ayat Akhir
            </label>
            <input
              id="e-ayatEnd"
              type="number"
              required
              min={1}
              value={form.ayatEnd}
              onChange={(e) =>
                setForm((p) => ({ ...p, ayatEnd: e.target.value }))
              }
              className="w-full rounded-md border border-neutral-300 px-3 py-2"
            />
          </div>
        </div>
        <div>
          <label htmlFor="e-status" className="mb-1 block text-sm font-medium">
            Status
          </label>
          <select
            id="e-status"
            value={form.status}
            onChange={(e) =>
              setForm((p) => ({
                ...p,
                status: e.target.value as Hafalan["status"],
              }))
            }
            className="w-full rounded-md border border-neutral-300 px-3 py-2"
          >
            <option value="lancar">Lancar</option>
            <option value="kurang_lancar">Kurang Lancar</option>
            <option value="tidak_lancar">Tidak Lancar</option>
          </select>
        </div>
        <div>
          <label htmlFor="e-catatan" className="mb-1 block text-sm font-medium">
            Catatan
          </label>
          <textarea
            id="e-catatan"
            rows={2}
            value={form.catatan}
            onChange={(e) =>
              setForm((p) => ({ ...p, catatan: e.target.value }))
            }
            className="w-full rounded-md border border-neutral-300 px-3 py-2"
          />
        </div>

        {localError && <p className="text-sm text-red-600">{localError}</p>}

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-neutral-300 px-4 py-2 text-sm"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="rounded-md bg-neutral-900 px-4 py-2 text-sm text-white hover:bg-neutral-700 disabled:opacity-50"
          >
            {submitting ? "Menyimpan..." : "Simpan"}
          </button>
        </div>
      </form>
    </div>
  );
}
