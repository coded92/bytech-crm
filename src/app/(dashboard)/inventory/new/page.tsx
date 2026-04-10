import { InventoryItemForm } from "@/components/inventory/inventory-item-form";

export default function NewInventoryItemPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">
          Add Inventory Item
        </h2>
        <p className="text-slate-600">
          Create a stock record for materials, spare parts, or accessories.
        </p>
      </div>

      <InventoryItemForm />
    </div>
  );
}