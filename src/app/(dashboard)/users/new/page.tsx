import { redirect } from "next/navigation";
import { requireProfile } from "@/lib/auth/require-profile";
import { UserForm } from "@/components/users/user-form";

export default async function NewUserPage() {
  const profile = await requireProfile();

  if (profile.role !== "admin") {
    redirect("/dashboard");
  }

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