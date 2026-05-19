import { z } from "zod";

const optionalText = (maxLength: number) =>
  z
    .string()
    .trim()
    .max(maxLength)
    .optional()
    .transform((value) => value || null);

const requiredText = (maxLength: number, message: string) =>
  z.string().trim().min(1, message).max(maxLength);

const dateFormatSchema = z.enum(["MM/DD/YYYY", "DD/MM/YYYY", "YYYY-MM-DD"]);
const hexColorSchema = z
  .string()
  .trim()
  .regex(/^#[0-9A-Fa-f]{6}$/, "Enter a valid hex color");
const dayCountSchema = z.coerce.number().int().min(0).max(3650);
const prefixSchema = z.string().trim().min(1).max(20);
const labelSchema = z.string().trim().min(1).max(40);
const titleSchema = z.string().trim().min(1).max(80);

export const updateCompanyBrandingSchema = z.object({
  company_name: requiredText(160, "Company name is required"),
  brand_name: requiredText(160, "Brand name is required"),
  tagline: optionalText(160),
  email: z.string().trim().email("Enter a valid company email").optional(),
  phone: optionalText(40),
  website: optionalText(200),
  address: optionalText(500),
  primary_brand_color: hexColorSchema,
  secondary_brand_color: hexColorSchema.nullable().optional(),
  show_logo_on_documents: z.boolean(),
});

export const updateInvoiceDocumentSettingsSchema = z.object({
  invoice_number_prefix: prefixSchema,
  invoice_title: titleSchema,
  invoice_default_due_days: dayCountSchema,
  invoice_date_format: dateFormatSchema,
  invoice_show_title: z.boolean(),
  invoice_show_invoice_date: z.boolean(),
  invoice_show_due_date: z.boolean(),
  invoice_show_company_logo: z.boolean(),
  invoice_show_company_address: z.boolean(),
  invoice_show_company_email_phone: z.boolean(),
  invoice_show_customer_address: z.boolean(),
  invoice_show_item_descriptions: z.boolean(),
  invoice_show_item_quantity: z.boolean(),
  invoice_show_item_unit_price: z.boolean(),
  invoice_show_line_total: z.boolean(),
  invoice_show_subtotal: z.boolean(),
  invoice_show_tax: z.boolean(),
  invoice_show_discounts: z.boolean(),
  invoice_show_grand_total: z.boolean(),
  invoice_paid_label: labelSchema,
  invoice_unpaid_label: labelSchema,
  invoice_overdue_label: labelSchema,
});

export const updateQuotationDocumentSettingsSchema = z.object({
  quotation_number_prefix: prefixSchema,
  quotation_title: titleSchema,
  quotation_default_validity_days: dayCountSchema,
  quotation_date_format: dateFormatSchema,
  quotation_show_title: z.boolean(),
  quotation_show_quotation_date: z.boolean(),
  quotation_show_expiry_date: z.boolean(),
  quotation_show_company_logo: z.boolean(),
  quotation_show_company_address: z.boolean(),
  quotation_show_company_email_phone: z.boolean(),
  quotation_show_customer_address: z.boolean(),
  quotation_show_item_descriptions: z.boolean(),
  quotation_show_item_quantity: z.boolean(),
  quotation_show_item_unit_price: z.boolean(),
  quotation_show_line_total: z.boolean(),
  quotation_show_subtotal: z.boolean(),
  quotation_show_tax: z.boolean(),
  quotation_show_discounts: z.boolean(),
  quotation_show_grand_total: z.boolean(),
  quotation_draft_label: labelSchema,
  quotation_sent_label: labelSchema,
  quotation_accepted_label: labelSchema,
  quotation_expired_label: labelSchema,
});

export const updateReceiptDocumentSettingsSchema = z.object({
  receipt_number_prefix: prefixSchema,
  receipt_title: titleSchema,
  receipt_default_validity_days: dayCountSchema,
  receipt_date_format: dateFormatSchema,
  receipt_show_title: z.boolean(),
  receipt_show_receipt_date: z.boolean(),
  receipt_show_payment_date: z.boolean(),
  receipt_show_company_logo: z.boolean(),
  receipt_show_company_address: z.boolean(),
  receipt_show_company_email_phone: z.boolean(),
  receipt_show_customer_address: z.boolean(),
  receipt_show_payment_method: z.boolean(),
  receipt_show_item_descriptions: z.boolean(),
  receipt_show_item_quantity: z.boolean(),
  receipt_show_item_unit_price: z.boolean(),
  receipt_show_subtotal: z.boolean(),
  receipt_show_tax: z.boolean(),
  receipt_show_discounts: z.boolean(),
  receipt_show_grand_total: z.boolean(),
  receipt_paid_label: labelSchema,
  receipt_partial_label: labelSchema,
  receipt_refunded_label: labelSchema,
  receipt_cancelled_label: labelSchema,
});

export const updateFooterTermsDocumentSettingsSchema = z.object({
  default_footer_text: optionalText(1000),
  invoice_footer_text: optionalText(1000),
  quotation_footer_text: optionalText(1000),
  receipt_footer_text: optionalText(1000),
  terms_conditions: optionalText(5000),
  payment_instructions: optionalText(2000),
  show_footer_on_documents: z.boolean(),
  show_terms_conditions: z.boolean(),
  show_signature_block: z.boolean(),
  show_page_numbers: z.boolean(),
});

export const resetDocumentBrandingScopeSchema = z.enum([
  "all",
  "branding",
  "invoice",
  "quotation",
  "receipt",
  "footer_terms",
]);

export type UpdateCompanyBrandingValues = z.infer<
  typeof updateCompanyBrandingSchema
>;
export type UpdateInvoiceDocumentSettingsValues = z.infer<
  typeof updateInvoiceDocumentSettingsSchema
>;
export type UpdateQuotationDocumentSettingsValues = z.infer<
  typeof updateQuotationDocumentSettingsSchema
>;
export type UpdateReceiptDocumentSettingsValues = z.infer<
  typeof updateReceiptDocumentSettingsSchema
>;
export type UpdateFooterTermsDocumentSettingsValues = z.infer<
  typeof updateFooterTermsDocumentSettingsSchema
>;
export type ResetDocumentBrandingScope = z.infer<
  typeof resetDocumentBrandingScopeSchema
>;
