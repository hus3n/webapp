"use client";

import { useCallback, useEffect, useState } from "react";

type Murajaah = {
  id: string;
  hafalanId: string;
  tanggalMurajaah: string;
  status: "pending" | "completed" | "missed";
  santriNama: string;
  santriNis: string;
  kelasNama: string;
  guruNama: string;
  surah: number;
  ayatStart: number;
  ayatEnd: number;
};

const STATUS_LABELS: Record<Murajaah["status"], string> = {
  pending: "Menunggu",
  completed: "Selesai",
  missed: "Terlewat",
};

const STATUS_STYLES: Record<Murajaah["status"], string> = {
  pending: "bg-blue-100 text-blue-700",
  completed: "bg-green-100 text-green-700",
  missed: "bg-red-100 text-red-700",
};

const FILTERS: { value: "" | Murajaah["status"]; label: string }[] = [
  { value: "", label: "Semua" },
  { value: "pending", label: "Menunggu" },
  { value: "completed", label: "Selesai" },
  { value: "missed", label: "Terlewat" },
];

function formatDate(value: string): string {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function MurajaahManagement() {
  const [list, setList] = useState<Murajaah[]>([]);
  const [filter, setFilter] = useState<"" | Murajaah["status"]>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const query = filter ? `?status=${filter}` : "";
      const res = await fetch(`/api/murajaah${query}`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Gagal memuat data");
        setList([]);
      } else {
        setList(data.murajaah ?? []);
      }
    } catch {
      setError("Terjadi kesalahan saat memuat data");
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    load();
  }, [load]);

  async function updateStatus(id: string, status: Murajaah["status"]) {
    setUpdatingId(id);
    setError(null);
    try {
      const res = await fetch(`/api/murajaah/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Gagal update status");
        return;
      }
      await load();
    } catch {
      setError("Terjadi kesalahan saat update");
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">Jadwal Murajaah</h1>
        <p className="text-sm text-neutral-500">
          Lihat dan update status murajaah santri.
        </p>
      </div>

      {error && (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`rounded-md px-3 py-1.5 text-sm ${
              filter === f.value
                ? "bg-neutral-900 text-white"
                : "border border-neutral-300 text-neutral-600 hover:bg-neutral-100"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="overflow-x-auto rounded-md border border-neutral-200">
        <table className="w-full bg-white text-sm">
          <thead className="bg-neutral-50 text-left text-xs uppercase tracking-wide text-neutral-500">
            <tr>
              <th className="px-4 py-2">Tanggal</th>
              <th className="px-4 py-2">Santri</th>
              <th className="px-4 py-2">Kelas</th>
              <th className="px-4 py-2">Materi</th>
              <th className="px-4 py-2">Guru</th>
              <th className="px-4 py-2">Status</th>
              <th className="px-4 py-2 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td
                  colSpan={7}
                  className="px-4 py-6 text-center text-neutral-500"
                >
                  Memuat...
                </td>
              </tr>
            ) : list.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="px-4 py-6 text-center text-neutral-500"
                >
                  Tidak ada jadwal.
                </td>
              </tr>
            ) : (
              list.map((m) => (
                <tr key={m.id} className="border-t border-neutral-200">
                  <td className="px-4 py-2">{formatDate(m.tanggalMurajaah)}</td>
                  <td className="px-4 py-2 font-medium">
                    {m.santriNama}{" "}
                    <span className="text-xs text-neutral-400">
                      ({m.santriNis})
                    </span>
                  </td>
                  <td className="px-4 py-2">{m.kelasNama}</td>
                  <td className="px-4 py-2">
                    Surah {m.surah} : {m.ayatStart}-{m.ayatEnd}
                  </td>
                  <td className="px-4 py-2">{m.guruNama}</td>
                  <td className="px-4 py-2">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs ${STATUS_STYLES[m.status]}`}
                    >
                      {STATUS_LABELS[m.status]}
                    </span>
                  </td>
                  <td className="px-4 py-2">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => updateStatus(m.id, "completed")}
                        disabled={updatingId === m.id || m.status === "completed"}
                        className="rounded-md border border-green-300 px-2 py-1 text-xs text-green-700 hover:bg-green-50 disabled:opacity-40"
                      >
                        Selesai
                      </button>
                      <button
                        onClick={() => updateStatus(m.id, "missed")}
                        disabled={updatingId === m.id || m.status === "missed"}
                        className="rounded-md border border-red-300 px-2 py-1 text-xs text-red-700 hover:bg-red-50 disabled:opacity-40"
                      >
                        Terlewat
                      </button>
                      {m.status !== "pending" && (
                        <button
                          onClick={() => updateStatus(m.id, "pending")}
                          disabled={updatingId === m.id}
                          className="rounded-md border border-neutral-300 px-2 py-1 text-xs text-neutral-600 hover:bg-neutral-50 disabled:opacity-40"
                        >
                          Reset
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
