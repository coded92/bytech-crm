import { notFound } from "next/navigation";
import { CustomerEditForm } from "@/components/customers/customer-edit-form";
import { requireModule } from "@/lib/auth/require-module";
import { createClient } from "@/lib/supabase/server";

type EditCustomerPageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditCustomerPage({
  params,
}: EditCustomerPageProps) {
  await requireModule("customers");

  const { id } = await params;
  const supabase = await createClient();

  const [{ data: customer }, { data: accountManagers }] = await Promise.all([
    supabase
      .from("customers")
      .select(
        "id, company_name, contact_person, phone, alternate_phone, email, address, city, state, industry, business_type, plan_type, billing_cycle, subscription_amount, setup_fee, onboarding_date, go_live_date, account_manager_id, status, notes"
      )
      .eq("id", id)
      .single(),
    supabase
      .from("profiles")
      .select("id, full_name, department")
      .eq("is_active", true)
      .order("full_name", { ascending: true }),
  ]);

  if (!customer) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-600">
          Customer Workspace
        </p>
        <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
          Edit Customer
        </h2>
        <p className="mt-2 max-w-2xl text-sm text-slate-600">
          Update customer account details and billing information without changing the underlying business logic.
        </p>
      </div>

      <CustomerEditForm
        customer={customer}
        accountManagers={accountManagers || []}
      />
    </div>
  );
}
