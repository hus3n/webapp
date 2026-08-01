"use client";

import { useState, useEffect } from "react";

interface AuditLogItem {
  id: string;
  userId: string | null;
  userNama: string | null;
  action: string;
  tableName: string;
  recordId: string;
  oldData: string | null;
  newData: string | null;
  timestamp: string;
}

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchLogs();
  }, []);

  async function fetchLogs() {
    try {
      setLoading(true);
      const res = await fetch("/api/audit-logs");
      const data = await res.json();
      if (res.ok) {
        setLogs(data.logs || []);
      } else {
        setError(data.error || "Gagal memuat audit logs");
      }
    } catch {
      setError("Kesalahan koneksi server");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Audit Logs (Jejak Aktivitas)</h1>
        <p className="text-slate-500 text-sm">
          Pantau perubahan data, pembuatan, penyuntingan, dan penghapusan dalam sistem.
        </p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
              <tr>
                <th className="p-4">Waktu</th>
                <th className="p-4">Pengguna</th>
                <th className="p-4">Aksi</th>
                <th className="p-4">Tabel</th>
                <th className="p-4">Record ID</th>
                <th className="p-4">Detail Data</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-slate-400">
                    Memuat log aktivitas...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-slate-400">
                    Belum ada catatan aktivitas.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50">
                    <td className="p-4 text-xs font-mono text-slate-500 whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString("id-ID")}
                    </td>
                    <td className="p-4 font-medium text-slate-800">
                      {log.userNama || "System"}
                    </td>
                    <td className="p-4">
                      <span
                        className={`px-2 py-1 rounded text-xs font-bold ${
                          log.action === "DELETE"
                            ? "bg-red-100 text-red-700"
                            : log.action === "UPDATE"
                            ? "bg-amber-100 text-amber-700"
                            : "bg-emerald-100 text-emerald-700"
                        }`}
                      >
                        {log.action}
                      </span>
                    </td>
                    <td className="p-4 font-mono text-xs text-slate-600">
                      {log.tableName}
                    </td>
                    <td className="p-4 font-mono text-xs text-slate-400">
                      {log.recordId.slice(0, 8)}...
                    </td>
                    <td className="p-4 text-xs">
                      {log.newData && (
                        <span className="text-slate-600 truncate max-w-xs block">
                          {log.newData.slice(0, 60)}...
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
