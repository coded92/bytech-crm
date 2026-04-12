import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SupplierEditForm } from "@/components/suppliers/supplier-edit-form";

type EditSupplierPageProps = {
  params: Promise<{ id: string }>;
};

type SupplierRow = {
  id: string;
  company_name: string;
  contact_person: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  notes: string | null;
  is_active: boolean;
};

export default async function EditSupplierPage({
  params,
}: EditSupplierPageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: supplier } = await supabase
    .from("suppliers")
    .select(
      "id, company_name, contact_person, email, phone, address, city, state, notes, is_active"
    )
    .eq("id", id)
    .single();

  if (!supplier) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">
          Edit Supplier
        </h2>
        <p className="text-slate-600">
          Update supplier contact details and status.
        </p>
      </div>

      <SupplierEditForm supplier={supplier as SupplierRow} />
    </div>
  );
}