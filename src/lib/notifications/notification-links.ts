export function getNotificationHref(
  relatedTable: string | null,
  relatedId: string | null
) {
  if (!relatedTable || !relatedId) return "/notifications";

  if (relatedTable === "tasks") return `/tasks/${relatedId}`;
  if (relatedTable === "leads") return `/leads/${relatedId}`;
  if (relatedTable === "quotations") return `/quotations/${relatedId}`;
  if (relatedTable === "payment_invoices" || relatedTable === "invoices") {
    return `/payments/invoices/${relatedId}`;
  }
  if (relatedTable === "receipts") return `/payments/receipts/${relatedId}`;
  if (relatedTable === "support_tickets") return `/support/${relatedId}`;
  if (relatedTable === "field_jobs") return `/field-jobs/${relatedId}`;
  if (relatedTable === "projects") return `/projects/${relatedId}`;
  if (relatedTable === "customers") return `/customers/${relatedId}`;

  return "/notifications";
}
