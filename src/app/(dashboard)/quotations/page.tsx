import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { QuotationTable } from "@/components/quotations/quotation-table";
import { Button } from "@/components/ui/button";

export default async function QuotationsPage() {
  const supabase = await createClient();

  const { data: quotations, error } = await supabase
    .from("quotations")
    .select("id, quote_number, company_name, status, total, valid_until, created_at")
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            Quotations
          </h2>
          <p className="text-slate-600">
            Create and manage customer quotations.
          </p>
        </div>

        <Button asChild>
          <Link href="/quotations/new">Create Quotation</Link>
        </Button>
      </div>

      {error ? (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          Failed to load quotations: {error.message}
        </div>
      ) : (
        <QuotationTable quotations={quotations || []} />
      )}
    </div>
  );
}