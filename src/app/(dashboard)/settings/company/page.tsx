import { requireAdmin } from "@/lib/auth/require-admin";
import { getCompanySettings } from "@/lib/company/get-company-settings";
import { CompanySettingsForm } from "@/components/settings/company-settings-form";
import { CompanyLogoUploadForm } from "@/components/settings/company-logo-upload-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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

      <Card>
        <CardHeader>
          <CardTitle>Company Logo</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {settings.logo_url ? (
            <img
              src={settings.logo_url}
              alt="Company logo"
              className="h-20 w-auto rounded-md border border-slate-200"
            />
          ) : (
            <p className="text-sm text-slate-500">No logo uploaded yet.</p>
          )}

          <CompanyLogoUploadForm />
        </CardContent>
      </Card>

      <CompanySettingsForm initialValues={settings} />
    </div>
  );
}