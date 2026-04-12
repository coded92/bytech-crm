"use client";

import { useState, useTransition } from "react";
import { updateSupportTicketAction } from "@/lib/actions/support";
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

type StaffOption = {
  id: string;
  full_name: string;
};

type CustomerOption = {
  id: string;
  company_name: string;
};

type AssetOption = {
  id: string;
  asset_tag: string;
};

type TicketData = {
  id: string;
  customer_id: string;
  asset_id: string | null;
  title: string;
  issue_type: "hardware" | "software" | "network" | "training" | "billing" | "other";
  priority: "low" | "medium" | "high" | "urgent";
  status: "open" | "in_progress" | "resolved" | "closed";
  description: string | null;
  assigned_to: string | null;
  resolution_notes: string | null;
};

export function SupportEditForm({
  ticket,
  staff,
  customers,
  assets,
}: {
  ticket: TicketData;
  staff: StaffOption[];
  customers: CustomerOption[];
  assets: AssetOption[];
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  return (
    <Card>
      <CardHeader>
        <CardTitle>Edit Support Ticket</CardTitle>
        <CardDescription>
          Update support issue details and resolution progress.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form
          action={(formData) => {
            setError("");

            startTransition(async () => {
              const result = await updateSupportTicketAction(ticket.id, formData);

              if (result?.error) {
                setError(result.error);
              }
            });
          }}
          className="space-y-6"
        >
          <fieldset disabled={isPending} className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="customer_id">Customer</Label>
                <select
                  id="customer_id"
                  name="customer_id"
                  defaultValue={ticket.customer_id}
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
                <Label htmlFor="asset_id">Related Asset</Label>
                <select
                  id="asset_id"
                  name="asset_id"
                  defaultValue={ticket.asset_id ?? ""}
                  className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
                >
                  <option value="">No linked asset</option>
                  {assets.map((asset) => (
                    <option key={asset.id} value={asset.id}>
                      {asset.asset_tag}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="title">Ticket Title</Label>
                <Input
                  id="title"
                  name="title"
                  defaultValue={ticket.title}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="issue_type">Issue Type</Label>
                <select
                  id="issue_type"
                  name="issue_type"
                  defaultValue={ticket.issue_type}
                  className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
                >
                  <option value="hardware">Hardware</option>
                  <option value="software">Software</option>
                  <option value="network">Network</option>
                  <option value="training">Training</option>
                  <option value="billing">Billing</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <select
                  id="priority"
                  name="priority"
                  defaultValue={ticket.priority}
                  className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <select
                  id="status"
                  name="status"
                  defaultValue={ticket.status}
                  className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
                >
                  <option value="open">Open</option>
                  <option value="in_progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                  <option value="closed">Closed</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="assigned_to">Assign To</Label>
                <select
                  id="assigned_to"
                  name="assigned_to"
                  defaultValue={ticket.assigned_to ?? ""}
                  className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
                >
                  <option value="">Unassigned</option>
                  {staff.map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.full_name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  rows={6}
                  defaultValue={ticket.description ?? ""}
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="resolution_notes">Resolution Notes</Label>
                <Textarea
                  id="resolution_notes"
                  name="resolution_notes"
                  rows={5}
                  defaultValue={ticket.resolution_notes ?? ""}
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