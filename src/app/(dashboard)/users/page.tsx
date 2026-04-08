import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth/require-admin";
import { UserTable } from "@/components/users/user-table";
import { Button } from "@/components/ui/button";

export default async function UsersPage() {
  await requireAdmin();
  const supabase = await createClient();

  const { data: users, error } = await supabase
    .from("profiles")
    .select("id, full_name, email, role, job_title, phone, is_active, created_at")
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            Users
          </h2>
          <p className="text-slate-600">
            Manage admin and staff accounts.
          </p>
        </div>

        <Button asChild>
          <Link href="/users/new">Create User</Link>
        </Button>
      </div>

      {error ? (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          Failed to load users: {error.message}
        </div>
      ) : (
        <UserTable users={users || []} />
      )}
    </div>
  );
}