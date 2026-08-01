import { requirePageUser } from "@/lib/auth/rbac";
import KelasManagement from "@/components/forms/KelasForm";

export default async function AdminKelasPage() {
  await requirePageUser("admin", "superadmin");

  return <KelasManagement />;
}
