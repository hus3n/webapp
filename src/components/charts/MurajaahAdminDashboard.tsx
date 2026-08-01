"use client";

import { useCallback, useEffect, useState } from "react";

function StatCard({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-md border border-neutral-200 bg-white p-4">
      <p className="text-sm text-neutral-500">{label}</p>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
}

type Stats = {
  total: number;
  pending: number;
  completed: number;
  missed: number;
  completionRate: number;
};

type PerGuru = {
  guruId: string;
  guruNama: string;
  total: number;
  completed: number;
  missed: number;
  pending: number;
};

type PerKelas = {
  kelasId: string;
  kelasNama: string;
  total: number;
  completed: number;
  missed: number;
  pending: number;
};

type Upcoming = {
  id: string;
  tanggalMurajaah: string;
  santriNama: string;
  santriNis: string;
  kelasNama: string;
  guruNama: string;
  surah: number;
  ayatStart: number;
  ayatEnd: number;
  status: "pending" | "completed" | "missed";
};

type DashboardData = {
  stats: Stats;
  perGuru: PerGuru[];
  perKelas: PerKelas[];
  upcoming: Upcoming[];
};

const STATUS_LABELS = { pending: "Menunggu", completed: "Selesai", missed: "Terlewat" };

function formatDate(value: string): string {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function MurajaahAdminDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [kelasList, setKelasList] = useState<{ id: string; namaKelas: string }[]>([]);
  const [guruList, setGuruList] = useState<{ id: string; nama: string }[]>([]);
  const [kelasId, setKelasId] = useState("");
  const [guruId, setGuruId] = useState("");
  const [month, setMonth] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (kelasId) params.set("kelasId", kelasId);
      if (guruId) params.set("guruId", guruId);
      if (month) params.set("month", month);
      const qs = params.toString();
      const res = await fetch(`/api/murajaah/dashboard${qs ? `?${qs}` : ""}`);
      const d = await res.json();
      if (!res.ok) {
        setError(d.error ?? "Gagal memuat data");
        setData(null);
      } else {
        setData(d);
      }
    } catch {
      setError("Terjadi kesalahan saat memuat data");
    } finally {
      setLoading(false);
    }
  }, [kelasId, guruId, month]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    fetch("/api/kelas")
      .then((r) => r.json())
      .then((d) => {
        if (d.kelas) setKelasList(d.kelas);
      })
      .catch(() => {});
    fetch("/api/users?role=guru")
      .then((r) => r.json())
      .then((d) => {
        if (d.users) setGuruList(d.users);
      })
      .catch(() => {});
  }, []);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard Murajaah Admin</h1>
        <p className="text-sm text-neutral-500">
          Statistik jadwal murajaah semua guru per kelas dan bulan.
        </p>
      </div>

      {error && (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-4">
        <select
          value={kelasId}
          onChange={(e) => setKelasId(e.target.value)}
          className="rounded-md border border-neutral-300 px-3 py-2 text-sm"
        >
          <option value="">Semua Kelas</option>
          {kelasList.map((k) => (
            <option key={k.id} value={k.id}>
              {k.namaKelas}
            </option>
          ))}
        </select>
        <select
          value={guruId}
          onChange={(e) => setGuruId(e.target.value)}
          className="rounded-md border border-neutral-300 px-3 py-2 text-sm"
        >
          <option value="">Semua Guru</option>
          {guruList.map((g) => (
            <option key={g.id} value={g.id}>
              {g.nama}
            </option>
          ))}
        </select>
        <select
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          className="rounded-md border border-neutral-300 px-3 py-2 text-sm"
        >
          <option value="">Semua Bulan</option>
          {Array.from({ length: 12 }, (_, i) => {
            const m = i + 1;
            const year = new Date().getFullYear();
            return `${year}-${m.toString().padStart(2, "0")}`;
          }).map((v) => (
            <option key={v} value={v}>
              {v}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <p className="text-sm text-neutral-500">Memuat...</p>
      ) : data ? (
        <>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
            <StatCard label="Total" value={data.stats.total} />
            <StatCard label="Menunggu" value={data.stats.pending} />
            <StatCard label="Selesai" value={data.stats.completed} />
            <StatCard label="Terlewat" value={data.stats.missed} />
            <StatCard label="Completion Rate" value={`${data.stats.completionRate}%`} />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-md border border-neutral-200 bg-white p-4">
              <h2 className="mb-3 font-semibold">Per Guru</h2>
              {data.perGuru.length === 0 ? (
                <p className="text-sm text-neutral-500">Tidak ada data.</p>
              ) : (
                <div className="flex flex-col gap-3">
                  {data.perGuru.map((g) => (
                    <div key={g.guruId} className="flex items-center gap-3">
                      <span className="w-32 truncate text-sm">{g.guruNama}</span>
                      <div className="h-2 flex-1 overflow-hidden rounded-full bg-neutral-100">
                        <div
                          className="h-full rounded-full bg-neutral-800"
                          style={{ width: `${g.total > 0 ? (g.completed / g.total) * 100 : 0}%` }}
                        />
                      </div>
                      <span className="w-10 text-right text-sm text-neutral-500">
                        {g.completed}/{g.total}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-md border border-neutral-200 bg-white p-4">
              <h2 className="mb-3 font-semibold">Per Kelas</h2>
              {data.perKelas.length === 0 ? (
                <p className="text-sm text-neutral-500">Tidak ada data.</p>
              ) : (
                <div className="flex flex-col gap-3">
                  {data.perKelas.map((k) => (
                    <div key={k.kelasId} className="flex items-center gap-3">
                      <span className="w-32 truncate text-sm">{k.kelasNama}</span>
                      <div className="h-2 flex-1 overflow-hidden rounded-full bg-neutral-100">
                        <div
                          className="h-full rounded-full bg-neutral-800"
                          style={{ width: `${k.total > 0 ? (k.completed / k.total) * 100 : 0}%` }}
                        />
                      </div>
                      <span className="w-10 text-right text-sm text-neutral-500">
                        {k.completed}/{k.total}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
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
                </tr>
              </thead>
              <tbody>
                {data.upcoming.map((u) => (
                  <tr key={u.id} className="border-t border-neutral-200">
                    <td className="px-4 py-2">{formatDate(u.tanggalMurajaah)}</td>
                    <td className="px-4 py-2 font-medium">
                      {u.santriNama}{" "}
                      <span className="text-xs text-neutral-400">
                        ({u.santriNis})
                      </span>
                    </td>
                    <td className="px-4 py-2">{u.kelasNama}</td>
                    <td className="px-4 py-2">
                      Surah {u.surah} : {u.ayatStart}-{u.ayatEnd}
                    </td>
                    <td className="px-4 py-2">{u.guruNama}</td>
                    <td className="px-4 py-2">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs ${
                          u.status === "pending"
                            ? "bg-blue-100 text-blue-700"
                            : u.status === "completed"
                              ? "bg-green-100 text-green-700"
                              : "bg-red-100 text-red-700"
                        }`}
                      >
                        {STATUS_LABELS[u.status]}
                      </span>
                    </td>
                  </tr>
                ))}
                {data.upcoming.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-4 py-6 text-center text-neutral-500"
                    >
                      Tidak ada jadwal mendatang.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      ) : null}
    </div>
  );
}