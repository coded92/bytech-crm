"use client";

import { useActionState, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  runInventoryHelperTest,
  runInventoryRpcTest,
  type InventoryRpcTestState,
} from "./actions";

type InventoryRpcTestPanelProps = {
  initialCurrentQuantity: number | null;
  initialItemName: string | null;
  itemId: string;
};

const CONFIRMATION_TOKEN = "CONFIRM_SAFE_RPC_TEST";

type Scenario = {
  operation: string;
  label: string;
  tone: "valid" | "invalid";
  payload: {
    p_inventory_item_id: string;
    p_movement_type: "stock_in" | "stock_out";
    p_quantity: number;
    p_unit_cost: null;
    p_field_job_id: null;
    p_note: string;
  };
};

type TestSectionProps = {
  title: string;
  description: string;
  buttonPrefix?: string;
  selectedOperation: string;
  setSelectedOperation: (operation: string) => void;
  state: InventoryRpcTestState;
  formAction: (formData: FormData) => void;
  pending: boolean;
  selectedScenario: Scenario | undefined;
  scenarios: Scenario[];
  submitLabelPrefix: string;
};

function formatJson(value: unknown) {
  if (value == null) {
    return "null";
  }

  return JSON.stringify(value, null, 2);
}

function ModeReadout({ state }: { state: InventoryRpcTestState }) {
  return (
    <div className="grid gap-2 rounded-md border border-slate-200 bg-white p-3 text-xs text-slate-700 md:grid-cols-3">
      <div>
        <p className="font-medium uppercase text-slate-500">
          raw USE_INVENTORY_RPC
        </p>
        <p className="font-mono text-slate-950">
          {state.rawUseInventoryRpc ?? "not read yet"}
        </p>
      </div>
      <div>
        <p className="font-medium uppercase text-slate-500">parsed flag</p>
        <p className="font-mono text-slate-950">
          {state.parsedUseInventoryRpc ? "true" : "false"}
        </p>
      </div>
      <div>
        <p className="font-medium uppercase text-slate-500">execution mode</p>
        <p className="font-mono text-slate-950">
          {state.executionMode ?? "not run yet"}
        </p>
      </div>
    </div>
  );
}

function ResultPanel({
  state,
  pending,
}: {
  state: InventoryRpcTestState;
  pending: boolean;
}) {
  return (
    <>
      {pending ? (
        <div className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600">
          Calling selected inventory test path...
        </div>
      ) : null}

      {state.operation ? (
        <div
          className={
            state.ok
              ? "rounded-md border border-emerald-200 bg-emerald-50 p-3"
              : "rounded-md border border-red-200 bg-red-50 p-3"
          }
        >
          <p className="text-sm font-semibold text-slate-950">
            {state.operation}: {state.ok ? "success" : "failed"}
          </p>
          {state.error ? (
            <p className="mt-1 text-sm text-red-700">{state.error}</p>
          ) : null}
          <p className="mt-2 text-xs text-slate-600">
            User: {state.userId ?? "unknown"} | Tested:{" "}
            {state.testedAt ?? "not run"}
          </p>
        </div>
      ) : null}

      <div className="space-y-2">
        <p className="text-sm font-medium text-slate-900">Response</p>
        <pre className="max-h-96 overflow-auto rounded-md border border-slate-200 bg-slate-950 p-3 text-xs text-slate-50">
          {formatJson(state.response)}
        </pre>
      </div>
    </>
  );
}

function TestSection({
  title,
  description,
  buttonPrefix = "",
  selectedOperation,
  setSelectedOperation,
  state,
  formAction,
  pending,
  selectedScenario,
  scenarios,
  submitLabelPrefix,
}: TestSectionProps) {
  const validScenarios = scenarios.filter((scenario) => scenario.tone === "valid");
  const invalidScenarios = scenarios.filter(
    (scenario) => scenario.tone === "invalid"
  );

  return (
    <section className="space-y-4 rounded-md border border-slate-200 bg-white p-4">
      <div className="space-y-1">
        <h4 className="text-base font-semibold text-slate-950">{title}</h4>
        <p className="text-sm text-slate-600">{description}</p>
      </div>

      <ModeReadout state={state} />

      <div className="grid gap-4 md:grid-cols-[1fr_1fr]">
        <div className="space-y-3 rounded-md border border-emerald-200 bg-white p-3">
          <p className="text-sm font-semibold text-slate-950">
            Valid mutation tests
          </p>
          <div className="flex flex-wrap gap-3">
            {validScenarios.map((scenario) => (
              <Button
                key={scenario.operation}
                type="button"
                variant={
                  selectedOperation === scenario.operation ? "default" : "outline"
                }
                disabled={pending}
                onClick={() => setSelectedOperation(scenario.operation)}
              >
                {buttonPrefix}
                {scenario.label}
              </Button>
            ))}
          </div>
        </div>

        <div className="space-y-3 rounded-md border border-red-200 bg-red-50 p-3">
          <p className="text-sm font-semibold text-red-800">
            Expected failure test
          </p>
          <div className="flex flex-wrap gap-3">
            {invalidScenarios.map((scenario) => (
              <Button
                key={scenario.operation}
                type="button"
                variant={
                  selectedOperation === scenario.operation
                    ? "destructive"
                    : "outline"
                }
                disabled={pending}
                onClick={() => setSelectedOperation(scenario.operation)}
              >
                {buttonPrefix}
                {scenario.label}
              </Button>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-sm font-medium text-slate-900">
          Exact request payload before execution
        </p>
        <pre className="max-h-72 overflow-auto rounded-md border border-slate-200 bg-slate-950 p-3 text-xs text-slate-50">
          {formatJson(selectedScenario?.payload ?? null)}
        </pre>
      </div>

      <form
        action={formAction}
        className="space-y-3 rounded-md border border-amber-200 bg-amber-50 p-3"
      >
        <input type="hidden" name="operation" value={selectedOperation} />
        {selectedScenario?.tone === "valid" ? (
          <input
            type="hidden"
            name="confirmation"
            value={CONFIRMATION_TOKEN}
          />
        ) : null}
        <div className="space-y-1">
          <p className="text-sm font-semibold text-slate-950">
            Confirmation required
          </p>
          <p className="text-sm text-slate-600">
            Review the payload above before running the selected test. Valid
            tests mutate real stock by the fixed safe quantities only.
          </p>
        </div>
        <Button
          type="submit"
          variant={selectedScenario?.tone === "invalid" ? "destructive" : "default"}
          disabled={pending || !selectedScenario}
        >
          {pending
            ? "Calling test path..."
            : selectedScenario
              ? `${submitLabelPrefix} ${selectedScenario.label}`
              : "Select a test"}
        </Button>
      </form>

      <ResultPanel state={state} pending={pending} />
    </section>
  );
}

export function InventoryRpcTestPanel({
  initialCurrentQuantity,
  initialItemName,
  itemId,
}: InventoryRpcTestPanelProps) {
  const scenarios = useMemo<Scenario[]>(
    () => [
      {
        operation: "stock_in_5",
        label: "stock_in 5",
        tone: "valid",
        payload: {
          p_inventory_item_id: itemId,
          p_movement_type: "stock_in",
          p_quantity: 5,
          p_unit_cost: null,
          p_field_job_id: null,
          p_note: "Temporary dev RPC test: stock_in 5",
        },
      },
      {
        operation: "stock_out_2",
        label: "stock_out 2",
        tone: "valid",
        payload: {
          p_inventory_item_id: itemId,
          p_movement_type: "stock_out",
          p_quantity: 2,
          p_unit_cost: null,
          p_field_job_id: null,
          p_note: "Temporary dev RPC test: stock_out 2",
        },
      },
      {
        operation: "stock_out_999999",
        label: "invalid stock_out 999999",
        tone: "invalid",
        payload: {
          p_inventory_item_id: itemId,
          p_movement_type: "stock_out",
          p_quantity: 999999,
          p_unit_cost: null,
          p_field_job_id: null,
          p_note: "Temporary dev RPC test: invalid stock_out 999999",
        },
      },
    ],
    [itemId]
  );
  const [selectedDirectOperation, setSelectedDirectOperation] = useState(
    scenarios[0]?.operation ?? ""
  );
  const [selectedHelperOperation, setSelectedHelperOperation] = useState(
    scenarios[0]?.operation ?? ""
  );
  const initialState: InventoryRpcTestState = {
    ok: null,
    operation: null,
    response: null,
    error: null,
    currentQuantity: initialCurrentQuantity,
    itemName: initialItemName,
    userId: null,
    testedAt: null,
    rawUseInventoryRpc: null,
    parsedUseInventoryRpc: false,
    executionMode: null,
  };
  const [directState, directFormAction, directPending] = useActionState<
    InventoryRpcTestState,
    FormData
  >(runInventoryRpcTest, initialState);
  const [helperState, helperFormAction, helperPending] = useActionState<
    InventoryRpcTestState,
    FormData
  >(runInventoryHelperTest, initialState);

  const latestState = helperState.testedAt ? helperState : directState;
  const displayedQuantity =
    latestState.currentQuantity ?? initialCurrentQuantity;
  const displayedItemName = latestState.itemName ?? initialItemName;
  const selectedDirectScenario = scenarios.find(
    (scenario) => scenario.operation === selectedDirectOperation
  );
  const selectedHelperScenario = scenarios.find(
    (scenario) => scenario.operation === selectedHelperOperation
  );

  return (
    <div className="space-y-6 rounded-md border border-amber-300 bg-amber-50 p-4">
      <div className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-wide text-amber-800">
          Temporary admin-only test page
        </p>
        <h3 className="text-lg font-semibold text-slate-950">
          public.post_inventory_movement RPC test
        </h3>
        <p className="text-sm text-slate-700">
          This page contains two separate test paths. Direct RPC Test always
          calls the database RPC. Feature Flag Helper Test respects
          USE_INVENTORY_RPC through postStockMovement().
        </p>
        <p className="text-sm font-semibold text-red-700">
          Temporary dev test only. Uses real inventory data.
        </p>
      </div>

      <div className="grid gap-3 rounded-md border border-amber-200 bg-white p-3 text-sm text-slate-700 md:grid-cols-3">
        <div>
          <p className="text-xs font-medium uppercase text-slate-500">Item</p>
          <p className="font-medium text-slate-950">
            {displayedItemName ?? "Unknown item"}
          </p>
        </div>
        <div>
          <p className="text-xs font-medium uppercase text-slate-500">Item ID</p>
          <p className="break-all font-mono text-xs text-slate-950">{itemId}</p>
        </div>
        <div>
          <p className="text-xs font-medium uppercase text-slate-500">
            Current quantity
          </p>
          <p className="text-xl font-semibold text-slate-950">
            {displayedQuantity ?? "Unavailable"}
          </p>
        </div>
      </div>

      <TestSection
        title="Direct RPC Test"
        description="Always calls public.post_inventory_movement directly and bypasses postStockMovement(), so USE_INVENTORY_RPC does not control this section."
        selectedOperation={selectedDirectOperation}
        setSelectedOperation={setSelectedDirectOperation}
        state={directState}
        formAction={directFormAction}
        pending={directPending}
        selectedScenario={selectedDirectScenario}
        scenarios={scenarios}
        submitLabelPrefix="Confirm and run direct"
      />

      <TestSection
        title="Feature Flag Helper Test"
        description="Calls postStockMovement(). With USE_INVENTORY_RPC=false it should run LEGACY_MODE; with USE_INVENTORY_RPC=true it should run RPC_MODE."
        buttonPrefix="helper "
        selectedOperation={selectedHelperOperation}
        setSelectedOperation={setSelectedHelperOperation}
        state={helperState}
        formAction={helperFormAction}
        pending={helperPending}
        selectedScenario={selectedHelperScenario}
        scenarios={scenarios}
        submitLabelPrefix="Confirm and run helper"
      />

      <div className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">
        Reset/correction note: this page does not auto-reset stock. If a valid
        test needs to be corrected, run the opposite fixed test deliberately or
        reconcile the item through the approved admin/database process.
      </div>
    </div>
  );
}
