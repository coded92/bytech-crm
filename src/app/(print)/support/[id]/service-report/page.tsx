import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { formatDate, formatDateTime } from "@/lib/utils/format-date";
import { DocumentShell } from "@/components/shared/document-shell";
import { DocumentInfoRow } from "@/components/shared/document-info-row";

type ServiceReportPageProps = {
  params: Promise<{ id: string }>;
};

type SupportTicketRow = {
  id: string;
  ticket_number: string;
  title: string;
  issue_type: string;
  priority: string;
  status: string;
  description: string | null;
  resolution_notes: string | null;
  resolved_at: string | null;
  created_at: string;
  customer: {
    company_name: string | null;
  } | null;
  asset: {
    id: string;
    asset_tag: string | null;
    serial_number: string | null;
    device_type: string | null;
  } | null;
  assigned_profile: {
    full_name: string | null;
  } | null;
};

type RepairHistoryRow = {
  id: string;
  repair_title: string;
  repair_type: string;
  repair_status: string;
  cost: number;
  repair_date: string;
  notes: string | null;
  technician: {
    full_name: string | null;
  } | null;
};

export default async function ServiceReportPage({
  params,
}: ServiceReportPageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: ticketData } = await supabase
    .from("support_tickets")
    .select(`
      id,
      ticket_number,
      title,
      issue_type,
      priority,
      status,
      description,
      resolution_notes,
      resolved_at,
      created_at,
      customer:customers(company_name),
      asset:assets(id, asset_tag, serial_number, device_type),
      assigned_profile:profiles!support_tickets_assigned_to_fkey(full_name)
    `)
    .eq("id", id)
    .maybeSingle();

  if (!ticketData) {
    notFound();
  }

  const ticket = ticketData as SupportTicketRow;

  let repairHistory: RepairHistoryRow[] = [];

  if (ticket.asset?.id) {
    const { data: historyData } = await supabase
      .from("asset_repair_history")
      .select(`
        id,
        repair_title,
        repair_type,
        repair_status,
        cost,
        repair_date,
        notes,
        technician:profiles!asset_repair_history_technician_id_fkey(full_name)
      `)
      .eq("asset_id", ticket.asset.id)
      .order("repair_date", { ascending: false });

    repairHistory = (historyData ?? []) as RepairHistoryRow[];
  }

  return (
    <DocumentShell
      title="Service Report"
      documentNumber={ticket.ticket_number}
    >
      <div className="space-y-8">
        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-xl border border-slate-200 p-5">
            <h3 className="text-sm font-semibold text-slate-900">
              Customer Information
            </h3>
            <div className="mt-4 space-y-3">
              <DocumentInfoRow
                label="Customer"
                value={ticket.customer?.company_name || "-"}
              />
              <DocumentInfoRow label="Ticket Title" value={ticket.title} />
              <DocumentInfoRow
                label="Assigned Staff"
                value={ticket.assigned_profile?.full_name || "-"}
              />
              <DocumentInfoRow
                label="Created At"
                value={formatDateTime(ticket.created_at)}
              />
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 p-5">
            <h3 className="text-sm font-semibold text-slate-900">
              Asset Information
            </h3>
            <div className="mt-4 space-y-3">
              <DocumentInfoRow
                label="Asset Tag"
                value={ticket.asset?.asset_tag || "-"}
              />
              <DocumentInfoRow
                label="Serial Number"
                value={ticket.asset?.serial_number || "-"}
              />
              <DocumentInfoRow
                label="Device Type"
                value={ticket.asset?.device_type || "-"}
              />
              <DocumentInfoRow label="Status" value={ticket.status} />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 p-5">
          <h3 className="text-sm font-semibold text-slate-900">
            Issue Description
          </h3>
          <p className="mt-3 whitespace-pre-wrap text-sm text-slate-700">
            {ticket.description || "-"}
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 p-5">
          <h3 className="text-sm font-semibold text-slate-900">
            Resolution Notes
          </h3>
          <p className="mt-3 whitespace-pre-wrap text-sm text-slate-700">
            {ticket.resolution_notes || "-"}
          </p>
          <div className="mt-4">
            <DocumentInfoRow
              label="Resolved At"
              value={formatDateTime(ticket.resolved_at)}
            />
          </div>
        </div>

        <div>
          <h3 className="mb-4 text-sm font-semibold text-slate-900">
            Repair History
          </h3>

          {repairHistory.length === 0 ? (
            <div className="rounded-xl border border-slate-200 p-5 text-sm text-slate-500">
              No repair history found.
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-slate-200">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">
                      Title
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">
                      Type
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">
                      Date
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">
                      Technician
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {repairHistory.map((item) => (
                    <tr key={item.id}>
                      <td className="px-4 py-4 text-sm text-slate-900">
                        {item.repair_title}
                      </td>
                      <td className="px-4 py-4 text-sm capitalize text-slate-600">
                        {item.repair_type.replaceAll("_", " ")}
                      </td>
                      <td className="px-4 py-4 text-sm capitalize text-slate-600">
                        {item.repair_status.replaceAll("_", " ")}
                      </td>
                      <td className="px-4 py-4 text-sm text-slate-600">
                        {formatDate(item.repair_date)}
                      </td>
                      <td className="px-4 py-4 text-sm text-slate-600">
                        {item.technician?.full_name || "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </DocumentShell>
  );
}