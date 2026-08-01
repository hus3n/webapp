"use client";

import { useCallback, useEffect, useState } from "react";

type StatusBreakdown = {
  lancar: number;
  kurang_lancar: number;
  tidak_lancar: number;
};

type Stats = {
  totalHafalan: number;
  totalSantri: number;
  totalSurah: number;
  totalAyat: number;
  statusBreakdown: StatusBreakdown;
};

type PerGuru = { guruId: string; guruNama: string; total: number };
type PerKelas = { kelasId: string; kelasNama: string; total: number };

type Recent = {
  id: string;
  tanggal: string;
  surah: number;
  ayatStart: number;
  ayatEnd: number;
  status: keyof StatusBreakdown;
  santriNama: string;
  santriNis: string;
  guruNama: string;
  kelasNama: string;
};

type DashboardData = {
  stats: Stats;
  perGuru: PerGuru[];
  perKelas: PerKelas[];
  recent: Recent[];
};

const STATUS_LABELS: Record<keyof StatusBreakdown, string> = {
  lancar: "Lancar",
  kurang_lancar: "Kurang Lancar",
  tidak_lancar: "Tidak Lancar",
};

const STATUS_BAR_COLORS: Record<keyof StatusBreakdown, string> = {
  lancar: "bg-green-500",
  kurang_lancar: "bg-amber-500",
  tidak_lancar: "bg-red-500",
};

function formatDate(value: string): string {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function StatCard({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-md border border-neutral-200 bg-white p-4">
      <p className="text-sm text-neutral-500">{label}</p>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
}

function RankBar({
  label,
  value,
  max,
}: {
  label: string;
  value: number;
  max: number;
}) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="w-32 truncate text-sm">{label}</span>
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-neutral-100">
        <div
          className="h-full rounded-full bg-neutral-800"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="w-10 text-right text-sm text-neutral-500">{value}</span>
    </div>
  );
}

export default function HafalanDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [kelasList, setKelasList] = useState<{ id: string; namaKelas: string }[]>([]);
  const [guruList, setGuruList] = useState<{ id: string; nama: string }[]>([]);
  const [kelasId, setKelasId] = useState("");
  const [guruId, setGuruId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (kelasId) params.set("kelasId", kelasId);
      if (guruId) params.set("guruId", guruId);
      const qs = params.toString();
      const res = await fetch(`/api/hafalan/dashboard${qs ? `?${qs}` : ""}`);
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
  }, [kelasId, guruId]);

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

  const statusTotal = data
    ? data.stats.statusBreakdown.lancar +
      data.stats.statusBreakdown.kurang_lancar +
      data.stats.statusBreakdown.tidak_lancar
    : 0;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Dashboard Hafalan</h1>
          <p className="text-sm text-neutral-500">
            Statistik hafalan santri.
          </p>
        </div>
        <div className="flex gap-2">
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
        </div>
      </div>

      {error && (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      {loading ? (
        <p className="text-sm text-neutral-500">Memuat...</p>
      ) : data ? (
        <>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <StatCard label="Total Hafalan" value={data.stats.totalHafalan} />
            <StatCard label="Santri" value={data.stats.totalSantri} />
            <StatCard label="Surah Dihafal" value={data.stats.totalSurah} />
            <StatCard label="Total Ayat" value={data.stats.totalAyat} />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-md border border-neutral-200 bg-white p-4">
              <h2 className="mb-3 font-semibold">Status Hafalan</h2>
              <div className="flex flex-col gap-3">
                {(Object.keys(data.stats.statusBreakdown) as (keyof StatusBreakdown)[]).map(
                  (key) => (
                    <div key={key} className="flex items-center gap-3">
                      <span className="w-32 text-sm">{STATUS_LABELS[key]}</span>
                      <div className="h-2 flex-1 overflow-hidden rounded-full bg-neutral-100">
                        <div
                          className={`h-full rounded-full ${STATUS_BAR_COLORS[key]}`}
                          style={{
                            width: `${statusTotal > 0 ? (data.stats.statusBreakdown[key] / statusTotal) * 100 : 0}%`,
                          }}
                        />
                      </div>
                      <span className="w-10 text-right text-sm text-neutral-500">
                        {data.stats.statusBreakdown[key]}
                      </span>
                    </div>
                  )
                )}
              </div>
            </div>

            <div className="rounded-md border border-neutral-200 bg-white p-4">
              <h2 className="mb-3 font-semibold">Per Kelas</h2>
              {data.perKelas.length === 0 ? (
                <p className="text-sm text-neutral-500">Tidak ada data.</p>
              ) : (
                <div className="flex flex-col gap-3">
                  {data.perKelas.map((k) => (
                    <RankBar
                      key={k.kelasId}
                      label={k.kelasNama}
                      value={k.total}
                      max={data.perKelas[0].total}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="rounded-md border border-neutral-200 bg-white p-4">
            <h2 className="mb-3 font-semibold">Per Guru</h2>
            {data.perGuru.length === 0 ? (
              <p className="text-sm text-neutral-500">Tidak ada data.</p>
            ) : (
              <div className="flex flex-col gap-3">
                {data.perGuru.map((g) => (
                  <RankBar
                    key={g.guruId}
                    label={g.guruNama}
                    value={g.total}
                    max={data.perGuru[0].total}
                  />
                ))}
              </div>
            )}
          </div>

          <div className="overflow-x-auto rounded-md border border-neutral-200">
            <table className="w-full bg-white text-sm">
              <thead className="bg-neutral-50 text-left text-xs uppercase tracking-wide text-neutral-500">
                <tr>
                  <th className="px-4 py-2">Tanggal</th>
                  <th className="px-4 py-2">Santri</th>
                  <th className="px-4 py-2">Kelas</th>
                  <th className="px-4 py-2">Surah</th>
                  <th className="px-4 py-2">Ayat</th>
                  <th className="px-4 py-2">Status</th>
                  <th className="px-4 py-2">Guru</th>
                </tr>
              </thead>
              <tbody>
                {data.recent.map((r) => (
                  <tr key={r.id} className="border-t border-neutral-200">
                    <td className="px-4 py-2">{formatDate(r.tanggal)}</td>
                    <td className="px-4 py-2 font-medium">
                      {r.santriNama}{" "}
                      <span className="text-xs text-neutral-400">
                        ({r.santriNis})
                      </span>
                    </td>
                    <td className="px-4 py-2">{r.kelasNama}</td>
                    <td className="px-4 py-2">{r.surah}</td>
                    <td className="px-4 py-2">
                      {r.ayatStart}-{r.ayatEnd}
                    </td>
                    <td className="px-4 py-2">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs ${
                          r.status === "lancar"
                            ? "bg-green-100 text-green-700"
                            : r.status === "kurang_lancar"
                              ? "bg-amber-100 text-amber-700"
                              : "bg-red-100 text-red-700"
                        }`}
                      >
                        {STATUS_LABELS[r.status]}
                      </span>
                    </td>
                    <td className="px-4 py-2">{r.guruNama}</td>
                  </tr>
                ))}
                {data.recent.length === 0 && (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-4 py-6 text-center text-neutral-500"
                    >
                      Belum ada data.
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
