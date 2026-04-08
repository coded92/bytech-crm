import { requireAdmin } from "@/lib/auth/require-admin";
import { UserForm } from "@/components/users/user-form";

export default async function NewUserPage() {
  await requireAdmin();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">
          Create User
        </h2>
        <p className="text-slate-600">
          Add a new staff or admin account.
        </p>
      </div>

      <UserForm />
    </div>
  );
}