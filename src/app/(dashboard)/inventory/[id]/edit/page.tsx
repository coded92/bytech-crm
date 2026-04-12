import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { InventoryItemEditForm } from "@/components/inventory/inventory-item-edit-form";

type EditInventoryItemPageProps = {
  params: Promise<{ id: string }>;
};

type InventoryItemRow = {
  id: string;
  item_code: string;
  item_name: string;
  category:
    | "cables"
    | "printer_parts"
    | "network_devices"
    | "accessories"
    | "spare_parts"
    | "tools"
    | "consumables"
    | "other";
  sku: string | null;
  unit: string;
  current_quantity: number;
  minimum_quantity: number;
  unit_cost: number;
  notes: string | null;
};

export default async function EditInventoryItemPage({
  params,
}: EditInventoryItemPageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: item } = await supabase
    .from("inventory_items")
    .select(
      "id, item_code, item_name, category, sku, unit, current_quantity, minimum_quantity, unit_cost, notes"
    )
    .eq("id", id)
    .single();

  if (!item) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">
          Edit Inventory Item
        </h2>
        <p className="text-slate-600">
          Update inventory item details and stock settings.
        </p>
      </div>

      <InventoryItemEditForm item={item as InventoryItemRow} />
    </div>
  );
}