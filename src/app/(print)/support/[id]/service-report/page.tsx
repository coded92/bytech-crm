import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { formatCurrency } from "@/lib/utils/format-currency";
import { formatDate, formatDateTime } from "@/lib/utils/format-date";
import { DocumentShell } from "@/components/shared/document-shell";
import { DocumentInfoRow } from "@/components/shared/document-info-row";
import {
  DocumentSection,
  DocumentSignatureBlock,
  DocumentStatusStamp,
  DocumentTable,
  DocumentTotals,
} from "@/components/shared/document-primitives";

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

  const totalRepairCost = repairHistory.reduce(
    (sum, item) => sum + Number(item.cost || 0),
    0
  );
  const statusLabel = ticket.status.replaceAll("_", " ");
  const issueTypeLabel = ticket.issue_type.replaceAll("_", " ");

  return (
    <DocumentShell
      title="Service Report"
      documentNumber={ticket.ticket_number}
    >
      <div className="space-y-8">
        <section className="document-avoid-break grid gap-8 md:grid-cols-[1fr_0.9fr] print:grid-cols-[1fr_0.9fr]">
          <div className="border-l-4 border-slate-950 pl-5">
            <p className="text-xs font-semibold uppercase text-slate-500">
              Support Resolution Report
            </p>
            <p className="mt-2 text-3xl font-semibold text-slate-950">
              {ticket.title}
            </p>
            <p className="mt-2 text-sm text-slate-600">
              {ticket.customer?.company_name || "Customer"} | {ticket.ticket_number}
            </p>
          </div>

          <div className="flex flex-col items-start gap-3 md:items-end print:items-end">
            <DocumentStatusStamp
              status={statusLabel}
              tone={getSupportStatusTone(ticket.status)}
            />
            <p className="text-right text-sm capitalize text-slate-600">
              {ticket.priority} priority | {issueTypeLabel}
            </p>
          </div>
        </section>

        <section className="document-avoid-break grid gap-6 md:grid-cols-2 print:grid-cols-2">
          <div className="border border-slate-200 p-5">
            <h3 className="text-sm font-semibold uppercase text-slate-950">
              Customer / Ticket
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
                label="Issue Type"
                value={issueTypeLabel}
              />
            </div>
          </div>

          <div className="border border-slate-200 p-5">
            <h3 className="text-sm font-semibold uppercase text-slate-950">
              Asset / Device
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
            </div>
          </div>
        </section>

        <DocumentSection title="Ticket Metadata">
          <div className="border border-slate-200 p-5">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 print:grid-cols-4">
              <DocumentInfoRow label="Ticket No." value={ticket.ticket_number} />
              <DocumentInfoRow label="Status" value={statusLabel} />
              <DocumentInfoRow label="Priority" value={ticket.priority} />
              <DocumentInfoRow label="Issue Type" value={issueTypeLabel} />
              <DocumentInfoRow
                label="Created At"
                value={formatDateTime(ticket.created_at)}
              />
              <DocumentInfoRow
                label="Resolved At"
                value={formatDateTime(ticket.resolved_at)}
              />
              <DocumentInfoRow
                label="Assigned Staff"
                value={ticket.assigned_profile?.full_name || "-"}
              />
              <DocumentInfoRow
                label="Repair Records"
                value={repairHistory.length}
              />
            </div>
          </div>
        </DocumentSection>

        <DocumentSection title="Problem Description">
          <p className="whitespace-pre-wrap text-sm leading-6 text-slate-700">
            {ticket.description || "-"}
          </p>
        </DocumentSection>

        <DocumentSection title="Resolution Notes">
          <p className="whitespace-pre-wrap text-sm leading-6 text-slate-700">
            {ticket.resolution_notes || "-"}
          </p>
        </DocumentSection>

        <DocumentSection title="Repair History">
          {repairHistory.length === 0 ? (
            <div className="border border-slate-200 p-5 text-sm text-slate-500">
              No repair history found.
            </div>
          ) : (
            <DocumentTable>
              <thead>
                <tr className="bg-slate-950 text-white">
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase">
                    Repair
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase">
                    Type
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase">
                    Date
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase">
                    Technician
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase">
                    Cost
                  </th>
                </tr>
              </thead>

              <tbody>
                {repairHistory.map((item) => (
                  <tr key={item.id} className="border-t border-slate-200">
                    <td className="px-4 py-4 text-sm font-semibold text-slate-950">
                      {item.repair_title}
                      {item.notes ? (
                        <p className="mt-1 font-normal leading-6 text-slate-600">
                          {item.notes}
                        </p>
                      ) : null}
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
                    <td className="px-4 py-4 text-right text-sm font-semibold text-slate-950">
                      {formatCurrency(item.cost)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </DocumentTable>
          )}
        </DocumentSection>

        <DocumentTotals
          rows={[
            {
              label: "Total Repair Cost",
              value: formatCurrency(totalRepairCost),
              strong: true,
            },
          ]}
        />

        <DocumentSignatureBlock
          leftLabel="Company / technician sign-off"
          rightLabel="Customer acknowledgment"
        />
      </div>
    </DocumentShell>
  );
}

function getSupportStatusTone(status: string) {
  if (status === "resolved" || status === "closed") return "success";
  if (status === "in_progress") return "warning";
  return "neutral";
}
