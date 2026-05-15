import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth/require-admin";
import { UserEditForm } from "@/components/users/user-edit-form";

type EditUserPageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditUserPage({
  params,
}: EditUserPageProps) {
  const admin = await requireAdmin();
  const { id } = await params;
  const supabase = await createClient();

  const { data: user } = await supabase
    .from("profiles")
    .select(
      "id, full_name, first_name, last_name, email, role, department, job_title, phone, is_active, address, city, state, hire_date, birthday, employee_number, force_password_change, allowed_modules"
    )
    .eq("id", id)
    .single();

  if (!user) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">
          Edit User
        </h2>
        <p className="text-slate-600">
          Update account details and permissions.
        </p>
      </div>

      <UserEditForm user={user} currentAdminId={admin.id} />
    </div>
  );
}
