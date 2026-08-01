import { requirePageUser } from "@/lib/auth/rbac";
import HafalanDashboard from "@/components/charts/HafalanChart";

export default async function AdminHafalanPage() {
  await requirePageUser("admin", "superadmin");

  return <HafalanDashboard />;
}
