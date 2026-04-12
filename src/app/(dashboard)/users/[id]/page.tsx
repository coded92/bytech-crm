import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth/require-admin";
import { formatDate, formatDateTime } from "@/lib/utils/format-date";
import { ToggleUserStatusButton } from "@/components/users/toggle-user-status-button";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type UserDetailsPageProps = {
  params: Promise<{ id: string }>;
};

type AdminProfile = {
  id: string;
  role: "admin" | "staff";
  full_name: string;
};

type UserRow = {
  id: string;
  full_name: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  role: "admin" | "staff";
  job_title: string | null;
  phone: string | null;
  is_active: boolean;
  address: string | null;
  city: string | null;
  state: string | null;
  hire_date: string | null;
  birthday: string | null;
  employee_number: string | null;
  username: string | null;
  force_password_change: boolean;
  allowed_modules: string[];
  avatar_url: string | null;
  created_at: string;
};

export default async function UserDetailsPage({
  params,
}: UserDetailsPageProps) {
  const admin = (await requireAdmin()) as AdminProfile;
  const { id } = await params;
  const supabase = await createClient();

  const { data: userData, error } = await supabase
    .from("profiles")
    .select(
      "id, full_name, first_name, last_name, email, role, job_title, phone, is_active, address, city, state, hire_date, birthday, employee_number, username, force_password_change, allowed_modules, avatar_url, created_at"
    )
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
  const canToggleStatus = admin.id !== user.id;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          {user.avatar_url ? (
            <img
              src={user.avatar_url}
              alt={user.full_name}
              className="h-16 w-16 rounded-full border border-slate-200 object-cover"
            />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-full border border-slate-200 bg-slate-100 text-lg font-semibold text-slate-600">
              {(user.first_name?.[0] || user.full_name?.[0] || "U").toUpperCase()}
            </div>
          )}

          <div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">
              {user.full_name}
            </h2>
            <p className="text-slate-600">{user.email ?? "-"}</p>
            <p className="mt-1 text-sm text-slate-500">
              {user.job_title || "-"} · {user.role}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <Button asChild>
            <Link href={`/users/${user.id}/edit`}>Edit User</Link>
          </Button>

          {canToggleStatus ? (
            <ToggleUserStatusButton
              userId={user.id}
              isActive={user.is_active}
            />
          ) : null}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Employee Details</CardTitle>
        </CardHeader>

        <CardContent className="grid gap-4 md:grid-cols-2">
          <InfoItem label="First Name" value={user.first_name} />
          <InfoItem label="Last Name" value={user.last_name} />
          <InfoItem label="Full Name" value={user.full_name} />
          <InfoItem label="Email" value={user.email} />
          <InfoItem label="Username" value={user.username} />
          <InfoItem label="Phone" value={user.phone} />
          <InfoItem label="Role" value={user.role} />
          <InfoItem label="Job Title" value={user.job_title} />
          <InfoItem label="Employee Number" value={user.employee_number} />
          <InfoItem label="Status" value={user.is_active ? "Active" : "Inactive"} />
          <InfoItem label="Hire Date" value={formatDate(user.hire_date)} />
          <InfoItem label="Birthday" value={formatDate(user.birthday)} />
          <InfoItem label="City" value={user.city} />
          <InfoItem label="State" value={user.state} />
          <InfoItem label="Address" value={user.address} />
          <InfoItem
            label="Force Password Change"
            value={user.force_password_change ? "Yes" : "No"}
          />
          <InfoItem label="Created At" value={formatDateTime(user.created_at)} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Employee Permission and Access</CardTitle>
        </CardHeader>

        <CardContent>
          {user.role === "admin" ? (
            <p className="text-sm text-slate-700">
              Admin has full access to all modules.
            </p>
          ) : user.allowed_modules.length === 0 ? (
            <p className="text-sm text-slate-500">
              No modules assigned yet.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {user.allowed_modules.map((module) => (
                <span
                  key={module}
                  className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-sm text-slate-700"
                >
                  {module.replaceAll("_", " ")}
                </span>
              ))}
            </div>
          )}
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
      <p className="mt-1 text-sm text-slate-900">{value ?? "-"}</p>
    </div>
  );
}