"use client";

import { useState, useTransition } from "react";
import { createProjectAction, updateProjectAction } from "@/lib/actions/projects";
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

type LeadOption = {
  id: string;
  company_name: string;
};

type QuotationOption = {
  id: string;
  quote_number: string;
  company_name: string;
  total: number;
};

type InvoiceOption = {
  id: string;
  invoice_number: string;
  amount: number;
  amount_paid: number;
  balance: number;
};

type StaffOption = {
  id: string;
  full_name: string;
};

type ProjectFormProps = {
  customers: CustomerOption[];
  leads: LeadOption[];
  quotations: QuotationOption[];
  invoices: InvoiceOption[];
  staffUsers: StaffOption[];
  project?: {
    id: string;
    project_name: string;
    customer_id: string | null;
    lead_id: string | null;
    quotation_id: string | null;
    invoice_id: string | null;
    receipt_id: string | null;
    project_type:
      | "website_development"
      | "pos_deployment"
      | "crm_setup"
      | "digital_marketing"
      | "networking_infrastructure"
      | "maintenance"
      | "custom_software"
      | "other";
    description: string | null;
    project_manager_id: string | null;
    start_date: string | null;
    deadline: string | null;
    priority: "low" | "medium" | "high" | "urgent";
    status:
      | "proposal"
      | "approved"
      | "paid"
      | "planning"
      | "in_progress"
      | "review"
      | "completed"
      | "maintenance"
      | "on_hold"
      | "cancelled";
    quotation_amount: number;
    amount_paid: number;
    payment_status: "unpaid" | "part_payment" | "paid_in_full";
    invoice_number: string | null;
    receipt_number: string | null;
    recurring_revenue: boolean;
    annual_renewal_amount: number;
    next_renewal_date: string | null;
    project_cost_estimate: number;
    progress: number;
  };
};

export function ProjectForm({
  customers,
  leads,
  quotations,
  invoices,
  staffUsers,
  project,
}: ProjectFormProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  const isEditing = Boolean(project);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isEditing ? "Edit Project" : "Create Project"}</CardTitle>
        <CardDescription>
          Manage client projects from payment confirmation to completion.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form
          action={(formData) => {
            setError("");

            startTransition(async () => {
              const result = project
                ? await updateProjectAction(project.id, formData)
                : await createProjectAction(formData);

              if (result && "error" in result) {
                setError(result.error);
              }
            });
          }}
          className="space-y-8"
        >
          <fieldset disabled={isPending} className="space-y-8">
            <div>
              <h3 className="mb-4 text-sm font-semibold text-slate-900">
                Project Information
              </h3>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="project_name">Project Name</Label>
                  <Input
                    id="project_name"
                    name="project_name"
                    defaultValue={project?.project_name ?? ""}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="customer_id">Client</Label>
                  <select
                    id="customer_id"
                    name="customer_id"
                    defaultValue={project?.customer_id ?? ""}
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
                  <Label htmlFor="lead_id">Linked Lead</Label>
                  <select
                    id="lead_id"
                    name="lead_id"
                    defaultValue={project?.lead_id ?? ""}
                    className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
                  >
                    <option value="">No linked lead</option>
                    {leads.map((lead) => (
                      <option key={lead.id} value={lead.id}>
                        {lead.company_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="project_type">Project Type</Label>
                  <select
                    id="project_type"
                    name="project_type"
                    defaultValue={project?.project_type ?? "website_development"}
                    className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
                  >
                    <option value="website_development">Website Development</option>
                    <option value="pos_deployment">POS Deployment</option>
                    <option value="crm_setup">CRM Setup</option>
                    <option value="digital_marketing">Digital Marketing</option>
                    <option value="networking_infrastructure">
                      Networking / Infrastructure
                    </option>
                    <option value="maintenance">Maintenance</option>
                    <option value="custom_software">Custom Software</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="project_manager_id">Project Manager</Label>
                  <select
                    id="project_manager_id"
                    name="project_manager_id"
                    defaultValue={project?.project_manager_id ?? ""}
                    className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
                  >
                    <option value="">Select project manager</option>
                    {staffUsers.map((staff) => (
                      <option key={staff.id} value={staff.id}>
                        {staff.full_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="start_date">Start Date</Label>
                  <Input
                    id="start_date"
                    name="start_date"
                    type="date"
                    defaultValue={project?.start_date ?? ""}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="deadline">Deadline</Label>
                  <Input
                    id="deadline"
                    name="deadline"
                    type="date"
                    defaultValue={project?.deadline ?? ""}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="priority">Priority</Label>
                  <select
                    id="priority"
                    name="priority"
                    defaultValue={project?.priority ?? "medium"}
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
                    defaultValue={project?.status ?? "planning"}
                    className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
                  >
                    <option value="proposal">Proposal</option>
                    <option value="approved">Approved</option>
                    <option value="paid">Paid</option>
                    <option value="planning">Planning</option>
                    <option value="in_progress">In Progress</option>
                    <option value="review">Review</option>
                    <option value="completed">Completed</option>
                    <option value="maintenance">Maintenance</option>
                    <option value="on_hold">On Hold</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    name="description"
                    rows={4}
                    defaultValue={project?.description ?? ""}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="progress">Progress %</Label>
                  <Input
                    id="progress"
                    name="progress"
                    type="number"
                    min="0"
                    max="100"
                    defaultValue={project?.progress ?? 0}
                  />
                </div>
              </div>
            </div>

            <div>
              <h3 className="mb-4 text-sm font-semibold text-slate-900">
                Financial Information
              </h3>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="quotation_id">Linked Quotation</Label>
                  <select
                    id="quotation_id"
                    name="quotation_id"
                    defaultValue={project?.quotation_id ?? ""}
                    className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
                  >
                    <option value="">No linked quotation</option>
                    {quotations.map((quotation) => (
                      <option key={quotation.id} value={quotation.id}>
                        {quotation.quote_number} — {quotation.company_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="invoice_id">Linked Invoice</Label>
                  <select
                    id="invoice_id"
                    name="invoice_id"
                    defaultValue={project?.invoice_id ?? ""}
                    className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
                  >
                    <option value="">No linked invoice</option>
                    {invoices.map((invoice) => (
                      <option key={invoice.id} value={invoice.id}>
                        {invoice.invoice_number}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="quotation_amount">Quotation Amount</Label>
                  <Input
                    id="quotation_amount"
                    name="quotation_amount"
                    type="number"
                    min="0"
                    step="0.01"
                    defaultValue={project?.quotation_amount ?? 0}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="amount_paid">Amount Paid</Label>
                  <Input
                    id="amount_paid"
                    name="amount_paid"
                    type="number"
                    min="0"
                    step="0.01"
                    defaultValue={project?.amount_paid ?? 0}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="payment_status">Payment Status</Label>
                  <select
                    id="payment_status"
                    name="payment_status"
                    defaultValue={project?.payment_status ?? "unpaid"}
                    className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
                  >
                    <option value="unpaid">Unpaid</option>
                    <option value="part_payment">Part Payment</option>
                    <option value="paid_in_full">Paid In Full</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="project_cost_estimate">
                    Project Cost Estimate
                  </Label>
                  <Input
                    id="project_cost_estimate"
                    name="project_cost_estimate"
                    type="number"
                    min="0"
                    step="0.01"
                    defaultValue={project?.project_cost_estimate ?? 0}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="invoice_number">Invoice Number</Label>
                  <Input
                    id="invoice_number"
                    name="invoice_number"
                    defaultValue={project?.invoice_number ?? ""}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="receipt_number">Receipt Number</Label>
                  <Input
                    id="receipt_number"
                    name="receipt_number"
                    defaultValue={project?.receipt_number ?? ""}
                  />
                </div>

                <div className="flex items-center gap-3 md:col-span-2">
                  <input
                    id="recurring_revenue"
                    name="recurring_revenue"
                    type="checkbox"
                    defaultChecked={project?.recurring_revenue ?? false}
                    className="h-4 w-4 rounded border-slate-300"
                  />
                  <Label htmlFor="recurring_revenue">
                    This project has recurring revenue
                  </Label>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="annual_renewal_amount">
                    Annual Renewal Amount
                  </Label>
                  <Input
                    id="annual_renewal_amount"
                    name="annual_renewal_amount"
                    type="number"
                    min="0"
                    step="0.01"
                    defaultValue={project?.annual_renewal_amount ?? 0}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="next_renewal_date">Next Renewal Date</Label>
                  <Input
                    id="next_renewal_date"
                    name="next_renewal_date"
                    type="date"
                    defaultValue={project?.next_renewal_date ?? ""}
                  />
                </div>
              </div>
            </div>

            {!isEditing ? (
              <div>
                <h3 className="mb-4 text-sm font-semibold text-slate-900">
                  Assigned Team Members
                </h3>

                <div className="grid gap-3 md:grid-cols-2">
                  {staffUsers.map((staff) => (
                    <label
                      key={staff.id}
                      className="flex items-center gap-3 rounded-xl border border-slate-200 p-3 text-sm"
                    >
                      <input
                        type="checkbox"
                        name="member_ids"
                        value={staff.id}
                        className="h-4 w-4 rounded border-slate-300"
                      />
                      <span>{staff.full_name}</span>
                    </label>
                  ))}
                </div>
              </div>
            ) : null}

            {error ? (
              <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
                {error}
              </div>
            ) : null}

            <Button type="submit" disabled={isPending}>
              {isPending
                ? "Saving..."
                : isEditing
                  ? "Save Changes"
                  : "Create Project"}
            </Button>
          </fieldset>
        </form>
      </CardContent>
    </Card>
  );
}