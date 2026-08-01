import { requirePageUser } from "@/lib/auth/rbac";
import UserManagement from "@/components/forms/UserForm";

export default async function AdminUsersPage() {
  const user = await requirePageUser("admin", "superadmin");

  return <UserManagement currentRole={user.role} currentUserId={user.id} />;
}
