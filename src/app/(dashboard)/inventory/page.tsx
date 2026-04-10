import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth/require-profile";
import { InventoryTable } from "@/components/inventory/inventory-table";
import { Button } from "@/components/ui/button";

type InventoryRow = {
  id: string;
  item_code: string;
  item_name: string;
  category: string;
  unit: string;
  current_quantity: number;
  minimum_quantity: number;
  unit_cost: number;
};

export default async function InventoryPage() {
  await requireProfile();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("inventory_items")
    .select("id, item_code, item_name, category, unit, current_quantity, minimum_quantity, unit_cost")
    .order("item_name", { ascending: true });

  const items = (data ?? []) as InventoryRow[];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            Inventory
          </h2>
          <p className="text-slate-600">
            Track repair materials, spare parts, tools, and accessories.
          </p>
        </div>

        <Button asChild>
          <Link href="/inventory/new">Add Inventory Item</Link>
        </Button>
      </div>

      {error ? (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          Failed to load inventory: {error.message}
        </div>
      ) : (
        <InventoryTable items={items} />
      )}
    </div>
  );
}