import { SupplierForm } from "@/components/suppliers/supplier-form";

export default function NewSupplierPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">
          Add Supplier
        </h2>
        <p className="text-slate-600">
          Create a supplier for purchases and restocking.
        </p>
      </div>

      <SupplierForm />
    </div>
  );
}