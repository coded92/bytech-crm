import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth/require-admin";
import { InventoryRpcTestPanel } from "./inventory-rpc-test-panel";

const TEST_INVENTORY_ITEM_ID = "28bb24dc-21f3-45a8-aa6a-0187fabd9202";

export default async function InventoryRpcTestPage() {
  await requireAdmin();

  const supabase = await createClient();
  const { data, error } = await (supabase as any)
    .from("inventory_items")
    .select("item_name, current_quantity")
    .eq("id", TEST_INVENTORY_ITEM_ID)
    .maybeSingle();

  const currentQuantity =
    typeof data?.current_quantity === "number"
      ? data.current_quantity
      : data?.current_quantity == null
        ? null
        : Number(data.current_quantity);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-red-700">
          Temporary dev-only tool
        </p>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">
          Inventory RPC Test
        </h2>
        <p className="text-slate-600">
          Admin-only verification page for public.post_inventory_movement.
        </p>
      </div>

      {error ? (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Failed to load test item before running RPC: {error.message}
        </div>
      ) : null}

      <InventoryRpcTestPanel
        itemId={TEST_INVENTORY_ITEM_ID}
        initialItemName={data?.item_name ?? null}
        initialCurrentQuantity={currentQuantity}
      />
    </div>
  );
}

