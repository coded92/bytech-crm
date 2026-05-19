"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import {
  Building2,
  Check,
  ChevronDown,
  FileText,
  ImageIcon,
  Palette,
  RotateCcw,
  Save,
  Trash2,
  Upload,
} from "lucide-react";
import {
  resetDocumentBrandingDefaultsAction,
  updateCompanyBrandingAction,
  updateFooterTermsDocumentSettingsAction,
  updateInvoiceDocumentSettingsAction,
  updateQuotationDocumentSettingsAction,
  updateReceiptDocumentSettingsAction,
} from "@/lib/actions/document-branding";
import {
  deleteCompanyLogoAction,
  uploadCompanyLogoAction,
} from "@/lib/actions/company-logo";
import { cn } from "@/lib/utils";
import type { DocumentBrandingSettingsInsert } from "@/types/database";

type CompanySettings = {
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
};

type DocumentSettings = DocumentBrandingSettingsInsert & {
  id: "default";
};

type ActionResponse = { success: true } | { error: string };
type FormAction = (formData: FormData) => Promise<ActionResponse>;
type ResetScope =
  | "all"
  | "branding"
  | "invoice"
  | "quotation"
  | "receipt"
  | "footer_terms";

type TabKey =
  | "branding"
  | "invoice"
  | "quotation"
  | "receipt"
  | "footer_terms";

const tabs: Array<{ key: TabKey; label: string }> = [
  { key: "branding", label: "Company Branding" },
  { key: "invoice", label: "Invoice Settings" },
  { key: "quotation", label: "Quotation Settings" },
  { key: "receipt", label: "Receipt Settings" },
  { key: "footer_terms", label: "Footer & Terms" },
];

const booleanSettingKeys = [
  "show_logo_on_documents",
  "invoice_show_title",
  "invoice_show_invoice_date",
  "invoice_show_due_date",
  "invoice_show_company_logo",
  "invoice_show_company_address",
  "invoice_show_company_email_phone",
  "invoice_show_customer_address",
  "invoice_show_item_descriptions",
  "invoice_show_item_quantity",
  "invoice_show_item_unit_price",
  "invoice_show_line_total",
  "invoice_show_subtotal",
  "invoice_show_tax",
  "invoice_show_discounts",
  "invoice_show_grand_total",
  "quotation_show_title",
  "quotation_show_quotation_date",
  "quotation_show_expiry_date",
  "quotation_show_company_logo",
  "quotation_show_company_address",
  "quotation_show_company_email_phone",
  "quotation_show_customer_address",
  "quotation_show_item_descriptions",
  "quotation_show_item_quantity",
  "quotation_show_item_unit_price",
  "quotation_show_line_total",
  "quotation_show_subtotal",
  "quotation_show_tax",
  "quotation_show_discounts",
  "quotation_show_grand_total",
  "receipt_show_title",
  "receipt_show_receipt_date",
  "receipt_show_payment_date",
  "receipt_show_company_logo",
  "receipt_show_company_address",
  "receipt_show_company_email_phone",
  "receipt_show_customer_address",
  "receipt_show_payment_method",
  "receipt_show_item_descriptions",
  "receipt_show_item_quantity",
  "receipt_show_item_unit_price",
  "receipt_show_subtotal",
  "receipt_show_tax",
  "receipt_show_discounts",
  "receipt_show_grand_total",
  "show_footer_on_documents",
  "show_terms_conditions",
  "show_signature_block",
  "show_page_numbers",
] as const;

const dateFormatOptions = [
  { value: "MM/DD/YYYY", label: "MM/DD/YYYY" },
  { value: "DD/MM/YYYY", label: "DD/MM/YYYY" },
  { value: "YYYY-MM-DD", label: "YYYY-MM-DD" },
] as const;

export function DocumentBrandingResetButton({
  scope,
  label,
}: {
  scope: ResetScope;
  label: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={() => {
        startTransition(async () => {
          const result = await resetDocumentBrandingDefaultsAction(scope);
          if (!("error" in result)) {
            router.refresh();
          }
        });
      }}
      className="inline-flex h-10 items-center gap-2 rounded-lg border border-indigo-200 bg-white px-4 text-[13px] font-black text-[var(--bytech-accent)] shadow-sm transition hover:bg-[#F1F0FC] disabled:cursor-not-allowed disabled:opacity-60"
    >
      <RotateCcw className="size-4" />
      {isPending ? "Resetting..." : label}
    </button>
  );
}

export function DocumentBrandingSettingsPanel({
  company,
  documentSettings,
}: {
  company: CompanySettings;
  documentSettings: DocumentSettings;
}) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabKey>("branding");
  const [isPending, startTransition] = useTransition();
  const [logoPending, startLogoTransition] = useTransition();
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [logoMessage, setLogoMessage] = useState("");
  const [logoError, setLogoError] = useState("");
  const [switches, setSwitches] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(
      booleanSettingKeys.map((key) => [
        key,
        Boolean(documentSettings[key] ?? true),
      ])
    )
  );

  const activeTabLabel = useMemo(
    () => tabs.find((tab) => tab.key === activeTab)?.label ?? "Settings",
    [activeTab]
  );

  function updateSwitch(name: string, checked: boolean) {
    setSwitches((current) => ({ ...current, [name]: checked }));
  }

  function runFormAction(action: FormAction, successMessage: string) {
    return (formData: FormData) => {
      setError("");
      setMessage("");

      startTransition(async () => {
        const result = await action(formData);
        if ("error" in result) {
          setError(result.error);
          return;
        }

        setMessage(successMessage);
        router.refresh();
      });
    };
  }

  function runLogoUpload(formData: FormData) {
    setLogoError("");
    setLogoMessage("");

    startLogoTransition(async () => {
      const result = await uploadCompanyLogoAction(formData);
      if ("error" in result) {
        setLogoError(result.error);
        return;
      }

      setLogoMessage("Company logo uploaded successfully.");
      router.refresh();
    });
  }

  function runLogoDelete() {
    setLogoError("");
    setLogoMessage("");

    startLogoTransition(async () => {
      const result = await deleteCompanyLogoAction();
      if ("error" in result) {
        setLogoError(result.error);
        return;
      }

      setLogoMessage("Company logo removed successfully.");
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      <div className="border-b border-slate-200">
        <nav className="-mb-px flex gap-7 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => {
                setActiveTab(tab.key);
                setError("");
                setMessage("");
              }}
              className={cn(
                "whitespace-nowrap border-b-2 px-1 pb-3 text-sm font-black transition",
                activeTab === tab.key
                  ? "border-[#4F46E5] text-[#4F46E5]"
                  : "border-transparent text-[#111827] hover:border-indigo-200 hover:text-[#4F46E5]"
              )}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {message || error || logoMessage || logoError ? (
        <div
          className={cn(
            "rounded-xl border px-4 py-3 text-sm font-bold",
            error || logoError
              ? "border-red-200 bg-red-50 text-red-700"
              : "border-emerald-200 bg-emerald-50 text-emerald-700"
          )}
        >
          {error || logoError || message || logoMessage}
        </div>
      ) : null}

      {activeTab === "branding" ? (
        <BrandingTab
          company={company}
          settings={documentSettings}
          switches={switches}
          isPending={isPending}
          logoPending={logoPending}
          onToggle={updateSwitch}
          onSubmit={runFormAction(
            updateCompanyBrandingAction,
            "Company branding saved successfully."
          )}
          onLogoUpload={runLogoUpload}
          onLogoDelete={runLogoDelete}
        />
      ) : null}

      {activeTab === "invoice" ? (
        <InvoiceTab
          settings={documentSettings}
          switches={switches}
          isPending={isPending}
          onToggle={updateSwitch}
          onSubmit={runFormAction(
            updateInvoiceDocumentSettingsAction,
            "Invoice settings saved successfully."
          )}
        />
      ) : null}

      {activeTab === "quotation" ? (
        <QuotationTab
          settings={documentSettings}
          switches={switches}
          isPending={isPending}
          onToggle={updateSwitch}
          onSubmit={runFormAction(
            updateQuotationDocumentSettingsAction,
            "Quotation settings saved successfully."
          )}
        />
      ) : null}

      {activeTab === "receipt" ? (
        <ReceiptTab
          settings={documentSettings}
          switches={switches}
          isPending={isPending}
          onToggle={updateSwitch}
          onSubmit={runFormAction(
            updateReceiptDocumentSettingsAction,
            "Receipt settings saved successfully."
          )}
        />
      ) : null}

      {activeTab === "footer_terms" ? (
        <FooterTermsTab
          settings={documentSettings}
          switches={switches}
          isPending={isPending}
          onToggle={updateSwitch}
          onSubmit={runFormAction(
            updateFooterTermsDocumentSettingsAction,
            "Footer and terms settings saved successfully."
          )}
        />
      ) : null}

      <p className="rounded-xl border border-indigo-100 bg-[#F8F7FF] px-4 py-3 text-xs font-semibold leading-6 text-slate-600">
        {activeTabLabel} are saved to the CRM backend. Document print pages can
        read these settings in the next integration pass without changing this
        settings UI.
      </p>
    </div>
  );
}

function BrandingTab({
  company,
  settings,
  switches,
  isPending,
  logoPending,
  onToggle,
  onSubmit,
  onLogoUpload,
  onLogoDelete,
}: {
  company: CompanySettings;
  settings: DocumentSettings;
  switches: Record<string, boolean>;
  isPending: boolean;
  logoPending: boolean;
  onToggle: (name: string, checked: boolean) => void;
  onSubmit: (formData: FormData) => void;
  onLogoUpload: (formData: FormData) => void;
  onLogoDelete: () => void;
}) {
  const brandName = company.brand_name ?? company.company_name;

  return (
    <form action={onSubmit} className="space-y-4">
      <fieldset disabled={isPending} className="space-y-4">
        <SettingsCard
          title="Company Logo & Identity"
          description="Upload your logo and set your brand identity."
        >
          <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
            <div>
              <p className="mb-2 text-xs font-black text-[#172554]">
                Company Logo
              </p>
              <div className="flex min-h-36 items-center justify-center rounded-lg border border-[#D8DDF0] bg-white p-4">
                {company.logo_url ? (
                  <img
                    src={company.logo_url}
                    alt={`${brandName} logo`}
                    className="max-h-28 max-w-full object-contain"
                  />
                ) : (
                  <div className="flex flex-col items-center gap-3 text-center">
                    <span className="flex size-14 items-center justify-center rounded-2xl bg-[#F1ECFF] text-[#4F46E5]">
                      <ImageIcon className="size-7" />
                    </span>
                    <span className="text-xl font-black text-[#111827]">
                      {brandName}
                    </span>
                  </div>
                )}
              </div>
              <p className="mt-3 text-xs font-semibold leading-5 text-slate-500">
                Recommended: 512x512px. Supported by the hardened uploader:
                PNG, JPG, or WebP. Max file size follows CRM storage policy.
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                <LogoUploadForm
                  isPending={logoPending}
                  onLogoUpload={onLogoUpload}
                />
                <button
                  type="button"
                  disabled={logoPending || !company.logo_url}
                  onClick={onLogoDelete}
                  className="inline-flex h-10 items-center gap-2 rounded-lg border border-red-200 bg-white px-5 text-sm font-black text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Trash2 className="size-4" />
                  Remove
                </button>
              </div>
            </div>

            <div className="grid gap-x-6 gap-y-5 md:grid-cols-2">
              <Field label="Brand / Company Name" htmlFor="brand_name">
                <TextInput
                  id="brand_name"
                  name="brand_name"
                  defaultValue={brandName}
                  required
                />
              </Field>
              <Field label="Tagline (Optional)" htmlFor="tagline" className="md:col-span-2">
                <TextInput
                  id="tagline"
                  name="tagline"
                  defaultValue={settings.tagline ?? ""}
                  placeholder="Innovate. Simplify. Grow."
                />
              </Field>
              <Field label="Primary Brand Color" htmlFor="primary_brand_color">
                <ColorInput
                  id="primary_brand_color"
                  name="primary_brand_color"
                  defaultValue={settings.primary_brand_color ?? "#6B46C1"}
                />
                <p className="mt-2 text-xs font-semibold text-slate-500">
                  Used for accents and highlights on documents.
                </p>
              </Field>
              <Field
                label="Secondary Brand Color (Optional)"
                htmlFor="secondary_brand_color"
              >
                <ColorInput
                  id="secondary_brand_color"
                  name="secondary_brand_color"
                  defaultValue={settings.secondary_brand_color ?? "#E9D5FF"}
                />
              </Field>
              <div className="md:col-span-2">
                <ToggleRow
                  name="show_logo_on_documents"
                  label="Logo on Documents"
                  description="Show the company logo on customer-facing documents."
                  checked={switches.show_logo_on_documents}
                  onChange={onToggle}
                />
              </div>
            </div>
          </div>
        </SettingsCard>

        <SettingsCard
          title="Company Details for Documents"
          description="Information from your company profile that will appear on documents."
        >
          <div className="grid gap-x-6 gap-y-5 md:grid-cols-2">
            <Field label="Company Name" htmlFor="document_company_name">
              <TextInput
                id="document_company_name"
                name="company_name"
                defaultValue={company.company_name}
                required
              />
            </Field>
            <Field label="Address" htmlFor="address" className="md:row-span-3">
              <Textarea
                id="address"
                name="address"
                rows={5}
                defaultValue={company.address ?? ""}
              />
            </Field>
            <Field label="Email" htmlFor="email">
              <TextInput
                id="email"
                name="email"
                type="email"
                defaultValue={company.email ?? ""}
              />
            </Field>
            <Field label="Phone" htmlFor="phone">
              <TextInput id="phone" name="phone" defaultValue={company.phone ?? ""} />
            </Field>
            <Field label="Website" htmlFor="website" className="md:col-span-2">
              <TextInput
                id="website"
                name="website"
                defaultValue={company.website ?? ""}
              />
            </Field>
          </div>
        </SettingsCard>

        <SettingsCard
          title="Branding Preview"
          description="This is how your brand header will look on documents."
        >
          <div className="rounded-lg border border-[#D8DDF0] bg-white p-5">
            <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-4">
                <div className="flex size-16 shrink-0 items-center justify-center rounded-2xl bg-[#F1ECFF] text-[#4F46E5]">
                  {company.logo_url ? (
                    <img
                      src={company.logo_url}
                      alt=""
                      className="max-h-12 max-w-12 object-contain"
                    />
                  ) : (
                    <Building2 className="size-8" />
                  )}
                </div>
                <div>
                  <p className="text-2xl font-black tracking-tight text-[#111827]">
                    {brandName}
                  </p>
                  <p className="mt-1 text-sm font-semibold text-slate-500">
                    {settings.tagline ?? "Innovate. Simplify. Grow."}
                  </p>
                </div>
              </div>
              <div className="grid gap-2 text-sm font-semibold text-slate-600 md:grid-cols-2 md:text-right">
                <span>{company.address ?? "Company address"}</span>
                <span>{company.email ?? "email@example.com"}</span>
                <span>{company.phone ?? "Phone number"}</span>
                <span>{company.website ?? "Website"}</span>
              </div>
            </div>
            <div
              className="mt-5 h-1 rounded-full"
              style={{
                backgroundColor: settings.primary_brand_color ?? "#6B46C1",
              }}
            />
          </div>
        </SettingsCard>

        <FormFooter isPending={isPending} />
      </fieldset>
    </form>
  );
}

function InvoiceTab({
  settings,
  switches,
  isPending,
  onToggle,
  onSubmit,
}: DocumentFormProps) {
  return (
    <form action={onSubmit} className="space-y-4">
      <fieldset disabled={isPending} className="space-y-4">
        <SettingsCard
          title="Invoice Information"
          description="Configure the basic information and display options for invoices."
        >
          <DocumentInfoGrid>
            <Field label="Invoice Number Prefix" htmlFor="invoice_number_prefix">
              <TextInput
                id="invoice_number_prefix"
                name="invoice_number_prefix"
                defaultValue={settings.invoice_number_prefix ?? "INV-"}
                required
              />
            </Field>
            <ToggleRow
              name="invoice_show_title"
              label="Show Invoice Title"
              description="Display the invoice title on documents."
              checked={switches.invoice_show_title}
              onChange={onToggle}
            />
            <Field label="Default Due Terms (Days)" htmlFor="invoice_default_due_days">
              <TextInput
                id="invoice_default_due_days"
                name="invoice_default_due_days"
                type="number"
                min={0}
                defaultValue={String(settings.invoice_default_due_days ?? 30)}
                required
              />
            </Field>
            <Field label="Invoice Title" htmlFor="invoice_title">
              <TextInput
                id="invoice_title"
                name="invoice_title"
                defaultValue={settings.invoice_title ?? "INVOICE"}
                required
              />
            </Field>
            <ToggleRow
              name="invoice_show_invoice_date"
              label="Show Invoice Date"
              description="Display invoice date on documents."
              checked={switches.invoice_show_invoice_date}
              onChange={onToggle}
            />
            <Field label="Date Format" htmlFor="invoice_date_format">
              <SelectControl
                id="invoice_date_format"
                name="invoice_date_format"
                defaultValue={settings.invoice_date_format ?? "MM/DD/YYYY"}
                options={dateFormatOptions}
              />
            </Field>
            <div />
            <ToggleRow
              name="invoice_show_due_date"
              label="Show Due Date"
              description="Display due date on invoices."
              checked={switches.invoice_show_due_date}
              onChange={onToggle}
            />
          </DocumentInfoGrid>
        </SettingsCard>

        <DisplayOptionsCard
          title="Invoice Display Options"
          description="Choose what information to show on invoices."
          options={[
            ["invoice_show_company_logo", "Show Company Logo", "Display company logo on invoice."],
            ["invoice_show_item_descriptions", "Show Item Descriptions", "Display item/service descriptions."],
            ["invoice_show_subtotal", "Show Subtotal", "Display subtotal of items."],
            ["invoice_show_company_address", "Show Company Address", "Display company address on invoice."],
            ["invoice_show_item_quantity", "Show Item Quantity", "Display item quantities."],
            ["invoice_show_tax", "Show Tax", "Display tax details."],
            ["invoice_show_company_email_phone", "Show Company Email & Phone", "Display email and phone number."],
            ["invoice_show_item_unit_price", "Show Item Unit Price", "Display unit price for each item."],
            ["invoice_show_discounts", "Show Discounts", "Display discount details."],
            ["invoice_show_customer_address", "Show Customer Address", "Display customer address on invoice."],
            ["invoice_show_line_total", "Show Line Total", "Display line total for each item."],
            ["invoice_show_grand_total", "Show Grand Total", "Display grand total."],
          ]}
          switches={switches}
          onToggle={onToggle}
        />

        <SettingsCard
          title="Invoice Status & Labels"
          description="Configure labels and statuses used for invoices."
        >
          <div className="grid gap-5 md:grid-cols-3">
            <Field label="Paid Label" htmlFor="invoice_paid_label">
              <TextInput
                id="invoice_paid_label"
                name="invoice_paid_label"
                defaultValue={settings.invoice_paid_label ?? "PAID"}
                required
              />
            </Field>
            <Field label="Unpaid Label" htmlFor="invoice_unpaid_label">
              <TextInput
                id="invoice_unpaid_label"
                name="invoice_unpaid_label"
                defaultValue={settings.invoice_unpaid_label ?? "UNPAID"}
                required
              />
            </Field>
            <Field label="Overdue Label" htmlFor="invoice_overdue_label">
              <TextInput
                id="invoice_overdue_label"
                name="invoice_overdue_label"
                defaultValue={settings.invoice_overdue_label ?? "OVERDUE"}
                required
              />
            </Field>
          </div>
        </SettingsCard>

        <FormFooter isPending={isPending} />
      </fieldset>
    </form>
  );
}

function QuotationTab({
  settings,
  switches,
  isPending,
  onToggle,
  onSubmit,
}: DocumentFormProps) {
  return (
    <form action={onSubmit} className="space-y-4">
      <fieldset disabled={isPending} className="space-y-4">
        <SettingsCard
          title="Quotation Information"
          description="Configure the basic information and display options for quotations."
        >
          <DocumentInfoGrid>
            <Field label="Quotation Number Prefix" htmlFor="quotation_number_prefix">
              <TextInput
                id="quotation_number_prefix"
                name="quotation_number_prefix"
                defaultValue={settings.quotation_number_prefix ?? "QTN-"}
                required
              />
            </Field>
            <ToggleRow
              name="quotation_show_title"
              label="Show Quotation Title"
              description="Display the quotation title on documents."
              checked={switches.quotation_show_title}
              onChange={onToggle}
            />
            <Field
              label="Default Validity (Days)"
              htmlFor="quotation_default_validity_days"
            >
              <TextInput
                id="quotation_default_validity_days"
                name="quotation_default_validity_days"
                type="number"
                min={0}
                defaultValue={String(settings.quotation_default_validity_days ?? 30)}
                required
              />
            </Field>
            <Field label="Quotation Title" htmlFor="quotation_title">
              <TextInput
                id="quotation_title"
                name="quotation_title"
                defaultValue={settings.quotation_title ?? "QUOTATION"}
                required
              />
            </Field>
            <ToggleRow
              name="quotation_show_quotation_date"
              label="Show Quotation Date"
              description="Display quotation date on documents."
              checked={switches.quotation_show_quotation_date}
              onChange={onToggle}
            />
            <Field label="Date Format" htmlFor="quotation_date_format">
              <SelectControl
                id="quotation_date_format"
                name="quotation_date_format"
                defaultValue={settings.quotation_date_format ?? "MM/DD/YYYY"}
                options={dateFormatOptions}
              />
            </Field>
            <div />
            <ToggleRow
              name="quotation_show_expiry_date"
              label="Show Expiry Date"
              description="Display expiry date on quotations."
              checked={switches.quotation_show_expiry_date}
              onChange={onToggle}
            />
          </DocumentInfoGrid>
        </SettingsCard>

        <DisplayOptionsCard
          title="Quotation Display Options"
          description="Choose what information to show on quotations."
          options={[
            ["quotation_show_company_logo", "Show Company Logo", "Display company logo on quotation."],
            ["quotation_show_item_descriptions", "Show Item Descriptions", "Display item/service descriptions."],
            ["quotation_show_subtotal", "Show Subtotal", "Display subtotal of items."],
            ["quotation_show_company_address", "Show Company Address", "Display company address on quotation."],
            ["quotation_show_item_quantity", "Show Item Quantity", "Display item quantities."],
            ["quotation_show_tax", "Show Tax", "Display tax details."],
            ["quotation_show_company_email_phone", "Show Company Email & Phone", "Display email and phone number."],
            ["quotation_show_item_unit_price", "Show Item Unit Price", "Display unit price for each item."],
            ["quotation_show_discounts", "Show Discounts", "Display discount details."],
            ["quotation_show_customer_address", "Show Customer Address", "Display customer address on quotation."],
            ["quotation_show_line_total", "Show Line Total", "Display line total for each item."],
            ["quotation_show_grand_total", "Show Grand Total", "Display grand total."],
          ]}
          switches={switches}
          onToggle={onToggle}
        />

        <SettingsCard
          title="Quotation Status & Labels"
          description="Configure labels and statuses used for quotations."
        >
          <div className="grid gap-5 md:grid-cols-4">
            <Field label="Draft Label" htmlFor="quotation_draft_label">
              <TextInput
                id="quotation_draft_label"
                name="quotation_draft_label"
                defaultValue={settings.quotation_draft_label ?? "DRAFT"}
                required
              />
            </Field>
            <Field label="Sent Label" htmlFor="quotation_sent_label">
              <TextInput
                id="quotation_sent_label"
                name="quotation_sent_label"
                defaultValue={settings.quotation_sent_label ?? "SENT"}
                required
              />
            </Field>
            <Field label="Accepted Label" htmlFor="quotation_accepted_label">
              <TextInput
                id="quotation_accepted_label"
                name="quotation_accepted_label"
                defaultValue={settings.quotation_accepted_label ?? "ACCEPTED"}
                required
              />
            </Field>
            <Field label="Expired Label" htmlFor="quotation_expired_label">
              <TextInput
                id="quotation_expired_label"
                name="quotation_expired_label"
                defaultValue={settings.quotation_expired_label ?? "EXPIRED"}
                required
              />
            </Field>
          </div>
        </SettingsCard>

        <FormFooter isPending={isPending} />
      </fieldset>
    </form>
  );
}

function ReceiptTab({
  settings,
  switches,
  isPending,
  onToggle,
  onSubmit,
}: DocumentFormProps) {
  return (
    <form action={onSubmit} className="space-y-4">
      <fieldset disabled={isPending} className="space-y-4">
        <SettingsCard
          title="Receipt Information"
          description="Configure the basic information and display options for receipts."
        >
          <DocumentInfoGrid>
            <Field label="Receipt Number Prefix" htmlFor="receipt_number_prefix">
              <TextInput
                id="receipt_number_prefix"
                name="receipt_number_prefix"
                defaultValue={settings.receipt_number_prefix ?? "RCPT-"}
                required
              />
            </Field>
            <ToggleRow
              name="receipt_show_title"
              label="Show Receipt Title"
              description="Display the receipt title on documents."
              checked={switches.receipt_show_title}
              onChange={onToggle}
            />
            <Field label="Default Validity (Days)" htmlFor="receipt_default_validity_days">
              <TextInput
                id="receipt_default_validity_days"
                name="receipt_default_validity_days"
                type="number"
                min={0}
                defaultValue={String(settings.receipt_default_validity_days ?? 30)}
                required
              />
            </Field>
            <Field label="Receipt Title" htmlFor="receipt_title">
              <TextInput
                id="receipt_title"
                name="receipt_title"
                defaultValue={settings.receipt_title ?? "RECEIPT"}
                required
              />
            </Field>
            <ToggleRow
              name="receipt_show_receipt_date"
              label="Show Receipt Date"
              description="Display receipt date on documents."
              checked={switches.receipt_show_receipt_date}
              onChange={onToggle}
            />
            <Field label="Date Format" htmlFor="receipt_date_format">
              <SelectControl
                id="receipt_date_format"
                name="receipt_date_format"
                defaultValue={settings.receipt_date_format ?? "MM/DD/YYYY"}
                options={dateFormatOptions}
              />
            </Field>
            <div />
            <ToggleRow
              name="receipt_show_payment_date"
              label="Show Payment Date"
              description="Display payment date on receipts."
              checked={switches.receipt_show_payment_date}
              onChange={onToggle}
            />
          </DocumentInfoGrid>
        </SettingsCard>

        <DisplayOptionsCard
          title="Receipt Display Options"
          description="Choose what information to show on receipts."
          options={[
            ["receipt_show_company_logo", "Show Company Logo", "Display company logo on receipt."],
            ["receipt_show_payment_method", "Show Payment Method", "Display payment method details."],
            ["receipt_show_subtotal", "Show Subtotal", "Display subtotal of items."],
            ["receipt_show_company_address", "Show Company Address", "Display company address on receipt."],
            ["receipt_show_item_descriptions", "Show Item Descriptions", "Display item/service descriptions."],
            ["receipt_show_tax", "Show Tax", "Display tax details."],
            ["receipt_show_company_email_phone", "Show Company Email & Phone", "Display email and phone number."],
            ["receipt_show_item_quantity", "Show Item Quantity", "Display item quantities."],
            ["receipt_show_discounts", "Show Discounts", "Display discount details."],
            ["receipt_show_customer_address", "Show Customer Address", "Display customer address on receipt."],
            ["receipt_show_item_unit_price", "Show Item Unit Price", "Display unit price for each item."],
            ["receipt_show_grand_total", "Show Grand Total", "Display grand total."],
          ]}
          switches={switches}
          onToggle={onToggle}
        />

        <SettingsCard
          title="Receipt Status & Labels"
          description="Configure labels and statuses used for receipts."
        >
          <div className="grid gap-5 md:grid-cols-4">
            <Field label="Paid Label" htmlFor="receipt_paid_label">
              <TextInput
                id="receipt_paid_label"
                name="receipt_paid_label"
                defaultValue={settings.receipt_paid_label ?? "PAID"}
                required
              />
            </Field>
            <Field label="Partial Label" htmlFor="receipt_partial_label">
              <TextInput
                id="receipt_partial_label"
                name="receipt_partial_label"
                defaultValue={settings.receipt_partial_label ?? "PARTIAL"}
                required
              />
            </Field>
            <Field label="Refunded Label" htmlFor="receipt_refunded_label">
              <TextInput
                id="receipt_refunded_label"
                name="receipt_refunded_label"
                defaultValue={settings.receipt_refunded_label ?? "REFUNDED"}
                required
              />
            </Field>
            <Field label="Cancelled Label" htmlFor="receipt_cancelled_label">
              <TextInput
                id="receipt_cancelled_label"
                name="receipt_cancelled_label"
                defaultValue={settings.receipt_cancelled_label ?? "CANCELLED"}
                required
              />
            </Field>
          </div>
        </SettingsCard>

        <FormFooter isPending={isPending} />
      </fieldset>
    </form>
  );
}

function FooterTermsTab({
  settings,
  switches,
  isPending,
  onToggle,
  onSubmit,
}: DocumentFormProps) {
  return (
    <form action={onSubmit} className="space-y-4">
      <fieldset disabled={isPending} className="space-y-4">
        <SettingsCard
          title="Document Footer Text"
          description="Customize footer text that will appear at the bottom of your documents."
        >
          <div className="grid gap-x-6 gap-y-5 md:grid-cols-2">
            <Field label="Default Footer (All Documents)" htmlFor="default_footer_text">
              <Textarea
                id="default_footer_text"
                name="default_footer_text"
                rows={4}
                maxLength={1000}
                defaultValue={settings.default_footer_text ?? ""}
              />
            </Field>
            <Field label="Invoice Footer" htmlFor="invoice_footer_text">
              <Textarea
                id="invoice_footer_text"
                name="invoice_footer_text"
                rows={4}
                maxLength={1000}
                defaultValue={settings.invoice_footer_text ?? ""}
              />
            </Field>
            <Field label="Quotation Footer" htmlFor="quotation_footer_text">
              <Textarea
                id="quotation_footer_text"
                name="quotation_footer_text"
                rows={4}
                maxLength={1000}
                defaultValue={settings.quotation_footer_text ?? ""}
              />
            </Field>
            <Field label="Receipt Footer" htmlFor="receipt_footer_text">
              <Textarea
                id="receipt_footer_text"
                name="receipt_footer_text"
                rows={4}
                maxLength={1000}
                defaultValue={settings.receipt_footer_text ?? ""}
              />
            </Field>
          </div>
        </SettingsCard>

        <SettingsCard
          title="Terms & Conditions"
          description="Set your standard terms, conditions, and payment instructions for documents."
        >
          <div className="grid gap-x-6 gap-y-5 md:grid-cols-2">
            <Field label="Terms & Conditions" htmlFor="terms_conditions">
              <Textarea
                id="terms_conditions"
                name="terms_conditions"
                rows={6}
                maxLength={5000}
                defaultValue={settings.terms_conditions ?? ""}
              />
            </Field>
            <Field label="Payment Instructions" htmlFor="payment_instructions">
              <Textarea
                id="payment_instructions"
                name="payment_instructions"
                rows={6}
                maxLength={2000}
                defaultValue={settings.payment_instructions ?? ""}
              />
            </Field>
          </div>
        </SettingsCard>

        <SettingsCard
          title="Document Appearance"
          description="Control how footers and additional information appear on documents."
        >
          <div className="grid gap-5 md:grid-cols-4">
            <ToggleRow
              name="show_footer_on_documents"
              label="Show Footer on Documents"
              description="Display footer on all documents."
              checked={switches.show_footer_on_documents}
              onChange={onToggle}
            />
            <ToggleRow
              name="show_terms_conditions"
              label="Show Terms & Conditions"
              description="Include terms and conditions."
              checked={switches.show_terms_conditions}
              onChange={onToggle}
            />
            <ToggleRow
              name="show_signature_block"
              label="Show Signature Block"
              description="Display signature block on documents."
              checked={switches.show_signature_block}
              onChange={onToggle}
            />
            <ToggleRow
              name="show_page_numbers"
              label="Show Page Numbers"
              description="Display page numbers."
              checked={switches.show_page_numbers}
              onChange={onToggle}
            />
          </div>
        </SettingsCard>

        <FormFooter isPending={isPending} />
      </fieldset>
    </form>
  );
}

type DocumentFormProps = {
  settings: DocumentSettings;
  switches: Record<string, boolean>;
  isPending: boolean;
  onToggle: (name: string, checked: boolean) => void;
  onSubmit: (formData: FormData) => void;
};

function LogoUploadForm({
  isPending,
  onLogoUpload,
}: {
  isPending: boolean;
  onLogoUpload: (formData: FormData) => void;
}) {
  return (
    <label className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-lg border border-[#4F46E5]/40 bg-white px-5 text-sm font-black text-[#4F46E5] transition hover:bg-[#F1F0FC]">
      <Upload className="size-4" />
      {isPending ? "Uploading..." : "Change Logo"}
      <input
        type="file"
        name="logo"
        accept="image/png,image/jpeg,image/webp"
        disabled={isPending}
        className="sr-only"
        onChange={(event) => {
          const file = event.currentTarget.files?.[0];
          if (!file) return;
          const formData = new FormData();
          formData.set("logo", file);
          onLogoUpload(formData);
          event.currentTarget.value = "";
        }}
      />
    </label>
  );
}

function DisplayOptionsCard({
  title,
  description,
  options,
  switches,
  onToggle,
}: {
  title: string;
  description: string;
  options: Array<[string, string, string]>;
  switches: Record<string, boolean>;
  onToggle: (name: string, checked: boolean) => void;
}) {
  return (
    <SettingsCard title={title} description={description}>
      <div className="grid gap-x-6 gap-y-4 md:grid-cols-2 xl:grid-cols-3">
        {options.map(([name, label, optionDescription]) => (
          <ToggleRow
            key={name}
            name={name}
            label={label}
            description={optionDescription}
            checked={Boolean(switches[name])}
            onChange={onToggle}
          />
        ))}
      </div>
    </SettingsCard>
  );
}

function SettingsCard({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-[#DDE2F2] bg-white p-4 shadow-sm sm:p-5">
      <div className="mb-5">
        <h2 className="text-lg font-black tracking-tight text-[#111827]">
          {title}
        </h2>
        <p className="mt-1 text-sm font-medium leading-6 text-slate-600">
          {description}
        </p>
      </div>
      {children}
    </section>
  );
}

function DocumentInfoGrid({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid gap-x-7 gap-y-5 md:grid-cols-2 xl:grid-cols-3">
      {children}
    </div>
  );
}

function Field({
  label,
  hint,
  htmlFor,
  children,
  className,
}: {
  label: string;
  hint?: string;
  htmlFor: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-2", className)}>
      <label htmlFor={htmlFor} className="text-xs font-black text-[#172554]">
        {label}
      </label>
      {hint ? <p className="text-xs font-semibold text-slate-500">{hint}</p> : null}
      {children}
    </div>
  );
}

function TextInput({
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={cn(
        "h-11 w-full rounded-md border border-[#D8DDF0] bg-white px-3 text-sm font-semibold text-[#111827] shadow-sm outline-none transition placeholder:text-slate-400 focus:border-[#4F46E5] focus:ring-4 focus:ring-[#4F46E5]/10 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500",
        className
      )}
    />
  );
}

function ColorInput({
  defaultValue,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  const [value, setValue] = useState(String(defaultValue ?? "#4F46E5"));

  return (
    <div className="flex h-11 items-center gap-3 rounded-md border border-[#D8DDF0] bg-white px-3 shadow-sm focus-within:border-[#4F46E5] focus-within:ring-4 focus-within:ring-[#4F46E5]/10">
      <input
        type="color"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        className="size-7 shrink-0 cursor-pointer rounded border-0 bg-transparent p-0"
        aria-label={props["aria-label"] ?? props.name}
      />
      <input
        {...props}
        value={value}
        onChange={(event) => setValue(event.target.value)}
        className="min-w-0 flex-1 bg-transparent text-sm font-semibold text-[#111827] outline-none"
      />
    </div>
  );
}

function Textarea({
  className,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={cn(
        "w-full rounded-md border border-[#D8DDF0] bg-white px-3 py-3 text-sm font-semibold text-[#111827] shadow-sm outline-none transition placeholder:text-slate-400 focus:border-[#4F46E5] focus:ring-4 focus:ring-[#4F46E5]/10 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500",
        className
      )}
    />
  );
}

function SelectControl({
  options,
  className,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement> & {
  options: readonly { value: string; label: string }[];
}) {
  return (
    <div className="relative">
      <select
        {...props}
        className={cn(
          "h-11 w-full appearance-none rounded-md border border-[#D8DDF0] bg-white px-3 pr-10 text-sm font-semibold text-[#111827] shadow-sm outline-none transition focus:border-[#4F46E5] focus:ring-4 focus:ring-[#4F46E5]/10",
          className
        )}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-slate-500" />
    </div>
  );
}

function ToggleRow({
  name,
  label,
  description,
  checked,
  onChange,
}: {
  name: string;
  label: string;
  description: string;
  checked: boolean;
  onChange: (name: string, checked: boolean) => void;
}) {
  return (
    <div className="flex min-h-[3.25rem] items-center justify-between gap-4">
      <input type="hidden" name={name} value={checked ? "true" : "false"} />
      <div className="min-w-0">
        <p className="text-sm font-black text-[#172554]">{label}</p>
        <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">
          {description}
        </p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(name, !checked)}
        className={cn(
          "relative h-6 w-11 shrink-0 rounded-full transition focus:outline-none focus:ring-4 focus:ring-[#4F46E5]/15",
          checked ? "bg-[#4F46E5]" : "bg-slate-300"
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 size-5 rounded-full bg-white shadow transition",
            checked ? "left-5" : "left-0.5"
          )}
        />
      </button>
    </div>
  );
}

function FormFooter({ isPending }: { isPending: boolean }) {
  return (
    <div className="flex flex-wrap items-center gap-3 pt-1">
      <button
        type="submit"
        disabled={isPending}
        className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#4F46E5] px-5 text-sm font-black text-white shadow-lg shadow-indigo-200 transition hover:bg-[#4338CA] disabled:cursor-not-allowed disabled:opacity-60"
      >
        <Check className="size-4" />
        {isPending ? "Saving..." : "Save Changes"}
      </button>
      <button
        type="reset"
        disabled={isPending}
        className="inline-flex h-10 items-center rounded-lg border border-[#D8DDF0] bg-white px-5 text-sm font-black text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
      >
        Cancel
      </button>
      <span className="ml-auto hidden items-center gap-2 text-xs font-bold text-slate-500 sm:inline-flex">
        <Save className="size-4" />
        Admin-only document settings
      </span>
    </div>
  );
}
