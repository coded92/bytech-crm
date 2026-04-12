import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CustomerEditForm } from "@/components/customers/customer-edit-form";

type EditCustomerPageProps = {
  params: Promise<{ id: string }>;
};

type CustomerRow = {
  id: string;
  company_name: string;
  contact_person: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  business_type: string | null;
  plan_type: "cloud" | "offline" | null;
  billing_cycle: "monthly" | "quarterly" | "yearly" | "one_time" | null;
  subscription_amount: number;
  setup_fee: number;
  status: "active" | "inactive" | "suspended";
  notes: string | null;
};

export default async function EditCustomerPage({
  params,
}: EditCustomerPageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: customer } = await supabase
    .from("customers")
    .select(
      "id, company_name, contact_person, phone, email, address, city, state, business_type, plan_type, billing_cycle, subscription_amount, setup_fee, status, notes"
    )
    .eq("id", id)
    .single();

  if (!customer) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">
          Edit Customer
        </h2>
        <p className="text-slate-600">
          Update customer account details and billing information.
        </p>
      </div>

      <CustomerEditForm customer={customer as CustomerRow} />
    </div>
  );
}