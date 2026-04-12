"use client";

import { useState, useTransition } from "react";
import { sendPasswordResetAction, updateUserAction } from "@/lib/actions/users";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const AVAILABLE_MODULES = [
  { key: "dashboard", label: "Dashboard" },
  { key: "leads", label: "Leads" },
  { key: "customers", label: "Customers" },
  { key: "quotations", label: "Quotations" },
  { key: "invoices", label: "Invoices" },
  { key: "payments", label: "Payments" },
  { key: "tasks", label: "Tasks" },
  { key: "reports", label: "Reports" },
  { key: "support", label: "Support" },
  { key: "deployments", label: "Deployments" },
  { key: "assets", label: "Assets" },
  { key: "field_jobs", label: "Field Jobs" },
  { key: "inventory", label: "Inventory" },
  { key: "suppliers", label: "Suppliers" },
  { key: "restocking", label: "Restocking" },
  { key: "expenses", label: "Expenses" },
  { key: "audit", label: "Audit Log" },
  { key: "users", label: "Users" },
  { key: "settings", label: "Settings" },
  { key: "messages", label: "Messages" },
] as const;

type UserEditFormProps = {
  user: {
    id: string;
    full_name: string;
    first_name: string | null;
    last_name: string | null;
    email: string | null;
    phone: string | null;
    role: "admin" | "staff";
    job_title: string | null;
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
  };
};

export function UserEditForm({ user }: UserEditFormProps) {
  const [isPending, startTransition] = useTransition();
  const [isResetPending, startResetTransition] = useTransition();
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  return (
    <Card>
      <CardHeader>
        <CardTitle>Edit Employee</CardTitle>
        <CardDescription>
          Update employee profile, login details, and access permissions.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        <form
          action={(formData) => {
            setError("");
            setMessage("");

            startTransition(async () => {
              const result = await updateUserAction(user.id, formData);

              if ("error" in result) {
                setError(result.error);
                return;
              }

              setMessage("Employee updated successfully.");
            });
          }}
          className="space-y-8"
        >
          <fieldset disabled={isPending} className="space-y-8">
            <section className="space-y-4">
              <h3 className="text-base font-semibold text-slate-900">
                Employee Details
              </h3>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="first_name">First Name*</Label>
                  <Input
                    id="first_name"
                    name="first_name"
                    defaultValue={user.first_name ?? ""}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="last_name">Last Name</Label>
                  <Input
                    id="last_name"
                    name="last_name"
                    defaultValue={user.last_name ?? ""}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email*</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    defaultValue={user.email ?? ""}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    name="phone"
                    defaultValue={user.phone ?? ""}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="job_title">Job Title</Label>
                  <Input
                    id="job_title"
                    name="job_title"
                    defaultValue={user.job_title ?? ""}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="employee_number">Employee Number</Label>
                  <Input
                    id="employee_number"
                    name="employee_number"
                    defaultValue={user.employee_number ?? ""}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="hire_date">Hire Date</Label>
                  <Input
                    id="hire_date"
                    name="hire_date"
                    type="date"
                    defaultValue={user.hire_date ?? ""}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="birthday">Birthday</Label>
                  <Input
                    id="birthday"
                    name="birthday"
                    type="date"
                    defaultValue={user.birthday ?? ""}
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    name="address"
                    defaultValue={user.address ?? ""}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    name="city"
                    defaultValue={user.city ?? ""}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="state">State</Label>
                  <Input
                    id="state"
                    name="state"
                    defaultValue={user.state ?? ""}
                  />
                </div>
              </div>
            </section>

            <section className="space-y-4">
              <h3 className="text-base font-semibold text-slate-900">
                Employee Login Info
              </h3>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="username">Username*</Label>
                  <Input
                    id="username"
                    name="username"
                    defaultValue={user.username ?? ""}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <select
                    id="role"
                    name="role"
                    defaultValue={user.role}
                    className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
                  >
                    <option value="staff">Staff</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="is_active">Account Status</Label>
                  <select
                    id="is_active"
                    name="is_active"
                    defaultValue={user.is_active ? "true" : "false"}
                    className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
                  >
                    <option value="true">Active</option>
                    <option value="false">Inactive</option>
                  </select>
                </div>

                <div className="flex items-center gap-3 pt-8">
                  <input
                    id="force_password_change"
                    name="force_password_change"
                    type="checkbox"
                    defaultChecked={user.force_password_change}
                    className="h-4 w-4 rounded border-slate-300"
                  />
                  <Label htmlFor="force_password_change">
                    Force password change upon login
                  </Label>
                </div>
              </div>
            </section>

            <section className="space-y-4">
              <h3 className="text-base font-semibold text-slate-900">
                Employee Permission and Access
              </h3>
              <p className="text-sm text-slate-500">
                Check the boxes below to grant access to modules.
              </p>

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {AVAILABLE_MODULES.map((module) => (
                  <label
                    key={module.key}
                    className="flex items-center gap-3 rounded-lg border border-slate-200 p-3"
                  >
                    <input
                      type="checkbox"
                      name="allowed_modules"
                      value={module.key}
                      defaultChecked={user.allowed_modules.includes(module.key)}
                      className="h-4 w-4 rounded border-slate-300"
                    />
                    <span className="text-sm text-slate-700">{module.label}</span>
                  </label>
                ))}
              </div>
            </section>

            {error ? (
              <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
                {error}
              </div>
            ) : null}

            {message ? (
              <div className="rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-600">
                {message}
              </div>
            ) : null}

            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving..." : "Save Changes"}
            </Button>
          </fieldset>
        </form>

        <div className="border-t border-slate-200 pt-6">
          <h3 className="text-sm font-semibold text-slate-900">Password Reset</h3>
          <p className="mt-1 text-sm text-slate-500">
            Send a password reset email to this user.
          </p>

          <div className="mt-4">
            <Button
              type="button"
              variant="outline"
              disabled={isResetPending || !user.email}
              onClick={() => {
                const email = user.email;
                if (!email) return;

                setError("");
                setMessage("");

                startResetTransition(async () => {
                  const result = await sendPasswordResetAction(email);

                  if ("error" in result) {
                    setError(result.error);
                    return;
                  }

                  setMessage("Password reset email sent successfully.");
                });
              }}
            >
              {isResetPending ? "Sending..." : "Send Password Reset Email"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}