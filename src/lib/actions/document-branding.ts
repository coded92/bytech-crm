"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/require-admin";
import { getCompanySettings } from "@/lib/company/get-company-settings";
import { logSecurityEvent } from "@/lib/security/events";
import { createClient } from "@/lib/supabase/server";
import {
  resetDocumentBrandingScopeSchema,
  updateCompanyBrandingSchema,
  updateFooterTermsDocumentSettingsSchema,
  updateInvoiceDocumentSettingsSchema,
  updateQuotationDocumentSettingsSchema,
  updateReceiptDocumentSettingsSchema,
  type ResetDocumentBrandingScope,
} from "@/lib/validations/document-branding";
import type {
  DocumentBrandingSettings,
  DocumentBrandingSettingsInsert,
} from "@/types/database";

type ActionResponse = { success: true } | { error: string };

type CompanySettingsRecord = {
  id: string;
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

type DocumentBrandingSettingsPayload = DocumentBrandingSettingsInsert & {
  id: "default";
};

const defaultDocumentBrandingSettings: DocumentBrandingSettingsPayload = {
  id: "default",
  tagline: "Innovate. Simplify. Grow.",
  primary_brand_color: "#6B46C1",
  secondary_brand_color: "#E9D5FF",
  show_logo_on_documents: true,
  invoice_number_prefix: "INV-",
  invoice_title: "INVOICE",
  invoice_default_due_days: 30,
  invoice_date_format: "MM/DD/YYYY",
  invoice_show_title: true,
  invoice_show_invoice_date: true,
  invoice_show_due_date: true,
  invoice_show_company_logo: true,
  invoice_show_company_address: true,
  invoice_show_company_email_phone: true,
  invoice_show_customer_address: true,
  invoice_show_item_descriptions: true,
  invoice_show_item_quantity: true,
  invoice_show_item_unit_price: true,
  invoice_show_line_total: true,
  invoice_show_subtotal: true,
  invoice_show_tax: true,
  invoice_show_discounts: true,
  invoice_show_grand_total: true,
  invoice_paid_label: "PAID",
  invoice_unpaid_label: "UNPAID",
  invoice_overdue_label: "OVERDUE",
  quotation_number_prefix: "QTN-",
  quotation_title: "QUOTATION",
  quotation_default_validity_days: 30,
  quotation_date_format: "MM/DD/YYYY",
  quotation_show_title: true,
  quotation_show_quotation_date: true,
  quotation_show_expiry_date: true,
  quotation_show_company_logo: true,
  quotation_show_company_address: true,
  quotation_show_company_email_phone: true,
  quotation_show_customer_address: true,
  quotation_show_item_descriptions: true,
  quotation_show_item_quantity: true,
  quotation_show_item_unit_price: true,
  quotation_show_line_total: true,
  quotation_show_subtotal: true,
  quotation_show_tax: true,
  quotation_show_discounts: true,
  quotation_show_grand_total: true,
  quotation_draft_label: "DRAFT",
  quotation_sent_label: "SENT",
  quotation_accepted_label: "ACCEPTED",
  quotation_expired_label: "EXPIRED",
  receipt_number_prefix: "RCPT-",
  receipt_title: "RECEIPT",
  receipt_default_validity_days: 30,
  receipt_date_format: "MM/DD/YYYY",
  receipt_show_title: true,
  receipt_show_receipt_date: true,
  receipt_show_payment_date: true,
  receipt_show_company_logo: true,
  receipt_show_company_address: true,
  receipt_show_company_email_phone: true,
  receipt_show_customer_address: true,
  receipt_show_payment_method: true,
  receipt_show_item_descriptions: true,
  receipt_show_item_quantity: true,
  receipt_show_item_unit_price: true,
  receipt_show_subtotal: true,
  receipt_show_tax: true,
  receipt_show_discounts: true,
  receipt_show_grand_total: true,
  receipt_paid_label: "PAID",
  receipt_partial_label: "PARTIAL",
  receipt_refunded_label: "REFUNDED",
  receipt_cancelled_label: "CANCELLED",
  default_footer_text: "Thank you for your business!",
  invoice_footer_text: null,
  quotation_footer_text: null,
  receipt_footer_text: null,
  terms_conditions: null,
  payment_instructions: null,
  show_footer_on_documents: true,
  show_terms_conditions: true,
  show_signature_block: true,
  show_page_numbers: true,
};

const resetDefaultsByScope: Record<
  ResetDocumentBrandingScope,
  Partial<DocumentBrandingSettingsPayload>
> = {
  all: defaultDocumentBrandingSettings,
  branding: {
    tagline: defaultDocumentBrandingSettings.tagline,
    primary_brand_color: defaultDocumentBrandingSettings.primary_brand_color,
    secondary_brand_color: defaultDocumentBrandingSettings.secondary_brand_color,
    show_logo_on_documents:
      defaultDocumentBrandingSettings.show_logo_on_documents,
  },
  invoice: {
    invoice_number_prefix:
      defaultDocumentBrandingSettings.invoice_number_prefix,
    invoice_title: defaultDocumentBrandingSettings.invoice_title,
    invoice_default_due_days:
      defaultDocumentBrandingSettings.invoice_default_due_days,
    invoice_date_format: defaultDocumentBrandingSettings.invoice_date_format,
    invoice_show_title: defaultDocumentBrandingSettings.invoice_show_title,
    invoice_show_invoice_date:
      defaultDocumentBrandingSettings.invoice_show_invoice_date,
    invoice_show_due_date:
      defaultDocumentBrandingSettings.invoice_show_due_date,
    invoice_show_company_logo:
      defaultDocumentBrandingSettings.invoice_show_company_logo,
    invoice_show_company_address:
      defaultDocumentBrandingSettings.invoice_show_company_address,
    invoice_show_company_email_phone:
      defaultDocumentBrandingSettings.invoice_show_company_email_phone,
    invoice_show_customer_address:
      defaultDocumentBrandingSettings.invoice_show_customer_address,
    invoice_show_item_descriptions:
      defaultDocumentBrandingSettings.invoice_show_item_descriptions,
    invoice_show_item_quantity:
      defaultDocumentBrandingSettings.invoice_show_item_quantity,
    invoice_show_item_unit_price:
      defaultDocumentBrandingSettings.invoice_show_item_unit_price,
    invoice_show_line_total:
      defaultDocumentBrandingSettings.invoice_show_line_total,
    invoice_show_subtotal: defaultDocumentBrandingSettings.invoice_show_subtotal,
    invoice_show_tax: defaultDocumentBrandingSettings.invoice_show_tax,
    invoice_show_discounts:
      defaultDocumentBrandingSettings.invoice_show_discounts,
    invoice_show_grand_total:
      defaultDocumentBrandingSettings.invoice_show_grand_total,
    invoice_paid_label: defaultDocumentBrandingSettings.invoice_paid_label,
    invoice_unpaid_label: defaultDocumentBrandingSettings.invoice_unpaid_label,
    invoice_overdue_label: defaultDocumentBrandingSettings.invoice_overdue_label,
  },
  quotation: {
    quotation_number_prefix:
      defaultDocumentBrandingSettings.quotation_number_prefix,
    quotation_title: defaultDocumentBrandingSettings.quotation_title,
    quotation_default_validity_days:
      defaultDocumentBrandingSettings.quotation_default_validity_days,
    quotation_date_format:
      defaultDocumentBrandingSettings.quotation_date_format,
    quotation_show_title:
      defaultDocumentBrandingSettings.quotation_show_title,
    quotation_show_quotation_date:
      defaultDocumentBrandingSettings.quotation_show_quotation_date,
    quotation_show_expiry_date:
      defaultDocumentBrandingSettings.quotation_show_expiry_date,
    quotation_show_company_logo:
      defaultDocumentBrandingSettings.quotation_show_company_logo,
    quotation_show_company_address:
      defaultDocumentBrandingSettings.quotation_show_company_address,
    quotation_show_company_email_phone:
      defaultDocumentBrandingSettings.quotation_show_company_email_phone,
    quotation_show_customer_address:
      defaultDocumentBrandingSettings.quotation_show_customer_address,
    quotation_show_item_descriptions:
      defaultDocumentBrandingSettings.quotation_show_item_descriptions,
    quotation_show_item_quantity:
      defaultDocumentBrandingSettings.quotation_show_item_quantity,
    quotation_show_item_unit_price:
      defaultDocumentBrandingSettings.quotation_show_item_unit_price,
    quotation_show_line_total:
      defaultDocumentBrandingSettings.quotation_show_line_total,
    quotation_show_subtotal:
      defaultDocumentBrandingSettings.quotation_show_subtotal,
    quotation_show_tax: defaultDocumentBrandingSettings.quotation_show_tax,
    quotation_show_discounts:
      defaultDocumentBrandingSettings.quotation_show_discounts,
    quotation_show_grand_total:
      defaultDocumentBrandingSettings.quotation_show_grand_total,
    quotation_draft_label:
      defaultDocumentBrandingSettings.quotation_draft_label,
    quotation_sent_label: defaultDocumentBrandingSettings.quotation_sent_label,
    quotation_accepted_label:
      defaultDocumentBrandingSettings.quotation_accepted_label,
    quotation_expired_label:
      defaultDocumentBrandingSettings.quotation_expired_label,
  },
  receipt: {
    receipt_number_prefix:
      defaultDocumentBrandingSettings.receipt_number_prefix,
    receipt_title: defaultDocumentBrandingSettings.receipt_title,
    receipt_default_validity_days:
      defaultDocumentBrandingSettings.receipt_default_validity_days,
    receipt_date_format: defaultDocumentBrandingSettings.receipt_date_format,
    receipt_show_title: defaultDocumentBrandingSettings.receipt_show_title,
    receipt_show_receipt_date:
      defaultDocumentBrandingSettings.receipt_show_receipt_date,
    receipt_show_payment_date:
      defaultDocumentBrandingSettings.receipt_show_payment_date,
    receipt_show_company_logo:
      defaultDocumentBrandingSettings.receipt_show_company_logo,
    receipt_show_company_address:
      defaultDocumentBrandingSettings.receipt_show_company_address,
    receipt_show_company_email_phone:
      defaultDocumentBrandingSettings.receipt_show_company_email_phone,
    receipt_show_customer_address:
      defaultDocumentBrandingSettings.receipt_show_customer_address,
    receipt_show_payment_method:
      defaultDocumentBrandingSettings.receipt_show_payment_method,
    receipt_show_item_descriptions:
      defaultDocumentBrandingSettings.receipt_show_item_descriptions,
    receipt_show_item_quantity:
      defaultDocumentBrandingSettings.receipt_show_item_quantity,
    receipt_show_item_unit_price:
      defaultDocumentBrandingSettings.receipt_show_item_unit_price,
    receipt_show_subtotal:
      defaultDocumentBrandingSettings.receipt_show_subtotal,
    receipt_show_tax: defaultDocumentBrandingSettings.receipt_show_tax,
    receipt_show_discounts:
      defaultDocumentBrandingSettings.receipt_show_discounts,
    receipt_show_grand_total:
      defaultDocumentBrandingSettings.receipt_show_grand_total,
    receipt_paid_label: defaultDocumentBrandingSettings.receipt_paid_label,
    receipt_partial_label:
      defaultDocumentBrandingSettings.receipt_partial_label,
    receipt_refunded_label:
      defaultDocumentBrandingSettings.receipt_refunded_label,
    receipt_cancelled_label:
      defaultDocumentBrandingSettings.receipt_cancelled_label,
  },
  footer_terms: {
    default_footer_text: defaultDocumentBrandingSettings.default_footer_text,
    invoice_footer_text: defaultDocumentBrandingSettings.invoice_footer_text,
    quotation_footer_text:
      defaultDocumentBrandingSettings.quotation_footer_text,
    receipt_footer_text: defaultDocumentBrandingSettings.receipt_footer_text,
    terms_conditions: defaultDocumentBrandingSettings.terms_conditions,
    payment_instructions: defaultDocumentBrandingSettings.payment_instructions,
    show_footer_on_documents:
      defaultDocumentBrandingSettings.show_footer_on_documents,
    show_terms_conditions:
      defaultDocumentBrandingSettings.show_terms_conditions,
    show_signature_block: defaultDocumentBrandingSettings.show_signature_block,
    show_page_numbers: defaultDocumentBrandingSettings.show_page_numbers,
  },
};

function formBoolean(formData: FormData, key: string, fallback = false) {
  const value = formData.get(key);
  if (value === null) return fallback;
  return value === "on" || value === "true" || value === "1";
}

function formText(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function optionalFormText(formData: FormData, key: string) {
  const value = formText(formData, key);
  return value.length > 0 ? value : undefined;
}

function nullableColor(formData: FormData, key: string) {
  const value = formText(formData, key);
  return value.length > 0 ? value : null;
}

function revalidateDocumentSettingsPaths() {
  revalidatePath("/settings/company");
  revalidatePath("/settings/documents-branding");
  revalidatePath("/quotations");
  revalidatePath("/payments/invoices");
  revalidatePath("/payments/receipts");
  revalidatePath("/customers");
  revalidatePath("/dashboard");
}

async function getDocumentSettingsPayload() {
  const supabase = await createClient();
  const { data, error } = await (supabase as any)
    .from("document_branding_settings")
    .select("*")
    .eq("id", "default")
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  const row = data as DocumentBrandingSettings | null;
  if (!row) return defaultDocumentBrandingSettings;

  const {
    created_at: _createdAt,
    updated_at: _updatedAt,
    ...settings
  } = row;

  return {
    ...defaultDocumentBrandingSettings,
    ...settings,
    id: "default",
  } satisfies DocumentBrandingSettingsPayload;
}

async function upsertDocumentSettings(args: {
  actorId: string;
  scope: string;
  patch: Partial<DocumentBrandingSettingsPayload>;
}): Promise<ActionResponse> {
  const supabase = await createClient();
  const current = await getDocumentSettingsPayload();
  const payload = {
    ...current,
    ...args.patch,
    id: "default",
  } satisfies DocumentBrandingSettingsPayload;

  const { error } = await (supabase as any)
    .from("document_branding_settings")
    .upsert(payload, { onConflict: "id" });

  if (error) {
    return { error: error.message };
  }

  await (supabase as any).from("activity_logs").insert({
    actor_id: args.actorId,
    entity_type: "document_branding_settings",
    entity_id: args.actorId,
    action: "updated",
    description: `Updated document branding settings: ${args.scope}`,
  });

  await logSecurityEvent({
    userId: args.actorId,
    eventType: "document_branding_settings_updated",
    metadata: {
      scope: args.scope,
    },
  });

  revalidateDocumentSettingsPaths();

  return { success: true };
}

export async function getDocumentBrandingSettingsData() {
  const admin = await requireAdmin();
  const [companySettings, documentSettings] = await Promise.all([
    getCompanySettings(),
    getDocumentSettingsPayload(),
  ]);

  return {
    company: companySettings,
    documentSettings,
    access: {
      canManageDocumentsBranding: admin.role === "admin",
    },
  };
}

export async function updateCompanyBrandingAction(
  formData: FormData
): Promise<ActionResponse> {
  const admin = await requireAdmin();
  const supabase = await createClient();

  const parsed = updateCompanyBrandingSchema.safeParse({
    company_name: formData.get("company_name"),
    brand_name: formData.get("brand_name"),
    tagline: optionalFormText(formData, "tagline"),
    email: optionalFormText(formData, "email"),
    phone: optionalFormText(formData, "phone"),
    website: optionalFormText(formData, "website"),
    address: optionalFormText(formData, "address"),
    primary_brand_color: formData.get("primary_brand_color"),
    secondary_brand_color: nullableColor(formData, "secondary_brand_color"),
    show_logo_on_documents: formBoolean(
      formData,
      "show_logo_on_documents",
      true
    ),
  });

  if (!parsed.success) {
    return {
      error:
        parsed.error.issues[0]?.message ??
        "Invalid company branding settings",
    };
  }

  const { data: existingData } = await (supabase as any)
    .from("company_settings")
    .select(
      "id, company_name, brand_name, email, phone, website, address, city, state, country, logo_url, currency_symbol, document_footer"
    )
    .limit(1)
    .maybeSingle();

  const existing = existingData as CompanySettingsRecord | null;
  const companyPayload = {
    company_name: parsed.data.company_name,
    brand_name: parsed.data.brand_name,
    email: parsed.data.email ?? null,
    phone: parsed.data.phone ?? null,
    website: parsed.data.website ?? null,
    address: parsed.data.address ?? null,
    city: existing?.city ?? null,
    state: existing?.state ?? null,
    country: existing?.country ?? null,
    logo_url: existing?.logo_url ?? null,
    currency_symbol: existing?.currency_symbol ?? "₦",
    document_footer: existing?.document_footer ?? null,
  };

  if (existing?.id) {
    const { error } = await (supabase as any)
      .from("company_settings")
      .update(companyPayload)
      .eq("id", existing.id);

    if (error) return { error: error.message };
  } else {
    const { error } = await (supabase as any)
      .from("company_settings")
      .insert(companyPayload);

    if (error) return { error: error.message };
  }

  return upsertDocumentSettings({
    actorId: admin.id,
    scope: "company_branding",
    patch: {
      tagline: parsed.data.tagline,
      primary_brand_color: parsed.data.primary_brand_color,
      secondary_brand_color: parsed.data.secondary_brand_color ?? null,
      show_logo_on_documents: parsed.data.show_logo_on_documents,
    },
  });
}

export async function updateInvoiceDocumentSettingsAction(
  formData: FormData
): Promise<ActionResponse> {
  const admin = await requireAdmin();

  const parsed = updateInvoiceDocumentSettingsSchema.safeParse({
    invoice_number_prefix: formData.get("invoice_number_prefix"),
    invoice_title: formData.get("invoice_title"),
    invoice_default_due_days: formData.get("invoice_default_due_days"),
    invoice_date_format: formData.get("invoice_date_format"),
    invoice_show_title: formBoolean(formData, "invoice_show_title", true),
    invoice_show_invoice_date: formBoolean(
      formData,
      "invoice_show_invoice_date",
      true
    ),
    invoice_show_due_date: formBoolean(
      formData,
      "invoice_show_due_date",
      true
    ),
    invoice_show_company_logo: formBoolean(
      formData,
      "invoice_show_company_logo",
      true
    ),
    invoice_show_company_address: formBoolean(
      formData,
      "invoice_show_company_address",
      true
    ),
    invoice_show_company_email_phone: formBoolean(
      formData,
      "invoice_show_company_email_phone",
      true
    ),
    invoice_show_customer_address: formBoolean(
      formData,
      "invoice_show_customer_address",
      true
    ),
    invoice_show_item_descriptions: formBoolean(
      formData,
      "invoice_show_item_descriptions",
      true
    ),
    invoice_show_item_quantity: formBoolean(
      formData,
      "invoice_show_item_quantity",
      true
    ),
    invoice_show_item_unit_price: formBoolean(
      formData,
      "invoice_show_item_unit_price",
      true
    ),
    invoice_show_line_total: formBoolean(
      formData,
      "invoice_show_line_total",
      true
    ),
    invoice_show_subtotal: formBoolean(formData, "invoice_show_subtotal", true),
    invoice_show_tax: formBoolean(formData, "invoice_show_tax", true),
    invoice_show_discounts: formBoolean(
      formData,
      "invoice_show_discounts",
      true
    ),
    invoice_show_grand_total: formBoolean(
      formData,
      "invoice_show_grand_total",
      true
    ),
    invoice_paid_label: formData.get("invoice_paid_label"),
    invoice_unpaid_label: formData.get("invoice_unpaid_label"),
    invoice_overdue_label: formData.get("invoice_overdue_label"),
  });

  if (!parsed.success) {
    return {
      error:
        parsed.error.issues[0]?.message ??
        "Invalid invoice document settings",
    };
  }

  return upsertDocumentSettings({
    actorId: admin.id,
    scope: "invoice_settings",
    patch: parsed.data,
  });
}

export async function updateQuotationDocumentSettingsAction(
  formData: FormData
): Promise<ActionResponse> {
  const admin = await requireAdmin();

  const parsed = updateQuotationDocumentSettingsSchema.safeParse({
    quotation_number_prefix: formData.get("quotation_number_prefix"),
    quotation_title: formData.get("quotation_title"),
    quotation_default_validity_days: formData.get(
      "quotation_default_validity_days"
    ),
    quotation_date_format: formData.get("quotation_date_format"),
    quotation_show_title: formBoolean(formData, "quotation_show_title", true),
    quotation_show_quotation_date: formBoolean(
      formData,
      "quotation_show_quotation_date",
      true
    ),
    quotation_show_expiry_date: formBoolean(
      formData,
      "quotation_show_expiry_date",
      true
    ),
    quotation_show_company_logo: formBoolean(
      formData,
      "quotation_show_company_logo",
      true
    ),
    quotation_show_company_address: formBoolean(
      formData,
      "quotation_show_company_address",
      true
    ),
    quotation_show_company_email_phone: formBoolean(
      formData,
      "quotation_show_company_email_phone",
      true
    ),
    quotation_show_customer_address: formBoolean(
      formData,
      "quotation_show_customer_address",
      true
    ),
    quotation_show_item_descriptions: formBoolean(
      formData,
      "quotation_show_item_descriptions",
      true
    ),
    quotation_show_item_quantity: formBoolean(
      formData,
      "quotation_show_item_quantity",
      true
    ),
    quotation_show_item_unit_price: formBoolean(
      formData,
      "quotation_show_item_unit_price",
      true
    ),
    quotation_show_line_total: formBoolean(
      formData,
      "quotation_show_line_total",
      true
    ),
    quotation_show_subtotal: formBoolean(
      formData,
      "quotation_show_subtotal",
      true
    ),
    quotation_show_tax: formBoolean(formData, "quotation_show_tax", true),
    quotation_show_discounts: formBoolean(
      formData,
      "quotation_show_discounts",
      true
    ),
    quotation_show_grand_total: formBoolean(
      formData,
      "quotation_show_grand_total",
      true
    ),
    quotation_draft_label: formData.get("quotation_draft_label"),
    quotation_sent_label: formData.get("quotation_sent_label"),
    quotation_accepted_label: formData.get("quotation_accepted_label"),
    quotation_expired_label: formData.get("quotation_expired_label"),
  });

  if (!parsed.success) {
    return {
      error:
        parsed.error.issues[0]?.message ??
        "Invalid quotation document settings",
    };
  }

  return upsertDocumentSettings({
    actorId: admin.id,
    scope: "quotation_settings",
    patch: parsed.data,
  });
}

export async function updateReceiptDocumentSettingsAction(
  formData: FormData
): Promise<ActionResponse> {
  const admin = await requireAdmin();

  const parsed = updateReceiptDocumentSettingsSchema.safeParse({
    receipt_number_prefix: formData.get("receipt_number_prefix"),
    receipt_title: formData.get("receipt_title"),
    receipt_default_validity_days: formData.get(
      "receipt_default_validity_days"
    ),
    receipt_date_format: formData.get("receipt_date_format"),
    receipt_show_title: formBoolean(formData, "receipt_show_title", true),
    receipt_show_receipt_date: formBoolean(
      formData,
      "receipt_show_receipt_date",
      true
    ),
    receipt_show_payment_date: formBoolean(
      formData,
      "receipt_show_payment_date",
      true
    ),
    receipt_show_company_logo: formBoolean(
      formData,
      "receipt_show_company_logo",
      true
    ),
    receipt_show_company_address: formBoolean(
      formData,
      "receipt_show_company_address",
      true
    ),
    receipt_show_company_email_phone: formBoolean(
      formData,
      "receipt_show_company_email_phone",
      true
    ),
    receipt_show_customer_address: formBoolean(
      formData,
      "receipt_show_customer_address",
      true
    ),
    receipt_show_payment_method: formBoolean(
      formData,
      "receipt_show_payment_method",
      true
    ),
    receipt_show_item_descriptions: formBoolean(
      formData,
      "receipt_show_item_descriptions",
      true
    ),
    receipt_show_item_quantity: formBoolean(
      formData,
      "receipt_show_item_quantity",
      true
    ),
    receipt_show_item_unit_price: formBoolean(
      formData,
      "receipt_show_item_unit_price",
      true
    ),
    receipt_show_subtotal: formBoolean(formData, "receipt_show_subtotal", true),
    receipt_show_tax: formBoolean(formData, "receipt_show_tax", true),
    receipt_show_discounts: formBoolean(
      formData,
      "receipt_show_discounts",
      true
    ),
    receipt_show_grand_total: formBoolean(
      formData,
      "receipt_show_grand_total",
      true
    ),
    receipt_paid_label: formData.get("receipt_paid_label"),
    receipt_partial_label: formData.get("receipt_partial_label"),
    receipt_refunded_label: formData.get("receipt_refunded_label"),
    receipt_cancelled_label: formData.get("receipt_cancelled_label"),
  });

  if (!parsed.success) {
    return {
      error:
        parsed.error.issues[0]?.message ??
        "Invalid receipt document settings",
    };
  }

  return upsertDocumentSettings({
    actorId: admin.id,
    scope: "receipt_settings",
    patch: parsed.data,
  });
}

export async function updateFooterTermsDocumentSettingsAction(
  formData: FormData
): Promise<ActionResponse> {
  const admin = await requireAdmin();
  const supabase = await createClient();

  const parsed = updateFooterTermsDocumentSettingsSchema.safeParse({
    default_footer_text: optionalFormText(formData, "default_footer_text"),
    invoice_footer_text: optionalFormText(formData, "invoice_footer_text"),
    quotation_footer_text: optionalFormText(formData, "quotation_footer_text"),
    receipt_footer_text: optionalFormText(formData, "receipt_footer_text"),
    terms_conditions: optionalFormText(formData, "terms_conditions"),
    payment_instructions: optionalFormText(formData, "payment_instructions"),
    show_footer_on_documents: formBoolean(
      formData,
      "show_footer_on_documents",
      true
    ),
    show_terms_conditions: formBoolean(
      formData,
      "show_terms_conditions",
      true
    ),
    show_signature_block: formBoolean(formData, "show_signature_block", true),
    show_page_numbers: formBoolean(formData, "show_page_numbers", true),
  });

  if (!parsed.success) {
    return {
      error:
        parsed.error.issues[0]?.message ??
        "Invalid footer and terms settings",
    };
  }

  const settingsResult = await upsertDocumentSettings({
    actorId: admin.id,
    scope: "footer_terms",
    patch: parsed.data,
  });

  if ("error" in settingsResult) {
    return settingsResult;
  }

  const { data: existingData } = await (supabase as any)
    .from("company_settings")
    .select("id")
    .limit(1)
    .maybeSingle();

  const existing = existingData as { id: string } | null;
  if (existing?.id) {
    const { error } = await (supabase as any)
      .from("company_settings")
      .update({
        document_footer: parsed.data.default_footer_text ?? null,
      })
      .eq("id", existing.id);

    if (error) return { error: error.message };
  }

  return { success: true };
}

export async function resetDocumentBrandingDefaultsAction(
  scope: ResetDocumentBrandingScope
): Promise<ActionResponse> {
  const admin = await requireAdmin();
  const parsed = resetDocumentBrandingScopeSchema.safeParse(scope);

  if (!parsed.success) {
    return { error: "Invalid reset scope" };
  }

  const patch = resetDefaultsByScope[parsed.data];

  return upsertDocumentSettings({
    actorId: admin.id,
    scope: `reset_${parsed.data}`,
    patch,
  });
}
