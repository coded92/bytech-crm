import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth/require-profile";
import { InvoiceTable } from "@/components/payments/invoice-table";
import { Button } from "@/components/ui/button";

export default async function InvoicesPage() {
  const profile = await requireProfile();
  const supabase = await createClient();

  const { data: invoices, error } = await supabase
    .from("payment_invoices")
    .select(`
      id,
      invoice_number,
      invoice_type,
      amount,
      amount_paid,
      balance,
      due_date,
      status,
      customer:customers(company_name)
    `)
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            Invoices
          </h2>
          <p className="text-slate-600">
            Manage setup fees, subscriptions, and custom billing.
          </p>
        </div>

        {profile.role === "admin" ? (
          <Button asChild>
            <Link href="/payments/invoices/new">Create Invoice</Link>
          </Button>
        ) : null}
      </div>

      {error ? (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          Failed to load invoices: {error.message}
        </div>
      ) : (
        <InvoiceTable invoices={invoices || []} />
      )}
    </div>
  );
}