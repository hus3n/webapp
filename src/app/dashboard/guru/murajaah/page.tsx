import { requirePageUser } from "@/lib/auth/rbac";
import MurajaahManagement from "@/components/forms/MurajaahForm";

export default async function GuruMurajaahPage() {
  await requirePageUser("guru");

  return <MurajaahManagement />;
}