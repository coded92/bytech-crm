"use client";

import { useState, useTransition } from "react";
import { updateFieldJobAction } from "@/lib/actions/field-jobs";
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

type AssetOption = {
  id: string;
  asset_tag: string;
};

type SupportOption = {
  id: string;
  ticket_number: string;
};

type EngineerOption = {
  id: string;
  full_name: string;
};

type FieldJobData = {
  id: string;
  customer_id: string;
  branch_id: string | null;
  asset_id: string | null;
  support_ticket_id: string | null;
  title: string;
  job_type:
    | "wiring_repair"
    | "hardware_repair"
    | "site_inspection"
    | "site_survey"
    | "site_assessment"
    | "installation"
    | "maintenance_visit"
    | "device_replacement"
    | "network_troubleshooting"
    | "training_visit"
    | "other";
  priority: "low" | "medium" | "high" | "urgent";
  status:
    | "pending"
    | "assigned"
    | "in_progress"
    | "awaiting_parts"
    | "completed"
    | "cancelled";
  assigned_engineer_id: string | null;
  scheduled_date: string | null;
  reported_issue: string | null;
  work_done: string | null;
  materials_used: string | null;
  recommendation: string | null;
  customer_feedback: string | null;
};

export function FieldJobEditForm({
  job,
  customers,
  branches,
  assets,
  supportTickets,
  engineers,
}: {
  job: FieldJobData;
  customers: CustomerOption[];
  branches: BranchOption[];
  assets: AssetOption[];
  supportTickets: SupportOption[];
  engineers: EngineerOption[];
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  return (
    <Card>
      <CardHeader>
        <CardTitle>Edit Field Job</CardTitle>
        <CardDescription>
          Update engineer work assignment and site visit details.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form
          action={(formData) => {
            setError("");

            startTransition(async () => {
              const result = await updateFieldJobAction(job.id, formData);
              if (result?.error) setError(result.error);
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
                  defaultValue={job.customer_id}
                  className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
                  required
                >
                  <option value="">Select customer</option>
                  {customers.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.company_name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="branch_id">Branch</Label>
                <select
                  id="branch_id"
                  name="branch_id"
                  defaultValue={job.branch_id ?? ""}
                  className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
                >
                  <option value="">Select branch</option>
                  {branches.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.branch_name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="asset_id">Asset</Label>
                <select
                  id="asset_id"
                  name="asset_id"
                  defaultValue={job.asset_id ?? ""}
                  className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
                >
                  <option value="">Select asset</option>
                  {assets.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.asset_tag}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="support_ticket_id">Support Ticket</Label>
                <select
                  id="support_ticket_id"
                  name="support_ticket_id"
                  defaultValue={job.support_ticket_id ?? ""}
                  className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
                >
                  <option value="">Select support ticket</option>
                  {supportTickets.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.ticket_number}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="title">Job Title</Label>
                <Input
                  id="title"
                  name="title"
                  defaultValue={job.title}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="job_type">Job Type</Label>
                <select
                  id="job_type"
                  name="job_type"
                  defaultValue={job.job_type}
                  className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
                >
                  <option value="wiring_repair">Wiring Repair</option>
                  <option value="hardware_repair">Hardware Repair</option>
                  <option value="site_inspection">Site Inspection</option>
                  <option value="site_survey">Site Survey</option>
                  <option value="site_assessment">Site Assessment</option>
                  <option value="installation">Installation</option>
                  <option value="maintenance_visit">Maintenance Visit</option>
                  <option value="device_replacement">Device Replacement</option>
                  <option value="network_troubleshooting">Network Troubleshooting</option>
                  <option value="training_visit">Training Visit</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <select
                  id="priority"
                  name="priority"
                  defaultValue={job.priority}
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
                  defaultValue={job.status}
                  className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
                >
                  <option value="pending">Pending</option>
                  <option value="assigned">Assigned</option>
                  <option value="in_progress">In Progress</option>
                  <option value="awaiting_parts">Awaiting Parts</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="assigned_engineer_id">Assigned Engineer</Label>
                <select
                  id="assigned_engineer_id"
                  name="assigned_engineer_id"
                  defaultValue={job.assigned_engineer_id ?? ""}
                  className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
                >
                  <option value="">Select engineer</option>
                  {engineers.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.full_name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="scheduled_date">Scheduled Date</Label>
                <Input
                  id="scheduled_date"
                  name="scheduled_date"
                  type="date"
                  defaultValue={job.scheduled_date ?? ""}
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="reported_issue">Reported Issue / Purpose</Label>
                <Textarea
                  id="reported_issue"
                  name="reported_issue"
                  rows={4}
                  defaultValue={job.reported_issue ?? ""}
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="work_done">Work Done</Label>
                <Textarea
                  id="work_done"
                  name="work_done"
                  rows={4}
                  defaultValue={job.work_done ?? ""}
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="materials_used">Materials Used</Label>
                <Textarea
                  id="materials_used"
                  name="materials_used"
                  rows={3}
                  defaultValue={job.materials_used ?? ""}
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="recommendation">Recommendation / Next Step</Label>
                <Textarea
                  id="recommendation"
                  name="recommendation"
                  rows={3}
                  defaultValue={job.recommendation ?? ""}
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="customer_feedback">Customer Feedback</Label>
                <Textarea
                  id="customer_feedback"
                  name="customer_feedback"
                  rows={3}
                  defaultValue={job.customer_feedback ?? ""}
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