import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth/require-admin";
import { FieldJobInventoryRpcTestPanel } from "./field-job-inventory-rpc-test-panel";

const TEST_INVENTORY_ITEM_ID = "28bb24dc-21f3-45a8-aa6a-0187fabd9202";

type FieldJobOption = {
  id: string;
  job_number: string;
  title: string;
};

export default async function FieldJobInventoryRpcTestPage() {
  await requireAdmin();

  const supabase = await createClient();
  const [{ data: itemData, error: itemError }, { data: fieldJobsData }] =
    await Promise.all([
      (supabase as any)
        .from("inventory_items")
        .select("item_name, current_quantity")
        .eq("id", TEST_INVENTORY_ITEM_ID)
        .maybeSingle(),
      (supabase as any)
        .from("field_jobs")
        .select("id, job_number, title")
        .order("created_at", { ascending: false })
        .limit(25),
    ]);

  const currentQuantity =
    typeof itemData?.current_quantity === "number"
      ? itemData.current_quantity
      : itemData?.current_quantity == null
        ? null
        : Number(itemData.current_quantity);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-red-700">
          Temporary dev-only tool
        </p>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">
          Field-Job Inventory RPC Test
        </h2>
        <p className="text-slate-600">
          Admin-only verification page for public.issue_field_job_inventory.
        </p>
      </div>

      {itemError ? (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Failed to load test inventory item: {itemError.message}
        </div>
      ) : null}

      <FieldJobInventoryRpcTestPanel
        itemId={TEST_INVENTORY_ITEM_ID}
        fieldJobs={(fieldJobsData ?? []) as FieldJobOption[]}
        initialItemName={itemData?.item_name ?? null}
        initialCurrentQuantity={currentQuantity}
      />
    </div>
  );
}

