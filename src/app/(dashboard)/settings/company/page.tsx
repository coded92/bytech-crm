import { requireAdmin } from "@/lib/auth/require-admin";
import { getCompanySettings } from "@/lib/company/get-company-settings";
import { CompanySettingsForm } from "@/components/settings/company-settings-form";

export default async function CompanySettingsPage() {
  await requireAdmin();
  const settings = await getCompanySettings();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">
          Company Settings
        </h2>
        <p className="text-slate-600">
          Manage company profile and branding for documents.
        </p>
      </div>

      <CompanySettingsForm initialValues={settings} />
    </div>
  );
}