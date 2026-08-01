import { requirePageUser } from "@/lib/auth/rbac";
import AuditLogsPage from "../admin/audit-logs/page";

export default async function SuperAdminDashboardPage() {
  await requirePageUser("superadmin");

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 text-white p-6 rounded-xl max-w-6xl mx-auto shadow-md">
        <h1 className="text-2xl font-bold">Dashboard Superadmin</h1>
        <p className="text-slate-400 text-sm">
          Akses penuh ke manajemen pengguna tingkat tinggi dan pemantauan Audit Trail seluruh sistem.
        </p>
      </div>

      <AuditLogsPage />
    </div>
  );
}
