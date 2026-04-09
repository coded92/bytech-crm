import { ReactNode } from "react";
import { BackButton } from "@/components/shared/back-button";
import { PrintButton } from "@/components/shared/print-button";
import { getCompanySettings } from "@/lib/company/get-company-settings";

type DocumentShellProps = {
  title: string;
  documentNumber: string;
  children: ReactNode;
};

export async function DocumentShell({
  title,
  documentNumber,
  children,
}: DocumentShellProps) {
  const settings = await getCompanySettings();

  const locationParts = [
    settings.address,
    settings.city,
    settings.state,
    settings.country,
  ].filter(Boolean);

  return (
    <div className="min-h-screen bg-slate-100 print:bg-white">
      <div className="mx-auto max-w-4xl p-4 print:p-0 sm:p-6">
        <div className="mb-4 flex items-center justify-between print:hidden">
          <div className="flex items-center gap-3">
            <BackButton />

            <div>
              <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
              <p className="text-sm text-slate-500">{documentNumber}</p>
            </div>
          </div>

          <PrintButton />
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm print:rounded-none print:border-0 print:shadow-none">
          <div className="border-b border-slate-200 bg-gradient-to-r from-indigo-600 to-emerald-500 px-8 py-8 text-white">
            <div className="flex items-start justify-between gap-6">
              <div>
                {settings.logo_url ? (
                  <img
                    src={settings.logo_url}
                    alt="Company logo"
                    className="mb-4 h-14 w-auto rounded-md bg-white p-1"
                  />
                ) : null}
                <h2 className="text-2xl font-bold">
                  {settings.company_name}
                </h2>

                {settings.brand_name ? (
                  <p className="mt-2 text-sm text-indigo-50">
                    {settings.brand_name}
                  </p>
                ) : null}

                {settings.website ? (
                  <p className="mt-1 text-sm text-indigo-50">
                    {settings.website}
                  </p>
                ) : null}

                {settings.email ? (
                  <p className="mt-1 text-sm text-indigo-50">
                    {settings.email}
                  </p>
                ) : null}

                {settings.phone ? (
                  <p className="mt-1 text-sm text-indigo-50">
                    {settings.phone}
                  </p>
                ) : null}

                {locationParts.length > 0 ? (
                  <p className="mt-1 text-sm text-indigo-50">
                    {locationParts.join(", ")}
                  </p>
                ) : null}
              </div>

              <div className="text-right">
                <p className="text-xs uppercase tracking-[0.2em] text-indigo-100">
                  Business Document
                </p>
                <p className="mt-2 text-lg font-semibold">{title}</p>
                <p className="mt-1 text-sm text-indigo-50">{documentNumber}</p>
              </div>
            </div>
          </div>

          <div className="p-8">{children}</div>

          {settings.document_footer ? (
            <div className="border-t border-slate-200 px-8 py-4 text-sm text-slate-500">
              {settings.document_footer}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}