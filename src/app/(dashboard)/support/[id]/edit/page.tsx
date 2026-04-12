import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SupportEditForm } from "@/components/support/support-edit-form";

type EditSupportPageProps = {
  params: Promise<{ id: string }>;
};

type StaffOption = {
  id: string;
  full_name: string;
};

type CustomerOption = {
  id: string;
  company_name: string;
};

type AssetOption = {
  id: string;
  asset_tag: string;
};

type TicketRow = {
  id: string;
  customer_id: string;
  asset_id: string | null;
  title: string;
  issue_type: "hardware" | "software" | "network" | "training" | "billing" | "other";
  priority: "low" | "medium" | "high" | "urgent";
  status: "open" | "in_progress" | "resolved" | "closed";
  description: string | null;
  assigned_to: string | null;
  resolution_notes: string | null;
};

export default async function EditSupportPage({
  params,
}: EditSupportPageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: ticket }, { data: staffData }, { data: customersData }, { data: assetsData }] =
    await Promise.all([
      supabase
        .from("support_tickets")
        .select(
          "id, customer_id, asset_id, title, issue_type, priority, status, description, assigned_to, resolution_notes"
        )
        .eq("id", id)
        .single(),
      supabase
        .from("profiles")
        .select("id, full_name")
        .eq("is_active", true)
        .order("full_name", { ascending: true }),
      supabase
        .from("customers")
        .select("id, company_name")
        .order("company_name", { ascending: true }),
      supabase
        .from("assets")
        .select("id, asset_tag")
        .order("asset_tag", { ascending: true }),
    ]);

  if (!ticket) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">
          Edit Support Ticket
        </h2>
        <p className="text-slate-600">
          Update issue details, assignment, and linked asset.
        </p>
      </div>

      <SupportEditForm
        ticket={ticket as TicketRow}
        staff={(staffData ?? []) as StaffOption[]}
        customers={(customersData ?? []) as CustomerOption[]}
        assets={(assetsData ?? []) as AssetOption[]}
      />
    </div>
  );
}