export const ACTIVITY_ENTITY_TYPES = [
  "lead",
  "customer",
  "task",
  "support_ticket",
  "quotation",
  "invoice",
  "payment",
  "asset",
  "user",
  "supplier",
  "field_job",
  "inventory_item",
  "expense",
  "report",
] as const;

export type ActivityEntityType = (typeof ACTIVITY_ENTITY_TYPES)[number];