import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth/require-profile";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type SearchPageProps = {
  searchParams: Promise<{
    q?: string;
  }>;
};

type LeadRow = {
  id: string;
  company_name: string;
  contact_person: string | null;
  status: string;
};

type CustomerRow = {
  id: string;
  company_name: string;
  customer_code: string;
  contact_person: string | null;
};

type InvoiceRow = {
  id: string;
  invoice_number: string;
  status: string;
  customer: {
    company_name: string | null;
  } | null;
};

type SupportRow = {
  id: string;
  ticket_number: string;
  title: string;
  status: string;
};

type AssetRow = {
  id: string;
  asset_tag: string;
  serial_number: string | null;
  device_type: string;
};

export default async function SearchPage({ searchParams }: SearchPageProps) {
  await requireProfile();
  const { q } = await searchParams;
  const supabase = await createClient();

  const query = q?.trim() || "";

  if (!query) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            Global Search
          </h2>
          <p className="text-slate-600">
            Search across leads, customers, invoices, support, and assets.
          </p>
        </div>

        <div className="rounded-xl border border-dashed border-slate-200 bg-white p-10 text-center text-sm text-slate-500">
          Enter a search term in the top search bar.
        </div>
      </div>
    );
  }

  const likeValue = `%${query}%`;

  const [
    leadsResult,
    customersResult,
    invoicesResult,
    supportResult,
    assetsResult,
  ] = await Promise.all([
    supabase
      .from("leads")
      .select("id, company_name, contact_person, status")
      .or(`company_name.ilike.${likeValue},contact_person.ilike.${likeValue}`)
      .limit(10),

    supabase
      .from("customers")
      .select("id, company_name, customer_code, contact_person")
      .or(
        `company_name.ilike.${likeValue},customer_code.ilike.${likeValue},contact_person.ilike.${likeValue}`
      )
      .limit(10),

    supabase
      .from("payment_invoices")
      .select(`
        id,
        invoice_number,
        status,
        customer:customers(company_name)
      `)
      .ilike("invoice_number", likeValue)
      .limit(10),

    supabase
      .from("support_tickets")
      .select("id, ticket_number, title, status")
      .or(`ticket_number.ilike.${likeValue},title.ilike.${likeValue}`)
      .limit(10),

    supabase
      .from("assets")
      .select("id, asset_tag, serial_number, device_type")
      .or(`asset_tag.ilike.${likeValue},serial_number.ilike.${likeValue}`)
      .limit(10),
  ]);

  const leads = (leadsResult.data ?? []) as LeadRow[];
  const customers = (customersResult.data ?? []) as CustomerRow[];
  const invoices = (invoicesResult.data ?? []) as InvoiceRow[];
  const supportTickets = (supportResult.data ?? []) as SupportRow[];
  const assets = (assetsResult.data ?? []) as AssetRow[];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">
          Search Results
        </h2>
        <p className="text-slate-600">
          Results for: <span className="font-medium text-slate-900">{query}</span>
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <SearchSection title="Leads">
          {leads.length === 0 ? (
            <EmptyState />
          ) : (
            leads.map((lead) => (
              <SearchLink
                key={lead.id}
                href={`/leads/${lead.id}`}
                title={lead.company_name}
                subtitle={`${lead.contact_person || "-"} · ${lead.status}`}
              />
            ))
          )}
        </SearchSection>

        <SearchSection title="Customers">
          {customers.length === 0 ? (
            <EmptyState />
          ) : (
            customers.map((customer) => (
              <SearchLink
                key={customer.id}
                href={`/customers/${customer.id}`}
                title={customer.company_name}
                subtitle={`${customer.customer_code} · ${customer.contact_person || "-"}`}
              />
            ))
          )}
        </SearchSection>

        <SearchSection title="Invoices">
          {invoices.length === 0 ? (
            <EmptyState />
          ) : (
            invoices.map((invoice) => (
              <SearchLink
                key={invoice.id}
                href={`/payments/invoices/${invoice.id}`}
                title={invoice.invoice_number}
                subtitle={`${invoice.customer?.company_name || "-"} · ${invoice.status}`}
              />
            ))
          )}
        </SearchSection>

        <SearchSection title="Support Tickets">
          {supportTickets.length === 0 ? (
            <EmptyState />
          ) : (
            supportTickets.map((ticket) => (
              <SearchLink
                key={ticket.id}
                href={`/support/${ticket.id}`}
                title={ticket.ticket_number}
                subtitle={`${ticket.title} · ${ticket.status}`}
              />
            ))
          )}
        </SearchSection>

        <SearchSection title="Assets">
          {assets.length === 0 ? (
            <EmptyState />
          ) : (
            assets.map((asset) => (
              <SearchLink
                key={asset.id}
                href={`/assets/${asset.id}`}
                title={asset.asset_tag}
                subtitle={`${asset.serial_number || "-"} · ${asset.device_type}`}
              />
            ))
          )}
        </SearchSection>
      </div>
    </div>
  );
}

function SearchSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">{children}</CardContent>
    </Card>
  );
}

function SearchLink({
  href,
  title,
  subtitle,
}: {
  href: string;
  title: string;
  subtitle: string;
}) {
  return (
    <Link
      href={href}
      className="block rounded-xl border border-slate-200 p-4 transition hover:bg-slate-50"
    >
      <p className="font-medium text-slate-900">{title}</p>
      <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
    </Link>
  );
}

function EmptyState() {
  return <p className="text-sm text-slate-500">No results found.</p>;
}