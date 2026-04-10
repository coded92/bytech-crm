"use client";

import { useState, useTransition } from "react";
import { updateDeploymentAction } from "@/lib/actions/deployments";
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
import { Textarea } from "@/components/ui/textarea";

type CustomerOption = {
  id: string;
  company_name: string;
};

type StaffOption = {
  id: string;
  full_name: string;
};

type DeploymentData = {
  id: string;
  customer_id: string;
  deployment_type:
    | "new_installation"
    | "upgrade"
    | "replacement"
    | "maintenance";
  terminal_count: number;
  deployment_status: "planned" | "in_progress" | "completed" | "cancelled";
  deployed_by: string | null;
  install_date: string | null;
  go_live_date: string | null;
  notes: string | null;
  branch: {
    branch_name: string | null;
    contact_person: string | null;
    phone: string | null;
    address: string | null;
    city: string | null;
    state: string | null;
  } | null;
};

export function DeploymentEditForm({
  deployment,
  customers,
  staff,
}: {
  deployment: DeploymentData;
  customers: CustomerOption[];
  staff: StaffOption[];
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  return (
    <Card>
      <CardHeader>
        <CardTitle>Edit Deployment</CardTitle>
        <CardDescription>
          Update branch and deployment details.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form
          action={(formData) => {
            setError("");

            startTransition(async () => {
              const result = await updateDeploymentAction(
                deployment.id,
                formData
              );

              if (result?.error) {
                setError(result.error);
              }
            });
          }}
          className="space-y-6"
        >
          <fieldset disabled={isPending} className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="customer_id">Customer</Label>
                <select
                  id="customer_id"
                  name="customer_id"
                  defaultValue={deployment.customer_id}
                  className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
                  required
                >
                  <option value="">Select customer</option>
                  {customers.map((customer) => (
                    <option key={customer.id} value={customer.id}>
                      {customer.company_name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="branch_name">Branch Name</Label>
                <Input
                  id="branch_name"
                  name="branch_name"
                  defaultValue={deployment.branch?.branch_name || ""}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contact_person">Branch Contact Person</Label>
                <Input
                  id="contact_person"
                  name="contact_person"
                  defaultValue={deployment.branch?.contact_person || ""}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Branch Phone</Label>
                <Input
                  id="phone"
                  name="phone"
                  defaultValue={deployment.branch?.phone || ""}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  name="city"
                  defaultValue={deployment.branch?.city || ""}
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="address">Branch Address</Label>
                <Textarea
                  id="address"
                  name="address"
                  rows={3}
                  defaultValue={deployment.branch?.address || ""}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="state">State</Label>
                <Input
                  id="state"
                  name="state"
                  defaultValue={deployment.branch?.state || ""}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="deployment_type">Deployment Type</Label>
                <select
                  id="deployment_type"
                  name="deployment_type"
                  defaultValue={deployment.deployment_type}
                  className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
                >
                  <option value="new_installation">New Installation</option>
                  <option value="upgrade">Upgrade</option>
                  <option value="replacement">Replacement</option>
                  <option value="maintenance">Maintenance</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="terminal_count">Terminal Count</Label>
                <Input
                  id="terminal_count"
                  name="terminal_count"
                  type="number"
                  min="1"
                  defaultValue={deployment.terminal_count}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="deployment_status">Deployment Status</Label>
                <select
                  id="deployment_status"
                  name="deployment_status"
                  defaultValue={deployment.deployment_status}
                  className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
                >
                  <option value="planned">Planned</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="deployed_by">Assigned Staff</Label>
                <select
                  id="deployed_by"
                  name="deployed_by"
                  defaultValue={deployment.deployed_by || ""}
                  className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
                >
                  <option value="">Select staff</option>
                  {staff.map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.full_name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="install_date">Install Date</Label>
                <Input
                  id="install_date"
                  name="install_date"
                  type="date"
                  defaultValue={deployment.install_date || ""}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="go_live_date">Go Live Date</Label>
                <Input
                  id="go_live_date"
                  name="go_live_date"
                  type="date"
                  defaultValue={deployment.go_live_date || ""}
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  name="notes"
                  rows={4}
                  defaultValue={deployment.notes || ""}
                />
              </div>
            </div>

            {error ? (
              <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
                {error}
              </div>
            ) : null}

            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving..." : "Save Changes"}
            </Button>
          </fieldset>
        </form>
      </CardContent>
    </Card>
  );
}