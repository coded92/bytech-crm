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

  const addressLines = [
    settings.address,
    [settings.city, settings.state].filter(Boolean).join(", "),
    settings.country,
  ].filter(Boolean);

  return (
    <div className="min-h-screen bg-slate-100 print:bg-white">
      <style>{`
        @media print {
          @page {
            size: A4;
            margin: 14mm;
          }

          body {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
        }
      `}</style>

      <div className="mx-auto max-w-4xl p-4 print:max-w-none print:p-0 sm:p-6">
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

        <div className="bg-white p-8 shadow-sm print:p-0 print:shadow-none">
          <div className="mb-6 flex items-start justify-between gap-8">
            <div>
              {settings.logo_url ? (
                <img
                  src={settings.logo_url}
                  alt="Company logo"
                  className="mb-3 h-10 max-w-[180px] object-contain"
                />
              ) : null}

              <h2 className="text-xl font-bold text-slate-950">
                {settings.company_name}
              </h2>

              {addressLines.map((line) => (
                <p key={line} className="mt-1 text-sm text-slate-700">
                  {line}
                </p>
              ))}

              {settings.phone ? (
                <p className="mt-1 text-sm text-slate-700">{settings.phone}</p>
              ) : null}

              {settings.website ? (
                <p className="mt-1 text-sm text-slate-700">
                  {settings.website}
                </p>
              ) : null}

              {settings.email ? (
                <p className="mt-1 text-sm text-slate-700">
                  {settings.email}
                </p>
              ) : null}
            </div>

            <div className="text-right">
              <h1 className="text-3xl font-bold uppercase tracking-wide text-slate-950">
                {title}
              </h1>
              <p className="mt-2 text-sm font-medium text-slate-600">
                {documentNumber}
              </p>
            </div>
          </div>

          {children}

          {settings.document_footer ? (
            <div className="mt-10 border-t border-slate-200 pt-5">
              
              <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">
                {settings.document_footer}
              </p>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}