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
import { MODULE_PRESETS } from "./module-presets";

const AVAILABLE_MODULES = [
  { key: "dashboard", label: "Dashboard" },
  { key: "leads", label: "Leads" },
  { key: "customers", label: "Customers" },
  { key: "quotations", label: "Quotations" },
  { key: "invoices", label: "Invoices" },
  { key: "payments", label: "Payments" },
  { key: "tasks", label: "Tasks" },
  { key: "projects", label: "Projects" },
  { key: "reports", label: "Daily Reports" },
  { key: "support", label: "Support" },
  { key: "notifications", label: "Notifications" },
  { key: "deployments", label: "Deployments" },
  { key: "assets", label: "Assets" },
  { key: "field_jobs", label: "Field Jobs" },
  { key: "engineer_daily", label: "Engineer Daily" },
  { key: "inventory", label: "Inventory" },
  { key: "suppliers", label: "Suppliers" },
  { key: "supplier_payables", label: "Supplier Payables" },
  { key: "restocking", label: "Restocking" },
  { key: "expenses", label: "Expenses" },
  { key: "audit_logs", label: "Audit Logs" },
  { key: "users", label: "Users" },
  { key: "settings", label: "Settings" },
  { key: "search", label: "Search" },
  { key: "messages", label: "Messages" },
] as const;

export function UserForm() {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [selectedModules, setSelectedModules] = useState<string[]>([]);

  function applyPreset(name: keyof typeof MODULE_PRESETS) {
    setSelectedModules([...MODULE_PRESETS[name]]);
  }

  function toggleModule(module: string) {
    setSelectedModules((prev) =>
      prev.includes(module)
        ? prev.filter((m) => m !== module)
        : [...prev, module]
    );
  }

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
            {/* DETAILS */}
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

                {/* NEW */}
                <div className="space-y-2">
                  <Label htmlFor="department">Department*</Label>
                  <select
                    id="department"
                    name="department"
                    required
                    className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
                  >
                    <option value="">Select department</option>
                    <option value="sales">Sales</option>
                    <option value="operations">Operations</option>
                    <option value="support">Support</option>
                    <option value="engineering">Engineering</option>
                    <option value="inventory">Inventory</option>
                    <option value="finance">Finance</option>
                    <option value="hr">HR</option>
                  </select>
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

            {/* LOGIN */}
            <section className="space-y-4">
              <h3 className="text-base font-semibold text-slate-900">
                Employee Login Info
              </h3>

              <div className="grid gap-4 md:grid-cols-2">
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

            {/* MODULES */}
            <section className="space-y-4">
              <h3 className="text-base font-semibold text-slate-900">
                Employee Permission and Access
              </h3>

              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="outline" onClick={() => applyPreset("sales")}>Sales Preset</Button>
                <Button type="button" variant="outline" onClick={() => applyPreset("support")}>Support Preset</Button>
                <Button type="button" variant="outline" onClick={() => applyPreset("engineering")}>Engineering Preset</Button>
                <Button type="button" variant="outline" onClick={() => applyPreset("admin")}>Admin Preset</Button>
              </div>

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
                      checked={selectedModules.includes(module.key)}
                      onChange={() => toggleModule(module.key)}
                      className="h-4 w-4 rounded border-slate-300"
                    />
                    <span className="text-sm text-slate-700">
                      {module.label}
                    </span>
                  </label>
                ))}
              </div>
            </section>

            {error && (
              <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
                {error}
              </div>
            )}

            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving..." : "Create Employee"}
            </Button>
          </fieldset>
        </form>
      </CardContent>
    </Card>
  );
}
