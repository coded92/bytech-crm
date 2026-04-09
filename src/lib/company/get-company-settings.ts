import { createClient } from "@/lib/supabase/server";

export type CompanySettings = {
  company_name: string;
  brand_name: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  logo_url: string | null;
  currency_symbol: string;
  document_footer: string | null;
};

export async function getCompanySettings(): Promise<CompanySettings> {
  const supabase = await createClient();

  const { data } = await (supabase as any)
    .from("company_settings")
    .select(`
      company_name,
      brand_name,
      email,
      phone,
      website,
      address,
      city,
      state,
      country,
      logo_url,
      currency_symbol,
      document_footer
    `)
    .limit(1)
    .maybeSingle();

  return (
    (data as CompanySettings | null) ?? {
      company_name: "BYTECH Digital Innovation",
      brand_name: "BYTECH CRM",
      email: null,
      phone: null,
      website: "bytechng.com",
      address: null,
      city: null,
      state: null,
      country: "Nigeria",
      logo_url: null,
      currency_symbol: "₦",
      document_footer:
        "Thank you for doing business with BYTECH Digital Innovation.",
    }
  );
}