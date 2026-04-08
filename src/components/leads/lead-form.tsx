import { createLeadAction } from "@/lib/actions/leads";
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

type LeadFormProps = {
  sources: LeadSource[];
  staffUsers: StaffUser[];
};

export function LeadForm({ sources, staffUsers }: LeadFormProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>New Lead</CardTitle>
        <CardDescription>
          Add a new prospect to the sales pipeline.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form
          action={async (formData) => {
            "use server";
            await createLeadAction(formData);
          }}
          className="space-y-6"
        >
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="company_name">Company Name</Label>
              <Input id="company_name" name="company_name" required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contact_person">Contact Person</Label>
              <Input id="contact_person" name="contact_person" required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" name="phone" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="business_type">Business Type</Label>
              <Input
                id="business_type"
                name="business_type"
                placeholder="Retail, Pharmacy, SME..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="industry">Industry</Label>
              <Input id="industry" name="industry" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input id="city" name="city" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="state">State</Label>
              <Input id="state" name="state" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="estimated_value">Estimated Value</Label>
              <Input
                id="estimated_value"
                name="estimated_value"
                type="number"
                min="0"
                defaultValue="0"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="interested_plan">Interested Plan</Label>
              <select
                id="interested_plan"
                name="interested_plan"
                defaultValue="unknown"
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
                defaultValue=""
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
                defaultValue=""
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
                defaultValue="new"
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
              <Input id="next_follow_up_at" name="next_follow_up_at" type="datetime-local" />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Textarea id="address" name="address" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="lost_reason">Lost Reason</Label>
            <Textarea id="lost_reason" name="lost_reason" />
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <Button type="submit">Create Lead</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}