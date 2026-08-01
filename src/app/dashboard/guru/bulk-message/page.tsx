import { requirePageUser } from "@/lib/auth/rbac";
import BulkMessageForm from "@/components/forms/BulkMessageForm";

export default async function GuruBulkMessagePage() {
  await requirePageUser("guru", "admin", "superadmin");

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <BulkMessageForm />
    </div>
  );
}
