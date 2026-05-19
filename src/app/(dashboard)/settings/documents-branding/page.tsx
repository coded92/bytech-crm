import {
  BadgeCheck,
  CircleHelp,
  ExternalLink,
  FileText,
  ImageIcon,
  Palette,
  Type,
} from "lucide-react";
import { getDocumentBrandingSettingsData } from "@/lib/actions/document-branding";
import {
  DocumentBrandingResetButton,
  DocumentBrandingSettingsPanel,
} from "@/components/settings/document-branding-settings-panel";
import {
  SettingsRailCard,
  SettingsWorkspace,
} from "@/components/settings/settings-workspace";

export default async function DocumentsBrandingSettingsPage() {
  const settings = await getDocumentBrandingSettingsData();

  return (
    <SettingsWorkspace
      active="documents-branding"
      title="Company Branding"
      description="Customize your company branding and document presentation."
      eyebrow=""
      isAdmin={settings.access.canManageDocumentsBranding}
      headerAction={
        <DocumentBrandingResetButton scope="all" label="Reset to Defaults" />
      }
      rightRail={
        <>
          <SettingsRailCard title="About Company Branding">
            <div className="space-y-4">
              <p className="text-sm font-medium leading-7 text-slate-600">
                Set up your company logo, colors, document labels, footer text,
                terms, and payment instructions for CRM documents.
              </p>
              <a
                href="/settings/data-privacy"
                className="inline-flex items-center gap-2 text-sm font-black text-[#4F46E5]"
              >
                Learn more about branding settings
                <ExternalLink className="size-3.5" />
              </a>
            </div>
          </SettingsRailCard>

          <SettingsRailCard title="Branding Summary">
            <div className="space-y-4">
              <SummaryItem
                icon={ImageIcon}
                label="Company Logo"
                value={settings.company.logo_url ? "Uploaded" : "Not uploaded"}
              />
              <SummaryItem
                icon={Type}
                label="Brand Name"
                value={
                  settings.company.brand_name ??
                  settings.company.company_name ??
                  "BYTECH CRM"
                }
              />
              <SummaryItem
                icon={Palette}
                label="Primary Color"
                value={settings.documentSettings.primary_brand_color ?? "#6B46C1"}
              />
              <SummaryItem
                icon={FileText}
                label="Tagline"
                value={settings.documentSettings.tagline ?? "Not set"}
              />
              <SummaryItem
                icon={BadgeCheck}
                label="Logo on Documents"
                value={
                  settings.documentSettings.show_logo_on_documents
                    ? "Yes"
                    : "No"
                }
              />
            </div>
          </SettingsRailCard>

          <SettingsRailCard title="Need Help?">
            <div className="space-y-4">
              <p className="text-sm font-medium leading-7 text-slate-600">
                If you have questions about branding settings, our support team
                is here to help.
              </p>
              <a
                href="/support"
                className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-[#4F46E5]/30 bg-white px-4 text-sm font-black text-[#4F46E5] shadow-sm transition hover:bg-[#F1F0FC]"
              >
                <CircleHelp className="size-4" />
                Visit Help Center
                <ExternalLink className="size-3.5" />
              </a>
            </div>
          </SettingsRailCard>
        </>
      }
    >
      <DocumentBrandingSettingsPanel
        company={settings.company}
        documentSettings={settings.documentSettings}
      />
    </SettingsWorkspace>
  );
}

function SummaryItem({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex min-w-0 items-center gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[#F1ECFF] text-[#4F46E5]">
          <Icon className="size-4" />
        </span>
        <span className="truncate text-sm font-semibold text-slate-600">
          {label}
        </span>
      </div>
      <span className="max-w-[9rem] truncate text-right text-sm font-bold text-[#172554]">
        {value}
      </span>
    </div>
  );
}
