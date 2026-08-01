"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";

type Guru = { id: string; nama: string; email: string };

type Kelas = {
  id: string;
  namaKelas: string;
  adminId: string;
  createdAt: string | null;
  gurus: Guru[];
};

type FormMode = { type: "create" } | { type: "edit"; kelas: Kelas };

function formatDate(value: string | null): string {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function KelasManagement() {
  const [kelasList, setKelasList] = useState<Kelas[]>([]);
  const [gurus, setGurus] = useState<Guru[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formMode, setFormMode] = useState<FormMode | null>(null);

  const loadKelas = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/kelas");
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Gagal memuat data");
        setKelasList([]);
      } else {
        setKelasList(data.kelas ?? []);
      }
    } catch {
      setError("Terjadi kesalahan saat memuat data");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadGurus = useCallback(async () => {
    try {
      const res = await fetch("/api/users?role=guru");
      const data = await res.json();
      if (res.ok) setGurus(data.users ?? []);
    } catch {
      // ignore, form will show empty guru list
    }
  }, []);

  useEffect(() => {
    loadKelas();
    loadGurus();
  }, [loadKelas, loadGurus]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Manajemen Kelas</h1>
          <p className="text-sm text-neutral-500">
            Kelola kelas dan assignment guru.
          </p>
        </div>
        <button
          onClick={() => setFormMode({ type: "create" })}
          className="rounded-md bg-neutral-900 px-4 py-2 text-sm text-white hover:bg-neutral-700"
        >
          + Tambah Kelas
        </button>
      </div>

      {error && (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <div className="overflow-x-auto rounded-md border border-neutral-200">
        <table className="w-full text-sm">
          <thead className="bg-neutral-50 text-left text-xs uppercase tracking-wide text-neutral-500">
            <tr>
              <th className="px-4 py-2">Nama Kelas</th>
              <th className="px-4 py-2">Guru</th>
              <th className="px-4 py-2">Dibuat</th>
              <th className="px-4 py-2 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td
                  colSpan={4}
                  className="px-4 py-6 text-center text-neutral-500"
                >
                  Memuat...
                </td>
              </tr>
            ) : kelasList.length === 0 ? (
              <tr>
                <td
                  colSpan={4}
                  className="px-4 py-6 text-center text-neutral-500"
                >
                  Belum ada kelas.
                </td>
              </tr>
            ) : (
              kelasList.map((kelas) => (
                <tr key={kelas.id} className="border-t border-neutral-200">
                  <td className="px-4 py-2 font-medium">{kelas.namaKelas}</td>
                  <td className="px-4 py-2">
                    {kelas.gurus.length === 0 ? (
                      <span className="text-neutral-400">-</span>
                    ) : (
                      <div className="flex flex-wrap gap-1">
                        {kelas.gurus.map((g) => (
                          <span
                            key={g.id}
                            className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs"
                          >
                            {g.nama}
                          </span>
                        ))}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-2">{formatDate(kelas.createdAt)}</td>
                  <td className="px-4 py-2 text-right">
                    <button
                      onClick={() => setFormMode({ type: "edit", kelas })}
                      className="text-blue-600 hover:underline"
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {formMode && (
        <KelasForm
          mode={formMode}
          gurus={gurus}
          onClose={() => setFormMode(null)}
          onSaved={loadKelas}
        />
      )}
    </div>
  );
}

function KelasForm({
  mode,
  gurus,
  onClose,
  onSaved,
}: {
  mode: FormMode;
  gurus: Guru[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const editing = mode.type === "edit" ? mode.kelas : null;

  const [namaKelas, setNamaKelas] = useState(editing?.namaKelas ?? "");
  const [selectedGuruIds, setSelectedGuruIds] = useState<Set<string>>(
    () => new Set(editing?.gurus.map((g) => g.id) ?? [])
  );
  const [submitting, setSubmitting] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  function toggleGuru(guruId: string) {
    setSelectedGuruIds((prev) => {
      const next = new Set(prev);
      if (next.has(guruId)) {
        next.delete(guruId);
      } else {
        next.add(guruId);
      }
      return next;
    });
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLocalError(null);

    if (!namaKelas.trim()) {
      setLocalError("Nama kelas wajib diisi");
      return;
    }

    const guruIds = [...selectedGuruIds];
    setSubmitting(true);
    try {
      if (mode.type === "create") {
        const res = await fetch("/api/kelas", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ namaKelas, guruIds }),
        });
        const data = await res.json();
        if (!res.ok) {
          setLocalError(data.error ?? "Gagal menyimpan");
          return;
        }
      } else {
        const res = await fetch(`/api/kelas/${editing!.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ namaKelas, guruIds }),
        });
        const data = await res.json();
        if (!res.ok) {
          setLocalError(data.error ?? "Gagal menyimpan");
          return;
        }
      }
      onSaved();
      onClose();
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
          <h2 className="text-lg font-bold">
            {mode.type === "create" ? "Tambah Kelas" : "Edit Kelas"}
          </h2>
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
          <label htmlFor="namaKelas" className="mb-1 block text-sm font-medium">
            Nama Kelas
          </label>
          <input
            id="namaKelas"
            required
            value={namaKelas}
            onChange={(e) => setNamaKelas(e.target.value)}
            className="w-full rounded-md border border-neutral-300 px-3 py-2"
          />
        </div>

        <div>
          <span className="mb-1 block text-sm font-medium">Guru</span>
          {gurus.length === 0 ? (
            <p className="text-sm text-neutral-500">
              Belum ada guru. Daftarkan guru terlebih dahulu.
            </p>
          ) : (
            <div className="flex max-h-48 flex-col gap-1 overflow-y-auto rounded-md border border-neutral-200 p-2">
              {gurus.map((g) => (
                <label
                  key={g.id}
                  className="flex items-center gap-2 rounded-md px-2 py-1 text-sm hover:bg-neutral-50"
                >
                  <input
                    type="checkbox"
                    checked={selectedGuruIds.has(g.id)}
                    onChange={() => toggleGuru(g.id)}
                    className="h-4 w-4"
                  />
                  {g.nama}
                  <span className="text-xs text-neutral-400">{g.email}</span>
                </label>
              ))}
            </div>
          )}
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
