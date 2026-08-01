"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";

type Kelas = { id: string; namaKelas: string };

type Santri = {
  id: string;
  nama: string;
  nis: string;
  kelasId: string;
  kelasNama: string | null;
  kontakWali: string | null;
  whatsappNumber: string | null;
  createdAt: string | null;
};

type FormMode = { type: "create" } | { type: "edit"; santri: Santri };

export default function SantriManagement() {
  const [santriList, setSantriList] = useState<Santri[]>([]);
  const [kelasList, setKelasList] = useState<Kelas[]>([]);
  const [kelasFilter, setKelasFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formMode, setFormMode] = useState<FormMode | null>(null);

  const loadSantri = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const query = kelasFilter ? `?kelasId=${encodeURIComponent(kelasFilter)}` : "";
      const res = await fetch(`/api/santri${query}`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Gagal memuat data");
        setSantriList([]);
      } else {
        setSantriList(data.santri ?? []);
      }
    } catch {
      setError("Terjadi kesalahan saat memuat data");
    } finally {
      setLoading(false);
    }
  }, [kelasFilter]);

  const loadKelas = useCallback(async () => {
    try {
      const res = await fetch("/api/kelas");
      const data = await res.json();
      if (res.ok) setKelasList(data.kelas ?? []);
    } catch {
      // ignore, filter/form will show empty kelas list
    }
  }, []);

  useEffect(() => {
    loadKelas();
  }, [loadKelas]);

  useEffect(() => {
    loadSantri();
  }, [loadSantri]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Manajemen Santri</h1>
          <p className="text-sm text-neutral-500">
            Kelola data santri per kelas.
          </p>
        </div>
        <button
          onClick={() => setFormMode({ type: "create" })}
          className="rounded-md bg-neutral-900 px-4 py-2 text-sm text-white hover:bg-neutral-700"
        >
          + Tambah Santri
        </button>
      </div>

      <div className="flex items-center gap-2">
        <label
          htmlFor="kelasFilter"
          className="text-sm font-medium text-neutral-600"
        >
          Filter Kelas
        </label>
        <select
          id="kelasFilter"
          value={kelasFilter}
          onChange={(e) => setKelasFilter(e.target.value)}
          className="rounded-md border border-neutral-300 px-3 py-2 text-sm"
        >
          <option value="">Semua Kelas</option>
          {kelasList.map((k) => (
            <option key={k.id} value={k.id}>
              {k.namaKelas}
            </option>
          ))}
        </select>
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
              <th className="px-4 py-2">Nama</th>
              <th className="px-4 py-2">NIS</th>
              <th className="px-4 py-2">Kelas</th>
              <th className="px-4 py-2">Kontak Wali</th>
              <th className="px-4 py-2">WhatsApp</th>
              <th className="px-4 py-2 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-6 text-center text-neutral-500"
                >
                  Memuat...
                </td>
              </tr>
            ) : santriList.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-6 text-center text-neutral-500"
                >
                  Belum ada santri.
                </td>
              </tr>
            ) : (
              santriList.map((santri) => (
                <tr key={santri.id} className="border-t border-neutral-200">
                  <td className="px-4 py-2 font-medium">{santri.nama}</td>
                  <td className="px-4 py-2">{santri.nis}</td>
                  <td className="px-4 py-2">
                    <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs">
                      {santri.kelasNama ?? "-"}
                    </span>
                  </td>
                  <td className="px-4 py-2">{santri.kontakWali ?? "-"}</td>
                  <td className="px-4 py-2">{santri.whatsappNumber ?? "-"}</td>
                  <td className="px-4 py-2 text-right">
                    <button
                      onClick={() => setFormMode({ type: "edit", santri })}
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
        <SantriForm
          mode={formMode}
          kelasList={kelasList}
          onClose={() => setFormMode(null)}
          onSaved={loadSantri}
        />
      )}
    </div>
  );
}

function SantriForm({
  mode,
  kelasList,
  onClose,
  onSaved,
}: {
  mode: FormMode;
  kelasList: Kelas[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const editing = mode.type === "edit" ? mode.santri : null;

  const [nama, setNama] = useState(editing?.nama ?? "");
  const [nis, setNis] = useState(editing?.nis ?? "");
  const [kelasId, setKelasId] = useState(editing?.kelasId ?? "");
  const [kontakWali, setKontakWali] = useState(editing?.kontakWali ?? "");
  const [whatsappNumber, setWhatsappNumber] = useState(
    editing?.whatsappNumber ?? ""
  );
  const [submitting, setSubmitting] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLocalError(null);

    if (!nama.trim()) {
      setLocalError("Nama santri wajib diisi");
      return;
    }
    if (!nis.trim()) {
      setLocalError("NIS wajib diisi");
      return;
    }
    if (!kelasId) {
      setLocalError("Kelas wajib dipilih");
      return;
    }

    const body = {
      nama,
      nis,
      kelasId,
      kontakWali: kontakWali || undefined,
      whatsappNumber: whatsappNumber || undefined,
    };

    setSubmitting(true);
    try {
      if (mode.type === "create") {
        const res = await fetch("/api/santri", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        const data = await res.json();
        if (!res.ok) {
          setLocalError(data.error ?? "Gagal menyimpan");
          return;
        }
      } else {
        const res = await fetch(`/api/santri/${editing!.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
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
            {mode.type === "create" ? "Tambah Santri" : "Edit Santri"}
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
          <label htmlFor="nama" className="mb-1 block text-sm font-medium">
            Nama Santri
          </label>
          <input
            id="nama"
            required
            value={nama}
            onChange={(e) => setNama(e.target.value)}
            className="w-full rounded-md border border-neutral-300 px-3 py-2"
          />
        </div>
        <div>
          <label htmlFor="nis" className="mb-1 block text-sm font-medium">
            NIS
          </label>
          <input
            id="nis"
            required
            value={nis}
            onChange={(e) => setNis(e.target.value)}
            className="w-full rounded-md border border-neutral-300 px-3 py-2"
          />
        </div>
        <div>
          <label htmlFor="kelasId" className="mb-1 block text-sm font-medium">
            Kelas
          </label>
          <select
            id="kelasId"
            required
            value={kelasId}
            onChange={(e) => setKelasId(e.target.value)}
            className="w-full rounded-md border border-neutral-300 px-3 py-2"
          >
            <option value="">Pilih Kelas...</option>
            {kelasList.map((k) => (
              <option key={k.id} value={k.id}>
                {k.namaKelas}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="kontakWali" className="mb-1 block text-sm font-medium">
            Kontak Wali (opsional)
          </label>
          <input
            id="kontakWali"
            value={kontakWali}
            onChange={(e) => setKontakWali(e.target.value)}
            className="w-full rounded-md border border-neutral-300 px-3 py-2"
          />
        </div>
        <div>
          <label htmlFor="whatsapp" className="mb-1 block text-sm font-medium">
            WhatsApp (opsional)
          </label>
          <input
            id="whatsapp"
            placeholder="6281234567890"
            value={whatsappNumber}
            onChange={(e) => setWhatsappNumber(e.target.value)}
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
