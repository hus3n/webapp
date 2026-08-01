import { requirePageUser } from "@/lib/auth/rbac";
import MurajaahDashboardAdmin from "@/components/charts/MurajaahAdminDashboard";

export default async function AdminMurajaahPage() {
  await requirePageUser("admin", "superadmin");

  return <MurajaahDashboardAdmin />;
}