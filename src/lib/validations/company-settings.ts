import { z } from "zod";

export const updateCompanySettingsSchema = z.object({
  company_name: z.string().min(2, "Company name is required"),
  brand_name: z.string().optional(),
  email: z.string().optional(),
  phone: z.string().optional(),
  website: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  logo_url: z.string().optional(),
  currency_symbol: z.string().min(1, "Currency symbol is required"),
  document_footer: z.string().optional(),
});

export const updateOrganizationInfoSchema = z.object({
  company_name: z.string().trim().min(2, "Organization name is required"),
  email: z.string().trim().email("Enter a valid organization email").optional(),
  phone: z.string().trim().max(40).optional(),
  website: z.string().trim().max(200).optional(),
  address: z.string().trim().max(500).optional(),
});
