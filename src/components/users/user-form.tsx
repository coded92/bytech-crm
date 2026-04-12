"use client";

import { useState, useTransition } from "react";
import { createUserAction } from "@/lib/actions/users";
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

export function UserForm() {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create Employee</CardTitle>
        <CardDescription>
          Add a new staff or admin account with profile details and module access.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form
          action={(formData) => {
            setError("");

            startTransition(async () => {
              const result = await createUserAction(formData);

              if ("error" in result) {
                setError(result.error);
              }
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
                  <Input id="first_name" name="first_name" required />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="last_name">Last Name</Label>
                  <Input id="last_name" name="last_name" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email*</Label>
                  <Input id="email" name="email" type="email" required />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input id="phone" name="phone" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="job_title">Job Title</Label>
                  <Input id="job_title" name="job_title" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="employee_number">Employee Number</Label>
                  <Input id="employee_number" name="employee_number" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="hire_date">Hire Date</Label>
                  <Input id="hire_date" name="hire_date" type="date" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="birthday">Birthday</Label>
                  <Input id="birthday" name="birthday" type="date" />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="address">Address</Label>
                  <Input id="address" name="address" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input id="city" name="city" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="state">State</Label>
                  <Input id="state" name="state" />
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
                  <Input id="username" name="username" required />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password*</Label>
                  <Input id="password" name="password" type="password" required />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <select
                    id="role"
                    name="role"
                    defaultValue="staff"
                    className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
                  >
                    <option value="staff">Staff</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>

                <div className="flex items-center gap-3 pt-8">
                  <input
                    id="force_password_change"
                    name="force_password_change"
                    type="checkbox"
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

            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving..." : "Create Employee"}
            </Button>
          </fieldset>
        </form>
      </CardContent>
    </Card>
  );
}