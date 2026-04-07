import { createClient } from "@/lib/supabase/server";
import { CustomerTable } from "@/components/customers/customer-table";

export default async function CustomersPage() {
  const supabase = await createClient();

  const { data: customers, error } = await supabase
    .from("customers")
    .select(`
      id,
      customer_code,
      company_name,
      contact_person,
      phone,
      plan_type,
      subscription_amount,
      status,
      account_manager:profiles!customers_account_manager_id_fkey(full_name)
    `)
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">
          Customers
        </h2>
        <p className="text-slate-600">
          Manage converted and active client accounts.
        </p>
      </div>

      {error ? (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          Failed to load customers: {error.message}
        </div>
      ) : (
        <CustomerTable customers={customers || []} />
      )}
    </div>
  );
}