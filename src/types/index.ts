export type UserRole = "admin" | "staff";

export type LeadStatus =
  | "new"
  | "contacted"
  | "interested"
  | "follow_up"
  | "closed_won"
  | "closed_lost";

export type CustomerPlan = "cloud" | "offline";

export type TaskStatus = "pending" | "in_progress" | "completed" | "cancelled";

export type PaymentStatus = "pending" | "partial" | "paid" | "overdue" | "waived";

export type Customer = {
  id: string;
  customer_code: string | null;
  company_name: string;
  contact_person: string;
  phone: string | null;
  email: string | null;
  alternate_phone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  industry: string | null;
  business_type: string | null;
  plan_type: "cloud" | "offline";
  subscription_amount: number;
  billing_cycle: "monthly" | "quarterly" | "yearly" | "one_time";
  setup_fee: number;
  onboarding_date: string | null;
  go_live_date: string | null;
  status: "active" | "inactive" | "suspended";
  notes: string | null;
  created_at: string;
  updated_at: string;
  account_manager?: {
    full_name: string | null;
  } | null;
  created_by_profile?: {
    full_name: string | null;
  } | null;
};


export type Invoice = {
  id: string;
  status: "pending" | "partial" | "paid" | "overdue";
};

export type Payment = {
  amount: number;
  paid_at: string;
};

export type Task = {
  id: string;
  title: string;
  status: string;
  priority: string;
  due_date: string;
  assigned_to_profile?: {
    full_name: string | null;
  } | null;
};

export type Activity = {
  id: string;
  action: string;
  description: string;
  entity_type: string;
  created_at: string;
  actor?: {
    full_name: string | null;
  } | null;
};