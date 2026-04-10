import { createClient } from "@/lib/supabase/server";
import { RestockOrderForm } from "@/components/restocking/restock-order-form";

type SupplierOption = {
  id: string;
  company_name: string;
};

type InventoryItemOption = {
  id: string;
  item_name: string;
  item_code: string;
};

export default async function NewRestockOrderPage() {
  const supabase = await createClient();

  const [{ data: suppliersData }, { data: inventoryItemsData }] = await Promise.all([
    supabase.from("suppliers").select("id, company_name").eq("is_active", true).order("company_name"),
    supabase.from("inventory_items").select("id, item_name, item_code").order("item_name"),
  ]);

  const suppliers = (suppliersData ?? []) as SupplierOption[];
  const inventoryItems = (inventoryItemsData ?? []) as InventoryItemOption[];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">
          Create Restock Order
        </h2>
        <p className="text-slate-600">
          Record an inventory purchase or supplier restocking order.
        </p>
      </div>

      <RestockOrderForm
        suppliers={suppliers}
        inventoryItems={inventoryItems}
      />
    </div>
  );
}