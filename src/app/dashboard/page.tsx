import { redirect } from "next/navigation";
import { requirePageUser } from "@/lib/auth/rbac";

export default async function DashboardHome() {
  const user = await requirePageUser();

  if (user.role === "admin" || user.role === "superadmin") {
    redirect("/dashboard/admin/users");
  }
  redirect("/dashboard/guru");
}
