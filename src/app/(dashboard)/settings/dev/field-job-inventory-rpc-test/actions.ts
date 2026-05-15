"use server";

import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth/require-admin";

const TEST_INVENTORY_ITEM_ID = "28bb24dc-21f3-45a8-aa6a-0187fabd9202";

type UsageRow = {
  id: string;
  field_job_id: string;
  inventory_item_id: string;
  quantity: number;
  unit_cost: number;
  total_cost: number;
  notes: string | null;
  created_by: string | null;
  created_at: string;
};

type MovementRow = {
  id: string;
  inventory_item_id: string;
  movement_type: string;
  quantity: number;
  unit_cost: number | null;
  field_job_id: string | null;
  note: string | null;
  created_by: string | null;
  created_at: string;
};

export type FieldJobInventoryRpcTestState = {
  ok: boolean | null;
  operation: string | null;
  fieldJobId: string | null;
  response: unknown;
  error: string | null;
  currentQuantity: number | null;
  itemName: string | null;
  usageRows: UsageRow[];
  movementRows: MovementRow[];
  userId: string | null;
  testedAt: string | null;
};

const initialState: FieldJobInventoryRpcTestState = {
  ok: null,
  operation: null,
  fieldJobId: null,
  response: null,
  error: null,
  currentQuantity: null,
  itemName: null,
  usageRows: [],
  movementRows: [],
  userId: null,
  testedAt: null,
};

function getPayload(operation: string) {
  if (operation === "issue_1") {
    return {
      label: "issue quantity 1",
      quantity: 1,
      notes: "Temporary dev test: issue field-job inventory quantity 1",
    };
  }

  if (operation === "issue_2") {
    return {
      label: "issue quantity 2",
      quantity: 2,
      notes: "Temporary dev test: issue field-job inventory quantity 2",
    };
  }

  if (operation === "issue_999999") {
    return {
      label: "invalid issue quantity 999999",
      quantity: 999999,
      notes: "Temporary dev test: invalid issue field-job inventory quantity 999999",
    };
  }

  return null;
}

async function loadSnapshot(fieldJobId: string | null) {
  const supabase = await createClient();

  const { data: itemData, error: itemError } = await (supabase as any)
    .from("inventory_items")
    .select("item_name, current_quantity")
    .eq("id", TEST_INVENTORY_ITEM_ID)
    .maybeSingle();

  if (itemError) {
    throw new Error(itemError.message);
  }

  let usageQuery = (supabase as any)
    .from("field_job_inventory_usage")
    .select(
      "id, field_job_id, inventory_item_id, quantity, unit_cost, total_cost, notes, created_by, created_at"
    )
    .eq("inventory_item_id", TEST_INVENTORY_ITEM_ID)
    .order("created_at", { ascending: false })
    .limit(8);

  let movementQuery = (supabase as any)
    .from("inventory_movements")
    .select(
      "id, inventory_item_id, movement_type, quantity, unit_cost, field_job_id, note, created_by, created_at"
    )
    .eq("inventory_item_id", TEST_INVENTORY_ITEM_ID)
    .order("created_at", { ascending: false })
    .limit(8);

  if (fieldJobId) {
    usageQuery = usageQuery.eq("field_job_id", fieldJobId);
    movementQuery = movementQuery.eq("field_job_id", fieldJobId);
  }

  const [
    { data: usageData, error: usageError },
    { data: movementData, error: movementError },
  ] = await Promise.all([usageQuery, movementQuery]);

  if (usageError) {
    throw new Error(usageError.message);
  }

  if (movementError) {
    throw new Error(movementError.message);
  }

  return {
    itemName: itemData?.item_name ?? null,
    currentQuantity:
      typeof itemData?.current_quantity === "number"
        ? itemData.current_quantity
        : itemData?.current_quantity == null
          ? null
          : Number(itemData.current_quantity),
    usageRows: (usageData ?? []) as UsageRow[],
    movementRows: (movementData ?? []) as MovementRow[],
  };
}

export async function runFieldJobInventoryRpcTest(
  _previousState: FieldJobInventoryRpcTestState,
  formData: FormData
): Promise<FieldJobInventoryRpcTestState> {
  await requireAdmin();

  const fieldJobId = String(formData.get("field_job_id") ?? "").trim();
  const operation = String(formData.get("operation") ?? "");
  const payload = getPayload(operation);
  const testedAt = new Date().toISOString();

  if (!fieldJobId) {
    return {
      ...initialState,
      ok: false,
      operation,
      error: "Choose a field job before running the test.",
      testedAt,
    };
  }

  if (!payload) {
    return {
      ...initialState,
      ok: false,
      operation,
      fieldJobId,
      error: "Invalid temporary field-job inventory RPC test operation.",
      testedAt,
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return {
      ...initialState,
      ok: false,
      operation: payload.label,
      fieldJobId,
      error: userError?.message ?? "Authenticated user is required.",
      testedAt,
    };
  }

  console.info("[field-job-inventory-rpc-test-page]", {
    path: "DIRECT_ISSUE_FIELD_JOB_INVENTORY_RPC",
    operation: payload.label,
    fieldJobId,
    inventoryItemId: TEST_INVENTORY_ITEM_ID,
    quantity: payload.quantity,
    passesActorId: false,
  });

  const { data, error } = await (supabase as any).rpc("issue_field_job_inventory", {
    p_field_job_id: fieldJobId,
    p_inventory_item_id: TEST_INVENTORY_ITEM_ID,
    p_quantity: payload.quantity,
    p_notes: payload.notes,
  });

  let snapshot: Awaited<ReturnType<typeof loadSnapshot>>;

  try {
    snapshot = await loadSnapshot(fieldJobId);
  } catch (snapshotError) {
    const message =
      snapshotError instanceof Error
        ? snapshotError.message
        : "Failed to refresh field-job inventory snapshot.";

    return {
      ...initialState,
      ok: false,
      operation: payload.label,
      fieldJobId,
      response: data ?? null,
      error: `${error?.message ?? "RPC completed but snapshot refresh failed"}; ${message}`,
      userId: user.id,
      testedAt,
    };
  }

  return {
    ok: !error,
    operation: payload.label,
    fieldJobId,
    response: data ?? null,
    error: error?.message ?? null,
    currentQuantity: snapshot.currentQuantity,
    itemName: snapshot.itemName,
    usageRows: snapshot.usageRows,
    movementRows: snapshot.movementRows,
    userId: user.id,
    testedAt,
  };
}

