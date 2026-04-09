import Link from "next/link";
import { formatDate } from "@/lib/utils/format-date";
import { AssetStatusBadge } from "@/components/assets/asset-status-badge";
import { AssetConditionBadge } from "@/components/assets/asset-condition-badge";

type AssetRow = {
  id: string;
  asset_tag: string;
  serial_number: string | null;
  device_type: "pos_terminal" | "printer" | "scanner" | "router" | "other";
  condition: "new" | "good" | "faulty" | "under_repair" | "retired";
  status: "active" | "inactive" | "lost" | "retired";
  purchase_date: string | null;
  customer: {
    company_name: string | null;
  } | null;
  branch: {
    branch_name: string | null;
  } | null;
};

export function AssetTable({ assets }: { assets: AssetRow[] }) {
  if (assets.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-200 bg-white p-10 text-center text-sm text-slate-500">
        No assets found.
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4 sm:hidden">
        {assets.map((asset) => (
          <div
            key={asset.id}
            className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  {asset.asset_tag}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  {asset.serial_number || "No serial number"}
                </p>
              </div>

              <AssetStatusBadge status={asset.status} />
            </div>

            <div className="mt-4 space-y-2 text-sm text-slate-600">
              <p className="capitalize">
                Device: {asset.device_type.replaceAll("_", " ")}
              </p>
              <p>Customer: {asset.customer?.company_name || "-"}</p>
              <p>Branch: {asset.branch?.branch_name || "-"}</p>
              <div>
                Condition: <AssetConditionBadge condition={asset.condition} />
              </div>
              <p>Purchase Date: {formatDate(asset.purchase_date)}</p>
            </div>

            <div className="mt-4">
              <Link
                href={`/assets/${asset.id}`}
                className="text-sm font-medium text-slate-900 underline underline-offset-4"
              >
                View Asset
              </Link>
            </div>
          </div>
        ))}
      </div>

      <div className="hidden overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm sm:block">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">
                  Asset Tag
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">
                  Serial Number
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">
                  Device Type
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">
                  Customer
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">
                  Branch
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">
                  Condition
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">
                  Status
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-slate-500">
                  Action
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {assets.map((asset) => (
                <tr key={asset.id}>
                  <td className="px-4 py-4 text-sm font-medium text-slate-900">
                    {asset.asset_tag}
                  </td>
                  <td className="px-4 py-4 text-sm text-slate-600">
                    {asset.serial_number || "-"}
                  </td>
                  <td className="px-4 py-4 text-sm capitalize text-slate-600">
                    {asset.device_type.replaceAll("_", " ")}
                  </td>
                  <td className="px-4 py-4 text-sm text-slate-600">
                    {asset.customer?.company_name || "-"}
                  </td>
                  <td className="px-4 py-4 text-sm text-slate-600">
                    {asset.branch?.branch_name || "-"}
                  </td>
                  <td className="px-4 py-4">
                    <AssetConditionBadge condition={asset.condition} />
                  </td>
                  <td className="px-4 py-4">
                    <AssetStatusBadge status={asset.status} />
                  </td>
                  <td className="px-4 py-4 text-right">
                    <Link
                      href={`/assets/${asset.id}`}
                      className="text-sm font-medium text-slate-900 underline underline-offset-4"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}