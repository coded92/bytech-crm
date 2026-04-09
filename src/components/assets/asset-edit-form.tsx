"use client";

import { useState, useTransition } from "react";
import { updateAssetAction } from "@/lib/actions/assets";
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

type BranchOption = {
  id: string;
  branch_name: string;
};

type DeploymentOption = {
  id: string;
  deployment_number: string;
};

type AssetData = {
  id: string;
  device_type: "pos_terminal" | "printer" | "scanner" | "router" | "other";
  serial_number: string | null;
  customer_id: string | null;
  branch_id: string | null;
  deployment_id: string | null;
  condition: "new" | "good" | "faulty" | "under_repair" | "retired";
  status: "active" | "inactive" | "lost" | "retired";
  purchase_date: string | null;
  notes: string | null;
};

export function AssetEditForm({
  asset,
  customers,
  branches,
  deployments,
}: {
  asset: AssetData;
  customers: CustomerOption[];
  branches: BranchOption[];
  deployments: DeploymentOption[];
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  return (
    <Card>
      <CardHeader>
        <CardTitle>Edit Asset</CardTitle>
        <CardDescription>
          Update asset details and assignment.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form
          action={(formData) => {
            setError("");

            startTransition(async () => {
              const result = await updateAssetAction(asset.id, formData);

              if (result?.error) {
                setError(result.error);
              }
            });
          }}
          className="space-y-6"
        >
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="device_type">Device Type</Label>
              <select
                id="device_type"
                name="device_type"
                defaultValue={asset.device_type}
                className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
              >
                <option value="pos_terminal">POS Terminal</option>
                <option value="printer">Printer</option>
                <option value="scanner">Scanner</option>
                <option value="router">Router</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="serial_number">Serial Number</Label>
              <Input
                id="serial_number"
                name="serial_number"
                defaultValue={asset.serial_number || ""}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="customer_id">Customer</Label>
              <select
                id="customer_id"
                name="customer_id"
                defaultValue={asset.customer_id || ""}
                className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
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
              <Label htmlFor="branch_id">Branch</Label>
              <select
                id="branch_id"
                name="branch_id"
                defaultValue={asset.branch_id || ""}
                className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
              >
                <option value="">Select branch</option>
                {branches.map((branch) => (
                  <option key={branch.id} value={branch.id}>
                    {branch.branch_name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="deployment_id">Deployment</Label>
              <select
                id="deployment_id"
                name="deployment_id"
                defaultValue={asset.deployment_id || ""}
                className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
              >
                <option value="">Select deployment</option>
                {deployments.map((deployment) => (
                  <option key={deployment.id} value={deployment.id}>
                    {deployment.deployment_number}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="condition">Condition</Label>
              <select
                id="condition"
                name="condition"
                defaultValue={asset.condition}
                className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
              >
                <option value="new">New</option>
                <option value="good">Good</option>
                <option value="faulty">Faulty</option>
                <option value="under_repair">Under Repair</option>
                <option value="retired">Retired</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <select
                id="status"
                name="status"
                defaultValue={asset.status}
                className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="lost">Lost</option>
                <option value="retired">Retired</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="purchase_date">Purchase Date</Label>
              <Input
                id="purchase_date"
                name="purchase_date"
                type="date"
                defaultValue={asset.purchase_date || ""}
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                name="notes"
                rows={4}
                defaultValue={asset.notes || ""}
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
        </form>
      </CardContent>
    </Card>
  );
}