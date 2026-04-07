import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { formatCurrency } from "@/lib/utils/format-currency";
import { formatDateTime } from "@/lib/utils/format-date";
import { LeadStatusBadge } from "@/components/leads/lead-status-badge";
import { LeadNotes } from "@/components/leads/lead-notes";
import { LeadStatusForm } from "@/components/leads/lead-status-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type LeadDetailsPageProps = {
  params: Promise<{
    id: string;
  }>;
};

type LeadRow = {
  id: string;
  company_name: string;
  contact_person: string;
  phone: string | null;
  email: string | null;
  business_type: string | null;
  industry: string | null;
  city: string | null;
  state: string | null;
  estimated_value: number | null;
  interested_plan: string | null;
  next_follow_up_at: string | null;
  last_contacted_at: string | null;
  address: string | null;
  status:
    | "new"
    | "contacted"
    | "interested"
    | "follow_up"
    | "closed_won"
    | "closed_lost";
  lost_reason: string | null;
  converted_customer_id: string | null;
  converted_at: string | null;
  created_at: string;
  updated_at: string;
  source?: {
    name: string | null;
  } | null;
  assigned_profile?: {
    full_name: string | null;
  } | null;
  created_by_profile?: {
    full_name: string | null;
  } | null;
};

type LeadNoteRow = {
  id: string;
  note: string;
  note_type: string | null;
  follow_up_date: string | null;
  created_at: string;
  created_by_profile?: {
    full_name: string | null;
  } | null;
};

type LeadActivityRow = {
  id: string;
  activity_type: string;
  created_at: string;
  old_value?: unknown;
  new_value?: unknown;
  actor_profile?: {
    full_name: string | null;
  } | null;
};

export default async function LeadDetailsPage({
  params,
}: LeadDetailsPageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: leadData }, { data: notesData }, { data: activitiesData }] =
    await Promise.all([
      supabase
        .from("leads")
        .select(`
          *,
          source:lead_sources(name),
          assigned_profile:profiles!leads_assigned_to_fkey(full_name),
          created_by_profile:profiles!leads_created_by_fkey(full_name)
        `)
        .eq("id", id)
        .single(),
      supabase
        .from("lead_notes")
        .select(`
          id,
          note,
          note_type,
          follow_up_date,
          created_at,
          created_by_profile:profiles!lead_notes_created_by_fkey(full_name)
        `)
        .eq("lead_id", id)
        .order("created_at", { ascending: false }),
      supabase
        .from("lead_activities")
        .select(`
          id,
          activity_type,
          created_at,
          old_value,
          new_value,
          actor_profile:profiles!lead_activities_actor_id_fkey(full_name)
        `)
        .eq("lead_id", id)
        .order("created_at", { ascending: false }),
    ]);

  const lead = leadData as LeadRow | null;
  const notes = (notesData ?? []) as LeadNoteRow[];
  const activities = (activitiesData ?? []) as LeadActivityRow[];

  if (!lead) {
    notFound();
  }

  const canConvert =
    !lead.converted_customer_id && lead.status !== "closed_lost";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            {lead.company_name}
          </h2>
          <p className="text-slate-600">{lead.contact_person}</p>
        </div>

        <div className="flex items-center gap-3">
          <LeadStatusBadge status={lead.status} />

          <Button asChild variant="outline">
            <Link href={`/quotations/new?leadId=${lead.id}`}>
              Create Quotation
            </Link>
          </Button>

          {lead.converted_customer_id ? (
            <Button asChild variant="outline">
              <Link href={`/customers/${lead.converted_customer_id}`}>
                View Customer
              </Link>
            </Button>
          ) : canConvert ? (
            <Button asChild>
              <Link href={`/leads/${lead.id}/convert`}>
                Convert to Customer
              </Link>
            </Button>
          ) : null}
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Lead Information</CardTitle>
            </CardHeader>

            <CardContent className="grid gap-4 md:grid-cols-2">
              <InfoItem label="Company" value={lead.company_name} />
              <InfoItem label="Contact Person" value={lead.contact_person} />
              <InfoItem label="Phone" value={lead.phone} />
              <InfoItem label="Email" value={lead.email} />
              <InfoItem label="Business Type" value={lead.business_type} />
              <InfoItem label="Industry" value={lead.industry} />
              <InfoItem label="City" value={lead.city} />
              <InfoItem label="State" value={lead.state} />
              <InfoItem
                label="Estimated Value"
                value={formatCurrency(lead.estimated_value ?? 0)}
              />
              <InfoItem label="Interested Plan" value={lead.interested_plan} />
              <InfoItem label="Lead Source" value={lead.source?.name ?? "-"} />
              <InfoItem
                label="Assigned To"
                value={lead.assigned_profile?.full_name ?? "-"}
              />
              <InfoItem
                label="Created By"
                value={lead.created_by_profile?.full_name ?? "-"}
              />
              <InfoItem
                label="Next Follow-up"
                value={formatDateTime(lead.next_follow_up_at)}
              />
              <InfoItem
                label="Last Contacted"
                value={formatDateTime(lead.last_contacted_at)}
              />
              <InfoItem label="Address" value={lead.address} />
            </CardContent>
          </Card>

          <LeadNotes leadId={lead.id} notes={notes as any} />

          <Card>
            <CardHeader>
              <CardTitle>Activity History</CardTitle>
            </CardHeader>

            <CardContent className="space-y-4">
              {activities.length === 0 ? (
                <div className="text-sm text-slate-500">No activity yet.</div>
              ) : (
                activities.map((activity) => (
                  <div
                    key={activity.id}
                    className="rounded-xl border border-slate-200 p-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="text-sm font-medium capitalize text-slate-900">
                        {activity.activity_type.replaceAll("_", " ")}
                      </div>
                      <div className="text-xs text-slate-500">
                        {formatDateTime(activity.created_at)}
                      </div>
                    </div>

                    <div className="mt-2 text-xs text-slate-500">
                      By: {activity.actor_profile?.full_name || "Unknown user"}
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <LeadStatusForm
            leadId={lead.id}
            currentStatus={lead.status}
            currentLostReason={lead.lost_reason}
            currentFollowUp={lead.next_follow_up_at}
          />

          <Card>
            <CardHeader>
              <CardTitle>Quick Summary</CardTitle>
            </CardHeader>

            <CardContent className="space-y-3 text-sm">
              <SummaryItem
                label="Created"
                value={formatDateTime(lead.created_at)}
              />
              <SummaryItem
                label="Updated"
                value={formatDateTime(lead.updated_at)}
              />
              <SummaryItem
                label="Converted"
                value={formatDateTime(lead.converted_at)}
              />
              <SummaryItem label="Lost Reason" value={lead.lost_reason || "-"} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function InfoItem({
  label,
  value,
}: {
  label: string;
  value?: string | number | null;
}) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className="mt-1 text-sm text-slate-900">{value ?? "-"}</p>
    </div>
  );
}

function SummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-slate-500">{label}</span>
      <span className="text-right text-slate-900">{value}</span>
    </div>
  );
}