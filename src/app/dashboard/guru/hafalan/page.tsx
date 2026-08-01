import { requirePageUser } from "@/lib/auth/rbac";
import HafalanManagement from "@/components/forms/HafalanForm";

export default async function GuruHafalanPage() {
  await requirePageUser("guru");

  return <HafalanManagement />;
}
