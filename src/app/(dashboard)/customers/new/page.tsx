import { CustomerForm } from "@/components/customers/customer-form";

export default function NewCustomerPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">
          New Customer
        </h2>
        <p className="text-slate-600">
          Create a customer directly without first creating a lead.
        </p>
      </div>

      <CustomerForm />
    </div>
  );
}