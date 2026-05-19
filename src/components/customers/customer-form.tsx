"use client";

import { useState, useTransition } from "react";
import type { ReactNode } from "react";
import { ArrowLeft, Building2, CalendarDays, CreditCard, MapPin, UserRound } from "lucide-react";
import Link from "next/link";
import { createCustomerAction } from "@/lib/actions/customers";
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

type AccountManagerOption = {
  id: string;
  full_name: string | null;
  department: string | null;
};

type CustomerFormProps = {
  accountManagers?: AccountManagerOption[];
};

const inputClass =
  "h-11 rounded-2xl border-slate-200 bg-white/90 shadow-sm shadow-slate-100 focus-visible:ring-indigo-500/20";

const selectClass =
  "flex h-11 w-full rounded-2xl border border-slate-200 bg-white/90 px-3 py-2 text-sm shadow-sm shadow-slate-100 outline-none transition-colors focus:border-indigo-400 focus:ring-3 focus:ring-indigo-500/20";

export function CustomerForm({ accountManagers = [] }: CustomerFormProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <Button asChild variant="ghost" size="sm" className="text-indigo-700">
          <Link href="/customers">
            <ArrowLeft className="size-4" />
            Back to customers
          </Link>
        </Button>
      </div>

      <Card className="border-white/80 bg-white/95 shadow-xl shadow-indigo-100/50">
        <CardHeader className="border-b border-slate-100 bg-gradient-to-br from-white to-indigo-50/50 p-5 sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-2xl font-semibold tracking-tight text-slate-950">
                New Customer
              </CardTitle>
              <CardDescription className="mt-1">
                Create a customer account with profile, billing, lifecycle, and ownership details.
              </CardDescription>
            </div>
            <div className="flex size-12 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-200">
              <Building2 className="size-5" />
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-5 sm:p-6">
          <form
            action={(formData) => {
              setError("");

              startTransition(async () => {
                const result = await createCustomerAction(formData);

                if ("error" in result) {
                  setError(result.error);
                }
              });
            }}
            className="space-y-6"
          >
            <fieldset disabled={isPending} className="space-y-6">
              <FormSection
                icon={<Building2 className="size-4" />}
                title="Company Profile"
                description="Core account classification and ownership."
              >
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="company_name">Company Name</Label>
                  <Input id="company_name" name="company_name" className={inputClass} required />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="business_type">Business Type</Label>
                  <Input
                    id="business_type"
                    name="business_type"
                    className={inputClass}
                    placeholder="Retail, Pharmacy, Restaurant..."
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="industry">Industry</Label>
                  <Input
                    id="industry"
                    name="industry"
                    className={inputClass}
                    placeholder="Technology, Finance, Healthcare..."
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <select id="status" name="status" defaultValue="active" className={selectClass}>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="suspended">Suspended</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="account_manager_id">Account Manager</Label>
                  <select id="account_manager_id" name="account_manager_id" defaultValue="" className={selectClass}>
                    <option value="">Unassigned</option>
                    {accountManagers.map((manager) => (
                      <option key={manager.id} value={manager.id}>
                        {manager.full_name || "Unnamed user"}
                        {manager.department ? ` - ${manager.department}` : ""}
                      </option>
                    ))}
                  </select>
                </div>
              </FormSection>

              <FormSection
                icon={<UserRound className="size-4" />}
                title="Primary Contact"
                description="Customer communication details used across CRM workflows."
              >
                <div className="space-y-2">
                  <Label htmlFor="contact_person">Contact Person</Label>
                  <Input id="contact_person" name="contact_person" className={inputClass} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" name="email" type="email" className={inputClass} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input id="phone" name="phone" className={inputClass} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="alternate_phone">Alternate Phone</Label>
                  <Input id="alternate_phone" name="alternate_phone" className={inputClass} />
                </div>
              </FormSection>

              <FormSection
                icon={<CreditCard className="size-4" />}
                title="Billing & Plan"
                description="Commercial terms already supported by the CRM database."
              >
                <div className="space-y-2">
                  <Label htmlFor="plan_type">Plan Type</Label>
                  <select id="plan_type" name="plan_type" defaultValue="cloud" className={selectClass}>
                    <option value="">No plan yet</option>
                    <option value="cloud">Cloud</option>
                    <option value="offline">Offline</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="billing_cycle">Billing Cycle</Label>
                  <select id="billing_cycle" name="billing_cycle" defaultValue="monthly" className={selectClass}>
                    <option value="">No billing yet</option>
                    <option value="monthly">Monthly</option>
                    <option value="quarterly">Quarterly</option>
                    <option value="yearly">Yearly</option>
                    <option value="one_time">One Time</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="subscription_amount">Subscription Amount</Label>
                  <Input
                    id="subscription_amount"
                    name="subscription_amount"
                    type="number"
                    min="0"
                    step="0.01"
                    defaultValue="0"
                    className={inputClass}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="setup_fee">Setup Fee</Label>
                  <Input
                    id="setup_fee"
                    name="setup_fee"
                    type="number"
                    min="0"
                    step="0.01"
                    defaultValue="0"
                    className={inputClass}
                  />
                </div>
              </FormSection>

              <FormSection
                icon={<CalendarDays className="size-4" />}
                title="Lifecycle"
                description="Operational dates for onboarding and go-live tracking."
              >
                <div className="space-y-2">
                  <Label htmlFor="onboarding_date">Onboarding Date</Label>
                  <Input id="onboarding_date" name="onboarding_date" type="date" className={inputClass} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="go_live_date">Go Live Date</Label>
                  <Input id="go_live_date" name="go_live_date" type="date" className={inputClass} />
                </div>
              </FormSection>

              <FormSection
                icon={<MapPin className="size-4" />}
                title="Location & Notes"
                description="Address, region, and account context."
              >
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input id="city" name="city" className={inputClass} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="state">State</Label>
                  <Input id="state" name="state" className={inputClass} />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="address">Address</Label>
                  <Textarea id="address" name="address" rows={3} className="rounded-2xl border-slate-200 bg-white/90 shadow-sm shadow-slate-100" />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea id="notes" name="notes" rows={4} className="rounded-2xl border-slate-200 bg-white/90 shadow-sm shadow-slate-100" />
                </div>
              </FormSection>

              {error ? (
                <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              ) : null}

              <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
                <Button asChild variant="outline">
                  <Link href="/customers">Cancel</Link>
                </Button>
                <Button type="submit" disabled={isPending} className="bg-indigo-600 hover:bg-indigo-700">
                  {isPending ? "Saving..." : "Create Customer"}
                </Button>
              </div>
            </fieldset>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

function FormSection({
  icon,
  title,
  description,
  children,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-3xl border border-slate-200/80 bg-slate-50/60 p-4 sm:p-5">
      <div className="mb-4 flex items-start gap-3">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-700">
          {icon}
        </div>
        <div>
          <h3 className="text-sm font-semibold text-slate-950">{title}</h3>
          <p className="mt-1 text-xs text-slate-500">{description}</p>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2">{children}</div>
    </section>
  );
}
