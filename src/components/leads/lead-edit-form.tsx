"use client";

import { useState, useTransition } from "react";
import { updateLeadAction } from "@/lib/actions/leads";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type LeadSource = {
  id: string;
  name: string;
};

type StaffUser = {
  id: string;
  full_name: string;
};

type LeadData = {
  id: string;
  company_name: string;
  contact_person: string;
  phone: string | null;
  email: string | null;
  business_type: string | null;
  industry: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  source_id: string | null;
  assigned_to: string | null;
  status:
    | "new"
    | "contacted"
    | "interested"
    | "follow_up"
    | "closed_won"
    | "closed_lost";
  estimated_value: number;
  interested_plan: "cloud" | "offline" | "unknown" | null;
  next_follow_up_at: string | null;
  lost_reason: string | null;
};

type LeadEditFormProps = {
  lead: LeadData;
  sources: LeadSource[];
  staffUsers: StaffUser[];
};

function toDateTimeLocal(value: string | null) {
  if (!value) return "";
  const date = new Date(value);
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60 * 1000);
  return local.toISOString().slice(0, 16);
}

export function LeadEditForm({
  lead,
  sources,
  staffUsers,
}: LeadEditFormProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  return (
    <Card>
      <CardHeader>
        <CardTitle>Edit Lead</CardTitle>
        <CardDescription>
          Update prospect details and sales pipeline information.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form
          action={(formData) => {
            setError("");

            startTransition(async () => {
              const result = await updateLeadAction(lead.id, formData);

              if ("error" in result) {
                setError(result.error);
              }
            });
          }}
          className="space-y-6"
        >
          <fieldset disabled={isPending} className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="company_name">Company Name</Label>
                <Input
                  id="company_name"
                  name="company_name"
                  defaultValue={lead.company_name}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contact_person">Contact Person</Label>
                <Input
                  id="contact_person"
                  name="contact_person"
                  defaultValue={lead.contact_person}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" name="phone" defaultValue={lead.phone ?? ""} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  defaultValue={lead.email ?? ""}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="business_type">Business Type</Label>
                <Input
                  id="business_type"
                  name="business_type"
                  defaultValue={lead.business_type ?? ""}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="industry">Industry</Label>
                <Input
                  id="industry"
                  name="industry"
                  defaultValue={lead.industry ?? ""}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input id="city" name="city" defaultValue={lead.city ?? ""} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="state">State</Label>
                <Input id="state" name="state" defaultValue={lead.state ?? ""} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="estimated_value">Estimated Value</Label>
                <Input
                  id="estimated_value"
                  name="estimated_value"
                  type="number"
                  min="0"
                  defaultValue={lead.estimated_value}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="interested_plan">Interested Plan</Label>
                <select
                  id="interested_plan"
                  name="interested_plan"
                  defaultValue={lead.interested_plan ?? "unknown"}
                  className="flex h-10 w-full rounded-md border border-slate-200 bg-background px-3 py-2 text-sm"
                >
                  <option value="unknown">Unknown</option>
                  <option value="cloud">Cloud</option>
                  <option value="offline">Offline</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="source_id">Lead Source</Label>
                <select
                  id="source_id"
                  name="source_id"
                  className="flex h-10 w-full rounded-md border border-slate-200 bg-background px-3 py-2 text-sm"
                  defaultValue={lead.source_id ?? ""}
                >
                  <option value="">Select source</option>
                  {sources.map((source) => (
                    <option key={source.id} value={source.id}>
                      {source.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="assigned_to">Assigned To</Label>
                <select
                  id="assigned_to"
                  name="assigned_to"
                  className="flex h-10 w-full rounded-md border border-slate-200 bg-background px-3 py-2 text-sm"
                  defaultValue={lead.assigned_to ?? ""}
                >
                  <option value="">Auto assign to me</option>
                  {staffUsers.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.full_name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <select
                  id="status"
                  name="status"
                  defaultValue={lead.status}
                  className="flex h-10 w-full rounded-md border border-slate-200 bg-background px-3 py-2 text-sm"
                >
                  <option value="new">New</option>
                  <option value="contacted">Contacted</option>
                  <option value="interested">Interested</option>
                  <option value="follow_up">Follow-up</option>
                  <option value="closed_won">Closed Won</option>
                  <option value="closed_lost">Closed Lost</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="next_follow_up_at">Next Follow-up</Label>
                <Input
                  id="next_follow_up_at"
                  name="next_follow_up_at"
                  type="datetime-local"
                  defaultValue={toDateTimeLocal(lead.next_follow_up_at)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Textarea
                id="address"
                name="address"
                defaultValue={lead.address ?? ""}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="lost_reason">Lost Reason</Label>
              <Textarea
                id="lost_reason"
                name="lost_reason"
                defaultValue={lead.lost_reason ?? ""}
              />
            </div>

            {error ? (
              <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
                {error}
              </div>
            ) : null}

            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <Button type="submit" disabled={isPending}>
                {isPending ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </fieldset>
        </form>
      </CardContent>
    </Card>
  );
}