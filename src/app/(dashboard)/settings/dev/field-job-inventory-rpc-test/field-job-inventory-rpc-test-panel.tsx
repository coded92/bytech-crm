"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  runFieldJobInventoryRpcTest,
  type FieldJobInventoryRpcTestState,
} from "./actions";

type FieldJobOption = {
  id: string;
  job_number: string;
  title: string;
};

type FieldJobInventoryRpcTestPanelProps = {
  fieldJobs: FieldJobOption[];
  initialCurrentQuantity: number | null;
  initialItemName: string | null;
  itemId: string;
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

function formatJson(value: unknown) {
  if (value == null) {
    return "null";
  }

  return JSON.stringify(value, null, 2);
}

export function FieldJobInventoryRpcTestPanel({
  fieldJobs,
  initialCurrentQuantity,
  initialItemName,
  itemId,
}: FieldJobInventoryRpcTestPanelProps) {
  const [selectedFieldJobId, setSelectedFieldJobId] = useState(
    fieldJobs[0]?.id ?? ""
  );
  const [state, formAction, pending] = useActionState<
    FieldJobInventoryRpcTestState,
    FormData
  >(runFieldJobInventoryRpcTest, {
    ...initialState,
    currentQuantity: initialCurrentQuantity,
    itemName: initialItemName,
    fieldJobId: selectedFieldJobId || null,
  });

  const displayedQuantity = state.currentQuantity ?? initialCurrentQuantity;
  const displayedItemName = state.itemName ?? initialItemName;

  return (
    <div className="space-y-6 rounded-md border border-amber-300 bg-amber-50 p-4">
      <div className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-wide text-amber-800">
          Temporary admin-only test page
        </p>
        <h3 className="text-lg font-semibold text-slate-950">
          public.issue_field_job_inventory RPC test
        </h3>
        <p className="text-sm text-slate-700">
          Calls the deployed field-job inventory RPC directly with the current
          authenticated Supabase session. This is not a production workflow.
        </p>
        <p className="text-sm font-semibold text-red-700">
          Temporary dev test only. Uses real field-job and inventory data.
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

      <form action={formAction} className="space-y-4 rounded-md border border-slate-200 bg-white p-4">
        <div className="space-y-2">
          <label
            htmlFor="field_job_id"
            className="text-sm font-medium text-slate-900"
          >
            Test field job
          </label>
          <select
            id="field_job_id"
            name="field_job_id"
            value={selectedFieldJobId}
            disabled={pending}
            onChange={(event) => setSelectedFieldJobId(event.target.value)}
            className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
            required
          >
            {fieldJobs.length === 0 ? (
              <option value="">No field jobs found</option>
            ) : null}
            {fieldJobs.map((job) => (
              <option key={job.id} value={job.id}>
                {job.job_number} - {job.title}
              </option>
            ))}
          </select>
        </div>

        <div className="grid gap-4 md:grid-cols-[1fr_1fr]">
          <div className="space-y-3 rounded-md border border-emerald-200 bg-white p-3">
            <p className="text-sm font-semibold text-slate-950">
              Valid issue tests
            </p>
            <div className="flex flex-wrap gap-3">
              <Button
                name="operation"
                value="issue_1"
                type="submit"
                disabled={pending || !selectedFieldJobId}
              >
                issue quantity 1
              </Button>
              <Button
                name="operation"
                value="issue_2"
                type="submit"
                variant="outline"
                disabled={pending || !selectedFieldJobId}
              >
                issue quantity 2
              </Button>
            </div>
          </div>

          <div className="space-y-3 rounded-md border border-red-200 bg-red-50 p-3">
            <p className="text-sm font-semibold text-red-800">
              Expected failure test
            </p>
            <Button
              name="operation"
              value="issue_999999"
              type="submit"
              variant="destructive"
              disabled={pending || !selectedFieldJobId}
            >
              invalid issue quantity 999999
            </Button>
          </div>
        </div>
      </form>

      {pending ? (
        <div className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600">
          Calling issue_field_job_inventory with the authenticated session...
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
            Field job: {state.fieldJobId ?? "none"} | User:{" "}
            {state.userId ?? "unknown"} | Tested: {state.testedAt ?? "not run"}
          </p>
        </div>
      ) : null}

      <div className="space-y-2">
        <p className="text-sm font-medium text-slate-900">RPC response</p>
        <pre className="max-h-96 overflow-auto rounded-md border border-slate-200 bg-slate-950 p-3 text-xs text-slate-50">
          {formatJson(state.response)}
        </pre>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <div className="space-y-2">
          <p className="text-sm font-medium text-slate-900">
            Latest field_job_inventory_usage rows
          </p>
          <pre className="max-h-96 overflow-auto rounded-md border border-slate-200 bg-slate-950 p-3 text-xs text-slate-50">
            {formatJson(state.usageRows)}
          </pre>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium text-slate-900">
            Latest inventory_movements rows
          </p>
          <pre className="max-h-96 overflow-auto rounded-md border border-slate-200 bg-slate-950 p-3 text-xs text-slate-50">
            {formatJson(state.movementRows)}
          </pre>
        </div>
      </div>

      <div className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">
        Correction note: this page does not auto-reset issued stock. If a valid
        issue test needs correction, reverse it through the approved inventory
        process after reviewing the usage and movement rows.
      </div>
    </div>
  );
}

