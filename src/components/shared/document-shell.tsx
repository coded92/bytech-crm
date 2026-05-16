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
  const generatedAt = new Date().toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  const addressLines = [
    settings.address,
    [settings.city, settings.state].filter(Boolean).join(", "),
    settings.country,
  ].filter(Boolean);

  const contactLines = [
    settings.phone,
    settings.email,
    settings.website,
  ].filter(Boolean);

  return (
    <div className="min-h-screen bg-slate-100 text-slate-950 print:bg-white">
      <style>{`
        @media print {
          @page {
            size: A4;
            margin: 12mm;
          }

          html,
          body {
            background: #ffffff !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }

          .document-page {
            box-shadow: none !important;
            border: 0 !important;
          }

          .document-avoid-break {
            break-inside: avoid;
            page-break-inside: avoid;
          }

          .document-table thead {
            display: table-header-group;
          }

          .document-table tr {
            break-inside: avoid;
            page-break-inside: avoid;
          }
        }
      `}</style>

      <div className="mx-auto max-w-[960px] p-4 print:max-w-none print:p-0 sm:p-6 lg:p-8">
        <div className="mb-4 flex items-center justify-between gap-4 print:hidden">
          <div className="flex items-center gap-3">
            <BackButton />
            <div>
              <h1 className="text-xl font-semibold text-slate-950">{title}</h1>
              <p className="text-sm text-slate-500">
                Document {documentNumber}
              </p>
            </div>
          </div>

          <PrintButton />
        </div>

        <div className="document-page overflow-hidden border border-slate-200 bg-white shadow-sm print:p-0 print:shadow-none">
          <div className="h-2 bg-slate-950 print:h-1.5" />

          <div className="p-8 print:p-0 sm:p-10">
            <header className="document-avoid-break border-b border-slate-200 pb-7">
              <div className="grid gap-8 md:grid-cols-[1.1fr_0.9fr] print:grid-cols-[1.1fr_0.9fr]">
                <div className="min-w-0">
                  {settings.logo_url ? (
                    <div className="mb-5 flex h-16 items-center">
                      <img
                        src={settings.logo_url}
                        alt="Company logo"
                        className="max-h-16 max-w-[240px] object-contain"
                      />
                    </div>
                  ) : (
                    <div className="mb-5 inline-flex h-14 min-w-14 items-center justify-center border border-slate-300 px-4 text-lg font-semibold text-slate-950">
                      {settings.brand_name || settings.company_name}
                    </div>
                  )}

                  <h2 className="text-xl font-semibold text-slate-950">
                    {settings.company_name}
                  </h2>

                  <div className="mt-3 space-y-1 text-sm leading-6 text-slate-600">
                    {addressLines.map((line) => (
                      <p key={line}>{line}</p>
                    ))}

                    {contactLines.length > 0 ? (
                      <p>{contactLines.join(" | ")}</p>
                    ) : null}
                  </div>
                </div>

                <div className="flex flex-col items-start md:items-end print:items-end">
                  <p className="text-xs font-semibold uppercase text-slate-500">
                    Official Document
                  </p>
                  <h1 className="mt-2 text-4xl font-semibold uppercase leading-tight text-slate-950">
                    {title}
                  </h1>

                  <div className="mt-5 w-full max-w-xs border border-slate-200 bg-slate-50">
                    <div className="grid grid-cols-[0.9fr_1.1fr] border-b border-slate-200">
                      <div className="px-3 py-2 text-xs font-semibold uppercase text-slate-500">
                        Number
                      </div>
                      <div className="px-3 py-2 text-right text-sm font-semibold text-slate-950">
                        {documentNumber}
                      </div>
                    </div>
                    <div className="grid grid-cols-[0.9fr_1.1fr]">
                      <div className="px-3 py-2 text-xs font-semibold uppercase text-slate-500">
                        Printed
                      </div>
                      <div className="px-3 py-2 text-right text-sm font-medium text-slate-700">
                        {generatedAt}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 h-px bg-slate-950" />
            </header>

            <main className="mt-8 print:mt-7">{children}</main>

            <footer className="document-avoid-break mt-12 border-t border-slate-200 pt-5">
              {settings.document_footer ? (
                <p className="whitespace-pre-wrap text-sm leading-6 text-slate-700">
                  {settings.document_footer}
                </p>
              ) : null}

              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
                <span>{settings.company_name}</span>
                <span>Generated from BYTECH CRM</span>
              </div>
            </footer>
          </div>
        </div>
      </div>
    </div>
  );
}
