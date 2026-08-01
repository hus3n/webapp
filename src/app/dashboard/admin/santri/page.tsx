import { requirePageUser } from "@/lib/auth/rbac";
import SantriManagement from "@/components/forms/SantriForm";

export default async function AdminSantriPage() {
  await requirePageUser("admin", "superadmin");

  return <SantriManagement />;
}
