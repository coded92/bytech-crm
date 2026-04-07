import Link from "next/link";
import { notFound } from "next/navigation";
import type { Customer } from "@/types";
import { createClient } from "@/lib/supabase/server";
import { formatCurrency } from "@/lib/utils/format-currency";
import { formatDate, formatDateTime } from "@/lib/utils/format-date";
import { CustomerStatusBadge } from "@/components/customers/customer-status-badge";
import { CustomerStatusForm } from "@/components/customers/customer-status-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type CustomerDetailsPageProps = {
  params: Promise<{
    id: string;
  }>;
};

type InvoiceRow = {
  id: string;
  invoice_number: string;
  amount: number;
  status: string;
  due_date: string;
};

type RelatedLead = {
  id: string;
  company_name: string;
} | null;

export default async function CustomerDetailsPage({
  params,
}: CustomerDetailsPageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: customerData }, { data: recentInvoices }, { data: relatedLead }] =
    await Promise.all([
      supabase
        .from("customers")
        .select(`
          *,
          account_manager:profiles!customers_account_manager_id_fkey(full_name),
          created_by_profile:profiles!customers_created_by_fkey(full_name)
        `)
        .eq("id", id)
        .single(),
      supabase
        .from("payment_invoices")
        .select("id, invoice_number, amount, status, due_date")
        .eq("customer_id", id)
        .order("created_at", { ascending: false })
        .limit(5),
      supabase
        .from("leads")
        .select("id, company_name")
        .eq("converted_customer_id", id)
        .maybeSingle(),
    ]);

  const customer = customerData as Customer | null;
  const invoices = (recentInvoices ?? []) as InvoiceRow[];
  const sourceLead = relatedLead as RelatedLead;

  if (!customer) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            {customer.company_name}
          </h2>
          <p className="text-slate-600">{customer.contact_person}</p>
        </div>

        <div className="flex items-center gap-3">
          <CustomerStatusBadge status={customer.status} />
          {sourceLead ? (
            <Button asChild variant="outline">
              <Link href={`/leads/${sourceLead.id}`}>View Source Lead</Link>
            </Button>
          ) : null}
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Customer Information</CardTitle>
            </CardHeader>

            <CardContent className="grid gap-4 md:grid-cols-2">
              <InfoItem label="Customer Code" value={customer.customer_code} />
              <InfoItem label="Company" value={customer.company_name} />
              <InfoItem label="Contact Person" value={customer.contact_person} />
              <InfoItem label="Phone" value={customer.phone} />
              <InfoItem label="Email" value={customer.email} />
              <InfoItem label="Alternate Phone" value={customer.alternate_phone} />
              <InfoItem label="Business Type" value={customer.business_type} />
              <InfoItem label="Industry" value={customer.industry} />
              <InfoItem label="City" value={customer.city} />
              <InfoItem label="State" value={customer.state} />
              <InfoItem label="Plan Type" value={customer.plan_type} />
              <InfoItem
                label="Subscription Amount"
                value={formatCurrency(customer.subscription_amount)}
              />
              <InfoItem
                label="Setup Fee"
                value={formatCurrency(customer.setup_fee)}
              />
              <InfoItem label="Billing Cycle" value={customer.billing_cycle} />
              <InfoItem
                label="Onboarding Date"
                value={formatDate(customer.onboarding_date)}
              />
              <InfoItem
                label="Go Live Date"
                value={formatDate(customer.go_live_date)}
              />
              <InfoItem
                label="Account Manager"
                value={customer.account_manager?.full_name ?? "-"}
              />
              <InfoItem
                label="Created By"
                value={customer.created_by_profile?.full_name ?? "-"}
              />
              <InfoItem label="Address" value={customer.address} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Invoices</CardTitle>
            </CardHeader>

            <CardContent className="space-y-4">
              {invoices.length === 0 ? (
                <div className="text-sm text-slate-500">
                  No invoices yet for this customer.
                </div>
              ) : (
                invoices.map((invoice) => (
                  <div
                    key={invoice.id}
                    className="flex items-center justify-between rounded-xl border border-slate-200 p-4"
                  >
                    <div>
                      <p className="text-sm font-medium text-slate-900">
                        {invoice.invoice_number}
                      </p>
                      <p className="text-xs text-slate-500">
                        Due: {formatDate(invoice.due_date)}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-sm font-medium text-slate-900">
                        {formatCurrency(invoice.amount)}
                      </p>
                      <p className="text-xs capitalize text-slate-500">
                        {invoice.status.replaceAll("_", " ")}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <CustomerStatusForm
            customerId={customer.id}
            currentStatus={customer.status}
            currentNotes={customer.notes}
          />

          <Card>
            <CardHeader>
              <CardTitle>Quick Summary</CardTitle>
            </CardHeader>

            <CardContent className="space-y-3 text-sm">
              <SummaryItem label="Created" value={formatDateTime(customer.created_at)} />
              <SummaryItem label="Updated" value={formatDateTime(customer.updated_at)} />
              <SummaryItem label="Status" value={customer.status} />
              <SummaryItem label="Notes" value={customer.notes || "-"} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function InfoItem({
  label,
  value,
}: {
  label: string;
  value?: string | number | null;
}) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className="mt-1 text-sm text-slate-900">{value ?? "-"}</p>
    </div>
  );
}

function SummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-slate-500">{label}</span>
      <span className="text-right capitalize text-slate-900">{value}</span>
    </div>
  );
}