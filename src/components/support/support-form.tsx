import { createSupportTicketAction } from "@/lib/actions/support";
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

export function SupportForm({
  customers,
  staff,
}: {
  customers: CustomerOption[];
  staff: StaffOption[];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Create Support Ticket</CardTitle>
        <CardDescription>
          Log a customer issue, repair request, or support case.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form
          action={async (formData: FormData) => {
            "use server";
            await createSupportTicketAction(formData);
          }}
          className="space-y-6"
        >
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="customer_id">Customer</Label>
              <select
                id="customer_id"
                name="customer_id"
                defaultValue=""
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
              <Label htmlFor="assigned_to">Assign To</Label>
              <select
                id="assigned_to"
                name="assigned_to"
                defaultValue=""
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
              <Label htmlFor="title">Ticket Title</Label>
              <Input
                id="title"
                name="title"
                placeholder="POS not printing receipt"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="issue_type">Issue Type</Label>
              <select
                id="issue_type"
                name="issue_type"
                defaultValue="hardware"
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
                defaultValue="medium"
                className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                rows={6}
                placeholder="Describe the issue, symptoms, actions already taken, and any customer notes."
              />
            </div>
          </div>

          <Button type="submit">Create Ticket</Button>
        </form>
      </CardContent>
    </Card>
  );
}