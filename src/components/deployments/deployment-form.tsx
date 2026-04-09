import { createDeploymentAction } from "@/lib/actions/deployments";
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

export function DeploymentForm({
  customers,
  staff,
}: {
  customers: CustomerOption[];
  staff: StaffOption[];
}) {
  async function formAction(formData: FormData): Promise<void> {
    "use server";
    await createDeploymentAction(formData);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>New Deployment</CardTitle>
        <CardDescription>
          Record a new installation, upgrade, replacement, or maintenance deployment.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form action={formAction} className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
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
              <Label htmlFor="branch_name">Branch Name</Label>
              <Input id="branch_name" name="branch_name" required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contact_person">Branch Contact Person</Label>
              <Input id="contact_person" name="contact_person" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Branch Phone</Label>
              <Input id="phone" name="phone" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input id="city" name="city" />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="address">Branch Address</Label>
              <Textarea id="address" name="address" rows={3} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="state">State</Label>
              <Input id="state" name="state" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="deployment_type">Deployment Type</Label>
              <select
                id="deployment_type"
                name="deployment_type"
                defaultValue="new_installation"
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
                defaultValue="1"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="deployment_status">Deployment Status</Label>
              <select
                id="deployment_status"
                name="deployment_status"
                defaultValue="planned"
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
                defaultValue=""
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
              <Input id="install_date" name="install_date" type="date" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="go_live_date">Go Live Date</Label>
              <Input id="go_live_date" name="go_live_date" type="date" />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea id="notes" name="notes" rows={4} />
            </div>
          </div>

          <Button type="submit">Create Deployment</Button>
        </form>
      </CardContent>
    </Card>
  );
}