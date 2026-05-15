"use server";

import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth/require-admin";
import {
  postStockMovement,
  type StockMovementType,
} from "@/lib/inventory/stock-integrity";

const TEST_INVENTORY_ITEM_ID = "28bb24dc-21f3-45a8-aa6a-0187fabd9202";
const CONFIRMATION_TOKEN = "CONFIRM_SAFE_RPC_TEST";

type InventoryTestMovement = "stock_in" | "stock_out";
type InventoryTestPath =
  | "RPC_TEST_PAGE_DIRECT_RPC"
  | "RPC_MODE"
  | "LEGACY_MODE";

export type InventoryRpcTestState = {
  ok: boolean | null;
  operation: string | null;
  response: unknown;
  error: string | null;
  currentQuantity: number | null;
  itemName: string | null;
  userId: string | null;
  testedAt: string | null;
  rawUseInventoryRpc: string | null;
  parsedUseInventoryRpc: boolean;
  executionMode: InventoryTestPath | null;
};

const initialState: InventoryRpcTestState = {
  ok: null,
  operation: null,
  response: null,
  error: null,
  currentQuantity: null,
  itemName: null,
  userId: null,
  testedAt: null,
  rawUseInventoryRpc: null,
  parsedUseInventoryRpc: false,
  executionMode: null,
};

function getRpcPayload(operation: string) {
  if (operation === "stock_in_5") {
    return {
      label: "stock_in 5",
      movementType: "stock_in" satisfies InventoryTestMovement,
      quantity: 5,
      note: "Temporary dev RPC test: stock_in 5",
      requiresConfirmation: true,
    };
  }

  if (operation === "stock_out_2") {
    return {
      label: "stock_out 2",
      movementType: "stock_out" satisfies InventoryTestMovement,
      quantity: 2,
      note: "Temporary dev RPC test: stock_out 2",
      requiresConfirmation: true,
    };
  }

  if (operation === "stock_out_999999") {
    return {
      label: "invalid stock_out 999999",
      movementType: "stock_out" satisfies InventoryTestMovement,
      quantity: 999999,
      note: "Temporary dev RPC test: invalid stock_out 999999",
      requiresConfirmation: false,
    };
  }

  return null;
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "string") {
    return error;
  }

  return "Unknown inventory RPC test error";
}

function getInventoryRpcFlagState() {
  const rawUseInventoryRpc = process.env.USE_INVENTORY_RPC ?? null;

  return {
    rawUseInventoryRpc,
    parsedUseInventoryRpc: rawUseInventoryRpc === "true",
  };
}

function logDirectRpcTestPageBypass(operation: string) {
  const flagState = getInventoryRpcFlagState();

  console.info("[inventory-rpc-test-page]", {
    raw_USE_INVENTORY_RPC: flagState.rawUseInventoryRpc,
    parsed_USE_INVENTORY_RPC: flagState.parsedUseInventoryRpc,
    path: "RPC_TEST_PAGE_DIRECT_RPC",
    bypassesPostStockMovement: true,
    operation,
    inventoryItemId: TEST_INVENTORY_ITEM_ID,
  });
}

function logHelperTestPagePath(operation: string) {
  const flagState = getInventoryRpcFlagState();
  const executionMode: Extract<InventoryTestPath, "RPC_MODE" | "LEGACY_MODE"> =
    flagState.parsedUseInventoryRpc ? "RPC_MODE" : "LEGACY_MODE";

  console.info("[inventory-rpc-helper-test-page]", {
    raw_USE_INVENTORY_RPC: flagState.rawUseInventoryRpc,
    parsed_USE_INVENTORY_RPC: flagState.parsedUseInventoryRpc,
    path: executionMode,
    callsPostStockMovement: true,
    operation,
    inventoryItemId: TEST_INVENTORY_ITEM_ID,
  });

  return {
    ...flagState,
    executionMode,
  };
}

async function getCurrentInventoryQuantity() {
  const supabase = await createClient();

  const { data, error } = await (supabase as any)
    .from("inventory_items")
    .select("item_name, current_quantity")
    .eq("id", TEST_INVENTORY_ITEM_ID)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return {
    itemName: data?.item_name ?? null,
    currentQuantity:
      typeof data?.current_quantity === "number"
        ? data.current_quantity
        : data?.current_quantity == null
          ? null
          : Number(data.current_quantity),
  };
}

export async function runInventoryRpcTest(
  _previousState: InventoryRpcTestState,
  formData: FormData
): Promise<InventoryRpcTestState> {
  await requireAdmin();

  const operation = String(formData.get("operation") ?? "");
  const payload = getRpcPayload(operation);

  if (!payload) {
    const flagState = getInventoryRpcFlagState();

    return {
      ...initialState,
      ok: false,
      operation,
      error: "Invalid temporary inventory RPC test operation.",
      testedAt: new Date().toISOString(),
      ...flagState,
      executionMode: "RPC_TEST_PAGE_DIRECT_RPC",
    };
  }

  if (
    payload.requiresConfirmation &&
    formData.get("confirmation") !== CONFIRMATION_TOKEN
  ) {
    const flagState = getInventoryRpcFlagState();

    return {
      ...initialState,
      ok: false,
      operation: payload.label,
      error:
        "Confirmation is required before running a valid inventory mutation test.",
      testedAt: new Date().toISOString(),
      ...flagState,
      executionMode: "RPC_TEST_PAGE_DIRECT_RPC",
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    const flagState = getInventoryRpcFlagState();

    return {
      ...initialState,
      ok: false,
      operation: payload.label,
      error: userError?.message ?? "Authenticated user is required.",
      testedAt: new Date().toISOString(),
      ...flagState,
      executionMode: "RPC_TEST_PAGE_DIRECT_RPC",
    };
  }

  logDirectRpcTestPageBypass(payload.label);
  const flagState = getInventoryRpcFlagState();

  const { data, error } = await (supabase as any).rpc("post_inventory_movement", {
    p_inventory_item_id: TEST_INVENTORY_ITEM_ID,
    p_movement_type: payload.movementType,
    p_quantity: payload.quantity,
    p_unit_cost: null,
    p_field_job_id: null,
    p_note: payload.note,
  });

  let quantityResult: Awaited<ReturnType<typeof getCurrentInventoryQuantity>> = {
    itemName: null,
    currentQuantity: null,
  };

  try {
    quantityResult = await getCurrentInventoryQuantity();
  } catch (quantityError) {
    return {
      ok: false,
      operation: payload.label,
      response: data ?? null,
      error: `${error?.message ?? getErrorMessage(quantityError)}; quantity refresh failed: ${getErrorMessage(
        quantityError
      )}`,
      currentQuantity: null,
      itemName: null,
      userId: user.id,
      testedAt: new Date().toISOString(),
      ...flagState,
      executionMode: "RPC_TEST_PAGE_DIRECT_RPC",
    };
  }

  return {
    ok: !error,
    operation: payload.label,
    response: data ?? null,
    error: error?.message ?? null,
    currentQuantity: quantityResult.currentQuantity,
    itemName: quantityResult.itemName,
    userId: user.id,
    testedAt: new Date().toISOString(),
    ...flagState,
    executionMode: "RPC_TEST_PAGE_DIRECT_RPC",
  };
}

export async function runInventoryHelperTest(
  _previousState: InventoryRpcTestState,
  formData: FormData
): Promise<InventoryRpcTestState> {
  await requireAdmin();

  const operation = String(formData.get("operation") ?? "");
  const payload = getRpcPayload(operation);

  if (!payload) {
    const flagState = getInventoryRpcFlagState();

    return {
      ...initialState,
      ok: false,
      operation,
      error: "Invalid temporary inventory helper test operation.",
      testedAt: new Date().toISOString(),
      ...flagState,
      executionMode: flagState.parsedUseInventoryRpc ? "RPC_MODE" : "LEGACY_MODE",
    };
  }

  if (
    payload.requiresConfirmation &&
    formData.get("confirmation") !== CONFIRMATION_TOKEN
  ) {
    const flagState = getInventoryRpcFlagState();

    return {
      ...initialState,
      ok: false,
      operation: payload.label,
      error:
        "Confirmation is required before running a valid inventory helper mutation test.",
      testedAt: new Date().toISOString(),
      ...flagState,
      executionMode: flagState.parsedUseInventoryRpc ? "RPC_MODE" : "LEGACY_MODE",
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    const flagState = getInventoryRpcFlagState();

    return {
      ...initialState,
      ok: false,
      operation: payload.label,
      error: userError?.message ?? "Authenticated user is required.",
      testedAt: new Date().toISOString(),
      ...flagState,
      executionMode: flagState.parsedUseInventoryRpc ? "RPC_MODE" : "LEGACY_MODE",
    };
  }

  const helperPath = logHelperTestPagePath(payload.label);
  const movementResult = await postStockMovement({
    supabase,
    inventoryItemId: TEST_INVENTORY_ITEM_ID,
    movementType: payload.movementType as StockMovementType,
    quantity: payload.quantity,
    unitCost: null,
    fieldJobId: null,
    note: payload.note,
    actorId: user.id,
  });

  let quantityResult: Awaited<ReturnType<typeof getCurrentInventoryQuantity>> = {
    itemName: null,
    currentQuantity: null,
  };

  try {
    quantityResult = await getCurrentInventoryQuantity();
  } catch (quantityError) {
    return {
      ok: false,
      operation: payload.label,
      response: movementResult,
      error: `${
        "error" in movementResult
          ? movementResult.error
          : getErrorMessage(quantityError)
      }; quantity refresh failed: ${getErrorMessage(quantityError)}`,
      currentQuantity: null,
      itemName: null,
      userId: user.id,
      testedAt: new Date().toISOString(),
      ...helperPath,
    };
  }

  return {
    ok: !("error" in movementResult),
    operation: payload.label,
    response: movementResult,
    error: "error" in movementResult ? movementResult.error : null,
    currentQuantity: quantityResult.currentQuantity,
    itemName: quantityResult.itemName,
    userId: user.id,
    testedAt: new Date().toISOString(),
    ...helperPath,
  };
}
