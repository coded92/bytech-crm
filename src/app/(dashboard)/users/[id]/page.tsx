import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth/require-admin";
import { formatDateTime } from "@/lib/utils/format-date";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type UserDetailsPageProps = {
  params: Promise<{ id: string }>;
};

type UserRow = {
  id: string;
  full_name: string;
  email: string | null;
  role: "admin" | "staff";
  job_title: string | null;
  phone: string | null;
  is_active: boolean;
  created_at: string;
};

export default async function UserDetailsPage({
  params,
}: UserDetailsPageProps) {
  await requireAdmin();
  const { id } = await params;
  const supabase = await createClient();

  const { data: userData, error } = await supabase
    .from("profiles")
    .select("id, full_name, email, role, job_title, phone, is_active, created_at")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
        Failed to load user: {error.message}
      </div>
    );
  }

  if (!userData) {
    notFound();
  }

  const user = userData as UserRow;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            {user.full_name}
          </h2>
          <p className="text-slate-600">{user.email ?? "-"}</p>
        </div>

        <Button asChild>
          <Link href={`/users/${user.id}/edit`}>Edit User</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>User Details</CardTitle>
        </CardHeader>

        <CardContent className="grid gap-4 md:grid-cols-2">
          <InfoItem label="Full Name" value={user.full_name} />
          <InfoItem label="Email" value={user.email} />
          <InfoItem label="Role" value={user.role} />
          <InfoItem label="Job Title" value={user.job_title} />
          <InfoItem label="Phone" value={user.phone} />
          <InfoItem label="Status" value={user.is_active ? "Active" : "Inactive"} />
          <InfoItem label="Created At" value={formatDateTime(user.created_at)} />
        </CardContent>
      </Card>
    </div>
  );
}

function InfoItem({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className="mt-1 text-sm capitalize text-slate-900">{value ?? "-"}</p>
    </div>
  );
}