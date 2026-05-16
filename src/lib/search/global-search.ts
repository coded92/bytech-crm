"use server";

import { requireProfile } from "@/lib/auth/require-profile";
import { createClient } from "@/lib/supabase/server";
import { canAccessModule, searchGroups } from "@/lib/search/config";
import type { SearchGroup, SearchModule, SearchResult } from "@/lib/search/types";

const RESULT_LIMIT = 6;

type RawSearchGroup = {
  id: SearchModule;
  label: string;
  search: (
    supabase: Awaited<ReturnType<typeof createClient>>,
    likeValue: string,
    profile: Awaited<ReturnType<typeof requireProfile>>
  ) => Promise<SearchResult[]>;
};

type CustomerSearchRow = {
  id: string;
  customer_code: string | null;
  company_name: string;
  contact_person: string | null;
  status: string;
};

type LeadSearchRow = {
  id: string;
  company_name: string;
  contact_person: string | null;
  phone: string | null;
  status: string;
};

type QuotationSearchRow = {
  id: string;
  quote_number: string;
  company_name: string;
  status: string;
  total: number;
};

type SupportSearchRow = {
  id: string;
  ticket_number: string;
  title: string;
  status: string;
};

type FieldJobSearchRow = {
  id: string;
  job_number: string;
  title: string;
  status: string;
};

type SupplierSearchRow = {
  id: string;
  supplier_code: string;
  company_name: string;
  contact_person: string | null;
  is_active: boolean;
};

type UserSearchRow = {
  id: string;
  full_name: string;
  email: string | null;
  role: string;
  job_title: string | null;
  is_active: boolean;
};

function createLikeValue(query: string) {
  return `%${query.replace(/[%,]/g, " ").trim()}%`;
}

function cleanQuery(query: string) {
  return query.trim().replace(/\s+/g, " ").slice(0, 80);
}

const searchDefinitions: RawSearchGroup[] = [
  {
    id: "customers",
    label: "Customers",
    async search(supabase, likeValue) {
      const { data } = await supabase
        .from("customers")
        .select("id, customer_code, company_name, contact_person, phone, status")
        .or(
          `company_name.ilike.${likeValue},customer_code.ilike.${likeValue},contact_person.ilike.${likeValue},phone.ilike.${likeValue}`
        )
        .limit(RESULT_LIMIT);

      const customers = (data || []) as unknown as CustomerSearchRow[];

      return customers.map((customer) => ({
        id: customer.id,
        title: customer.company_name,
        subtitle: `${customer.customer_code || "No code"} · ${customer.contact_person || "No contact"}`,
        href: `/customers/${customer.id}`,
        badge: customer.status,
      }));
    },
  },
  {
    id: "leads",
    label: "Leads",
    async search(supabase, likeValue) {
      const { data } = await supabase
        .from("leads")
        .select("id, company_name, contact_person, phone, status")
        .or(
          `company_name.ilike.${likeValue},contact_person.ilike.${likeValue},phone.ilike.${likeValue}`
        )
        .limit(RESULT_LIMIT);

      const leads = (data || []) as unknown as LeadSearchRow[];

      return leads.map((lead) => ({
        id: lead.id,
        title: lead.company_name,
        subtitle: `${lead.contact_person || "No contact"} · ${lead.phone || "No phone"}`,
        href: `/leads/${lead.id}`,
        badge: lead.status,
      }));
    },
  },
  {
    id: "quotations",
    label: "Quotations",
    async search(supabase, likeValue) {
      const { data } = await supabase
        .from("quotations")
        .select("id, quote_number, company_name, status, total")
        .or(`quote_number.ilike.${likeValue},company_name.ilike.${likeValue}`)
        .limit(RESULT_LIMIT);

      const quotations = (data || []) as unknown as QuotationSearchRow[];

      return quotations.map((quotation) => ({
        id: quotation.id,
        title: quotation.quote_number,
        subtitle: `${quotation.company_name} · ₦${Number(quotation.total || 0).toLocaleString()}`,
        href: `/quotations/${quotation.id}`,
        badge: quotation.status,
      }));
    },
  },
  {
    id: "payments",
    label: "Invoices",
    async search(supabase, likeValue) {
      const { data } = await supabase
        .from("payment_invoices")
        .select("id, invoice_number, status, amount, customer:customers(company_name)")
        .ilike("invoice_number", likeValue)
        .limit(RESULT_LIMIT);

      return ((data || []) as Array<{
        id: string;
        invoice_number: string;
        status: string;
        amount: number;
        customer: { company_name: string | null } | null;
      }>).map((invoice) => ({
        id: invoice.id,
        title: invoice.invoice_number,
        subtitle: `${invoice.customer?.company_name || "No customer"} · ₦${Number(invoice.amount || 0).toLocaleString()}`,
        href: `/payments/invoices/${invoice.id}`,
        badge: invoice.status,
      }));
    },
  },
  {
    id: "projects",
    label: "Projects",
    async search(supabase, likeValue) {
      const { data } = await supabase
        .from("projects")
        .select("id, project_code, project_name, status, customer:customers(company_name)")
        .or(`project_code.ilike.${likeValue},project_name.ilike.${likeValue}`)
        .limit(RESULT_LIMIT);

      return ((data || []) as Array<{
        id: string;
        project_code: string;
        project_name: string;
        status: string;
        customer: { company_name: string | null } | null;
      }>).map((project) => ({
        id: project.id,
        title: project.project_name,
        subtitle: `${project.project_code} · ${project.customer?.company_name || "No customer"}`,
        href: `/projects/${project.id}`,
        badge: project.status,
      }));
    },
  },
  {
    id: "support",
    label: "Support Tickets",
    async search(supabase, likeValue) {
      const { data } = await supabase
        .from("support_tickets")
        .select("id, ticket_number, title, status")
        .or(`ticket_number.ilike.${likeValue},title.ilike.${likeValue}`)
        .limit(RESULT_LIMIT);

      const tickets = (data || []) as unknown as SupportSearchRow[];

      return tickets.map((ticket) => ({
        id: ticket.id,
        title: ticket.ticket_number,
        subtitle: ticket.title,
        href: `/support/${ticket.id}`,
        badge: ticket.status,
      }));
    },
  },
  {
    id: "field_jobs",
    label: "Field Jobs",
    async search(supabase, likeValue, profile) {
      let query = supabase
        .from("field_jobs")
        .select("id, job_number, title, status, assigned_engineer_id")
        .or(`job_number.ilike.${likeValue},title.ilike.${likeValue}`)
        .limit(RESULT_LIMIT);

      if (profile.role !== "admin") {
        query = query.eq("assigned_engineer_id", profile.id);
      }

      const { data } = await query;

      const jobs = (data || []) as unknown as FieldJobSearchRow[];

      return jobs.map((job) => ({
        id: job.id,
        title: job.job_number,
        subtitle: job.title,
        href: `/field-jobs/${job.id}`,
        badge: job.status,
      }));
    },
  },
  {
    id: "suppliers",
    label: "Suppliers",
    async search(supabase, likeValue) {
      const { data } = await supabase
        .from("suppliers")
        .select("id, supplier_code, company_name, contact_person, phone, is_active")
        .or(
          `supplier_code.ilike.${likeValue},company_name.ilike.${likeValue},contact_person.ilike.${likeValue},phone.ilike.${likeValue}`
        )
        .limit(RESULT_LIMIT);

      const suppliers = (data || []) as unknown as SupplierSearchRow[];

      return suppliers.map((supplier) => ({
        id: supplier.id,
        title: supplier.company_name,
        subtitle: `${supplier.supplier_code} · ${supplier.contact_person || "No contact"}`,
        href: `/suppliers/${supplier.id}`,
        badge: supplier.is_active ? "active" : "inactive",
      }));
    },
  },
  {
    id: "users",
    label: "Users",
    async search(supabase, likeValue) {
      const { data } = await supabase
        .from("profiles")
        .select("id, full_name, email, role, job_title, is_active")
        .or(`full_name.ilike.${likeValue},email.ilike.${likeValue},job_title.ilike.${likeValue}`)
        .limit(RESULT_LIMIT);

      const users = (data || []) as unknown as UserSearchRow[];

      return users.map((user) => ({
        id: user.id,
        title: user.full_name,
        subtitle: `${user.email || "No email"} · ${user.job_title || user.role}`,
        href: `/users/${user.id}`,
        badge: user.is_active ? user.role : "inactive",
      }));
    },
  },
];

export async function globalSearch(query: string): Promise<SearchGroup[]> {
  const profile = await requireProfile();
  const cleanedQuery = cleanQuery(query);

  if (cleanedQuery.length < 2) {
    return searchGroups
      .filter((group) =>
        canAccessModule(group.id, {
          role: profile.role,
          allowedModules: profile.allowed_modules,
        })
      )
      .map((group) => ({ ...group, results: [] }));
  }

  const supabase = await createClient();
  const likeValue = createLikeValue(cleanedQuery);
  const access = {
    role: profile.role,
    allowedModules: profile.allowed_modules,
  };

  const visibleDefinitions = searchDefinitions.filter((definition) =>
    canAccessModule(definition.id, access)
  );

  const settledGroups = await Promise.all(
    visibleDefinitions.map(async (definition) => ({
      id: definition.id,
      label: definition.label,
      results: await definition.search(supabase, likeValue, profile),
    }))
  );

  return settledGroups.filter((group) => group.results.length > 0);
}
