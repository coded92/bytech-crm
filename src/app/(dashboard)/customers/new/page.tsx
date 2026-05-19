import { CustomerForm } from "@/components/customers/customer-form";
import { requireModule } from "@/lib/auth/require-module";
import { createClient } from "@/lib/supabase/server";

export default async function NewCustomerPage() {
  await requireModule("customers");

  const supabase = await createClient();
  const { data: accountManagers } = await supabase
    .from("profiles")
    .select("id, full_name, department")
    .eq("is_active", true)
    .order("full_name", { ascending: true });

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-600">
          Customer Workspace
        </p>
        <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
          New Customer
        </h2>
        <p className="mt-2 max-w-2xl text-sm text-slate-600">
          Create a customer directly without first creating a lead. Only existing CRM customer fields are used here.
        </p>
      </div>

      <CustomerForm accountManagers={accountManagers || []} />
    </div>
  );
}
