export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string;
          email: string | null;
          phone: string | null;
          role: "admin" | "staff";
          job_title: string | null;
          is_active: boolean;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name: string;
          email?: string | null;
          phone?: string | null;
          role: "admin" | "staff";
          job_title?: string | null;
          is_active?: boolean;
          avatar_url?: string | null;
        };
        Update: {
          full_name?: string;
          email?: string | null;
          phone?: string | null;
          role?: "admin" | "staff";
          job_title?: string | null;
          is_active?: boolean;
          avatar_url?: string | null;
        };
      };

      lead_sources: {
        Row: {
          id: string;
          name: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
        };
        Update: {
          name?: string;
        };
      };

      leads: {
        Row: {
          id: string;
          company_name: string;
          contact_person: string;
          phone: string | null;
          email: string | null;
          business_type: string | null;
          industry: string | null;
          address: string | null;
          city: string | null;
          state: string | null;
          source_id: string | null;
          assigned_to: string | null;
          status:
            | "new"
            | "contacted"
            | "interested"
            | "follow_up"
            | "closed_won"
            | "closed_lost";
          estimated_value: number;
          interested_plan: "cloud" | "offline" | "unknown" | null;
          next_follow_up_at: string | null;
          last_contacted_at: string | null;
          converted_customer_id: string | null;
          converted_at: string | null;
          lost_reason: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          company_name: string;
          contact_person: string;
          phone?: string | null;
          email?: string | null;
          business_type?: string | null;
          industry?: string | null;
          address?: string | null;
          city?: string | null;
          state?: string | null;
          source_id?: string | null;
          assigned_to?: string | null;
          status?:
            | "new"
            | "contacted"
            | "interested"
            | "follow_up"
            | "closed_won"
            | "closed_lost";
          estimated_value?: number;
          interested_plan?: "cloud" | "offline" | "unknown" | null;
          next_follow_up_at?: string | null;
          last_contacted_at?: string | null;
          converted_customer_id?: string | null;
          converted_at?: string | null;
          lost_reason?: string | null;
          created_by?: string | null;
        };
        Update: {
          company_name?: string;
          contact_person?: string;
          phone?: string | null;
          email?: string | null;
          business_type?: string | null;
          industry?: string | null;
          address?: string | null;
          city?: string | null;
          state?: string | null;
          source_id?: string | null;
          assigned_to?: string | null;
          status?:
            | "new"
            | "contacted"
            | "interested"
            | "follow_up"
            | "closed_won"
            | "closed_lost";
          estimated_value?: number;
          interested_plan?: "cloud" | "offline" | "unknown" | null;
          next_follow_up_at?: string | null;
          last_contacted_at?: string | null;
          converted_customer_id?: string | null;
          converted_at?: string | null;
          lost_reason?: string | null;
          created_by?: string | null;
        };
      };

      lead_notes: {
        Row: {
          id: string;
          lead_id: string;
          note: string;
          note_type: "call" | "meeting" | "whatsapp" | "email" | "general";
          follow_up_date: string | null;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          lead_id: string;
          note: string;
          note_type?: "call" | "meeting" | "whatsapp" | "email" | "general";
          follow_up_date?: string | null;
          created_by?: string | null;
        };
        Update: {
          note?: string;
          note_type?: "call" | "meeting" | "whatsapp" | "email" | "general";
          follow_up_date?: string | null;
          created_by?: string | null;
        };
      };

      activity_logs: {
        Row: {
          id: string;
          actor_id: string | null;
          entity_type: string;
          entity_id: string | null;
          action: string;
          description: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          actor_id?: string | null;
          entity_type: string;
          entity_id?: string | null;
          action: string;
          description?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["activity_logs"]["Insert"]>;
      };


      lead_activities: {
        Row: {
          id: string;
          lead_id: string;
          activity_type:
            | "created"
            | "updated"
            | "status_changed"
            | "note_added"
            | "assigned"
            | "quotation_created"
            | "converted";
          old_value: Json | null;
          new_value: Json | null;
          actor_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          lead_id: string;
          activity_type:
            | "created"
            | "updated"
            | "status_changed"
            | "note_added"
            | "assigned"
            | "quotation_created"
            | "converted";
          old_value?: Json | null;
          new_value?: Json | null;
          actor_id?: string | null;
        };
        Update: {
          activity_type?:
            | "created"
            | "updated"
            | "status_changed"
            | "note_added"
            | "assigned"
            | "quotation_created"
            | "converted";
          old_value?: Json | null;
          new_value?: Json | null;
          actor_id?: string | null;
        };
      };

      customers: {
        Row: {
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
          account_manager_id: string | null;
          lead_id: string | null;
          status: "active" | "inactive" | "suspended";
          notes: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          customer_code?: string | null;
          company_name: string;
          contact_person: string;
          phone?: string | null;
          email?: string | null;
          alternate_phone?: string | null;
          address?: string | null;
          city?: string | null;
          state?: string | null;
          industry?: string | null;
          business_type?: string | null;
          plan_type: "cloud" | "offline";
          subscription_amount?: number;
          billing_cycle?: "monthly" | "quarterly" | "yearly" | "one_time";
          setup_fee?: number;
          onboarding_date?: string | null;
          go_live_date?: string | null;
          account_manager_id?: string | null;
          lead_id?: string | null;
          status?: "active" | "inactive" | "suspended";
          notes?: string | null;
          created_by?: string | null;
        };
        Update: {
          customer_code?: string | null;
          company_name?: string;
          contact_person?: string;
          phone?: string | null;
          email?: string | null;
          alternate_phone?: string | null;
          address?: string | null;
          city?: string | null;
          state?: string | null;
          industry?: string | null;
          business_type?: string | null;
          plan_type?: "cloud" | "offline";
          subscription_amount?: number;
          billing_cycle?: "monthly" | "quarterly" | "yearly" | "one_time";
          setup_fee?: number;
          onboarding_date?: string | null;
          go_live_date?: string | null;
          account_manager_id?: string | null;
          lead_id?: string | null;
          status?: "active" | "inactive" | "suspended";
          notes?: string | null;
          created_by?: string | null;
        };
      };

      tasks: {
        Row: {
          id: string;
          title: string;
          description: string | null;
          task_type: "follow_up" | "support" | "payment" | "general" | null;
          related_lead_id: string | null;
          related_customer_id: string | null;
          assigned_to: string;
          assigned_by: string | null;
          priority: "low" | "medium" | "high" | "urgent";
          status: "pending" | "in_progress" | "completed" | "cancelled";
          due_date: string | null;
          completed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          description?: string | null;
          task_type?: "follow_up" | "support" | "payment" | "general" | null;
          related_lead_id?: string | null;
          related_customer_id?: string | null;
          assigned_to: string;
          assigned_by?: string | null;
          priority?: "low" | "medium" | "high" | "urgent";
          status?: "pending" | "in_progress" | "completed" | "cancelled";
          due_date?: string | null;
          completed_at?: string | null;
        };
        Update: {
          title?: string;
          description?: string | null;
          task_type?: "follow_up" | "support" | "payment" | "general" | null;
          related_lead_id?: string | null;
          related_customer_id?: string | null;
          assigned_to?: string;
          assigned_by?: string | null;
          priority?: "low" | "medium" | "high" | "urgent";
          status?: "pending" | "in_progress" | "completed" | "cancelled";
          due_date?: string | null;
          completed_at?: string | null;
        };
      };

            support_tickets: {
        Row: {
          id: string;
          ticket_number: string;
          customer_id: string;
          title: string;
          issue_type:
            | "hardware"
            | "software"
            | "network"
            | "training"
            | "billing"
            | "other";
          priority: "low" | "medium" | "high" | "urgent";
          status: "open" | "in_progress" | "resolved" | "closed";
          description: string | null;
          assigned_to: string | null;
          created_by: string | null;
          resolved_at: string | null;
          resolution_notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          ticket_number?: string;
          customer_id: string;
          title: string;
          issue_type:
            | "hardware"
            | "software"
            | "network"
            | "training"
            | "billing"
            | "other";
          priority?: "low" | "medium" | "high" | "urgent";
          status?: "open" | "in_progress" | "resolved" | "closed";
          description?: string | null;
          assigned_to?: string | null;
          created_by?: string | null;
          resolved_at?: string | null;
          resolution_notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          ticket_number?: string;
          customer_id?: string;
          title?: string;
          issue_type?:
            | "hardware"
            | "software"
            | "network"
            | "training"
            | "billing"
            | "other";
          priority?: "low" | "medium" | "high" | "urgent";
          status?: "open" | "in_progress" | "resolved" | "closed";
          description?: string | null;
          assigned_to?: string | null;
          created_by?: string | null;
          resolved_at?: string | null;
          resolution_notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };

      quotations: {
        Row: {
          id: string;
          quote_number: string;
          lead_id: string | null;
          customer_id: string | null;
          company_name: string;
          contact_person: string | null;
          email: string | null;
          phone: string | null;
          address: string | null;
          status: "draft" | "sent" | "accepted" | "rejected" | "expired";
          subtotal: number;
          discount: number;
          tax: number;
          total: number;
          valid_until: string | null;
          notes: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          quote_number?: string;
          lead_id?: string | null;
          customer_id?: string | null;
          company_name: string;
          contact_person?: string | null;
          email?: string | null;
          phone?: string | null;
          address?: string | null;
          status?: "draft" | "sent" | "accepted" | "rejected" | "expired";
          subtotal?: number;
          discount?: number;
          tax?: number;
          total?: number;
          valid_until?: string | null;
          notes?: string | null;
          created_by?: string | null;
        };
        Update: {
          quote_number?: string;
          lead_id?: string | null;
          customer_id?: string | null;
          company_name?: string;
          contact_person?: string | null;
          email?: string | null;
          phone?: string | null;
          address?: string | null;
          status?: "draft" | "sent" | "accepted" | "rejected" | "expired";
          subtotal?: number;
          discount?: number;
          tax?: number;
          total?: number;
          valid_until?: string | null;
          notes?: string | null;
          created_by?: string | null;
        };
      };

      assets: {
        Row: {
          id: string;
          asset_tag: string;
          serial_number: string | null;
          customer_id: string | null;
          branch_id: string | null;
          deployment_id: string | null;
          device_type: "pos_terminal" | "printer" | "scanner" | "router" | "other";
          condition: "new" | "good" | "faulty" | "under_repair" | "retired";
          status: "active" | "inactive" | "lost" | "retired";
          purchase_date: string | null;
          notes: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          asset_tag?: string;
          serial_number?: string | null;
          customer_id?: string | null;
          branch_id?: string | null;
          deployment_id?: string | null;
          device_type: "pos_terminal" | "printer" | "scanner" | "router" | "other";
          condition?: "new" | "good" | "faulty" | "under_repair" | "retired";
          status?: "active" | "inactive" | "lost" | "retired";
          purchase_date?: string | null;
          notes?: string | null;
          created_by?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["assets"]["Insert"]>;
      };


      customer_branches: {
        Row: {
          id: string;
          customer_id: string;
          branch_name: string;
          contact_person: string | null;
          phone: string | null;
          address: string | null;
          city: string | null;
          state: string | null;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          customer_id: string;
          branch_name: string;
          contact_person?: string | null;
          phone?: string | null;
          address?: string | null;
          city?: string | null;
          state?: string | null;
          is_active?: boolean;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["customer_branches"]["Insert"]>;
      };
      pos_deployments: {
        Row: {
          id: string;
          deployment_number: string;
          customer_id: string;
          branch_id: string | null;
          deployment_type:
            | "new_installation"
            | "upgrade"
            | "replacement"
            | "maintenance";
          terminal_count: number;
          deployment_status: "planned" | "in_progress" | "completed" | "cancelled";
          deployed_by: string | null;
          install_date: string | null;
          go_live_date: string | null;
          notes: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          deployment_number?: string;
          customer_id: string;
          branch_id?: string | null;
          deployment_type:
            | "new_installation"
            | "upgrade"
            | "replacement"
            | "maintenance";
          terminal_count?: number;
          deployment_status?: "planned" | "in_progress" | "completed" | "cancelled";
          deployed_by?: string | null;
          install_date?: string | null;
          go_live_date?: string | null;
          notes?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["pos_deployments"]["Insert"]>;
      };

      quotation_items: {
        Row: {
          id: string;
          quotation_id: string;
          item_name: string;
          description: string | null;
          quantity: number;
          unit_price: number;
          total_price: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          quotation_id: string;
          item_name: string;
          description?: string | null;
          quantity?: number;
          unit_price?: number;
          total_price?: number;
        };
        Update: {
          quotation_id?: string;
          item_name?: string;
          description?: string | null;
          quantity?: number;
          unit_price?: number;
          total_price?: number;
        };
      };

      payment_invoices: {
        Row: {
          id: string;
          invoice_number: string;
          customer_id: string;
          quotation_id: string | null;
          invoice_type: "setup_fee" | "subscription" | "custom";
          amount: number;
          amount_paid: number;
          balance: number;
          due_date: string;
          paid_date: string | null;
          status: "pending" | "partial" | "paid" | "overdue" | "waived";
          billing_period_start: string | null;
          billing_period_end: string | null;
          reference: string | null;
          notes: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          invoice_number?: string;
          customer_id: string;
          quotation_id?: string | null;
          invoice_type: "setup_fee" | "subscription" | "custom";
          amount: number;
          amount_paid?: number;
          due_date: string;
          paid_date?: string | null;
          status?: "pending" | "partial" | "paid" | "overdue" | "waived";
          billing_period_start?: string | null;
          billing_period_end?: string | null;
          reference?: string | null;
          notes?: string | null;
          created_by?: string | null;
        };
        Update: {
          invoice_number?: string;
          customer_id?: string;
          quotation_id?: string | null;
          invoice_type?: "setup_fee" | "subscription" | "custom";
          amount?: number;
          amount_paid?: number;
          due_date?: string;
          paid_date?: string | null;
          status?: "pending" | "partial" | "paid" | "overdue" | "waived";
          billing_period_start?: string | null;
          billing_period_end?: string | null;
          reference?: string | null;
          notes?: string | null;
          created_by?: string | null;
        };
      };

      payment_transactions: {
        Row: {
          id: string;
          invoice_id: string;
          customer_id: string;
          amount: number;
          payment_method: "cash" | "transfer" | "card" | "pos" | "other" | null;
          payment_reference: string | null;
          received_by: string | null;
          paid_at: string;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          invoice_id: string;
          customer_id: string;
          amount: number;
          payment_method?: "cash" | "transfer" | "card" | "pos" | "other" | null;
          payment_reference?: string | null;
          received_by?: string | null;
          paid_at?: string;
          notes?: string | null;
        };
        Update: {
          invoice_id?: string;
          customer_id?: string;
          amount?: number;
          payment_method?: "cash" | "transfer" | "card" | "pos" | "other" | null;
          payment_reference?: string | null;
          received_by?: string | null;
          paid_at?: string;
          notes?: string | null;
        };
      };

      receipts: {
        Row: {
          id: string;
          receipt_number: string;
          invoice_id: string | null;
          customer_id: string;
          payment_transaction_id: string | null;
          amount_received: number;
          payment_method: string | null;
          payment_date: string;
          received_by: string | null;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          receipt_number?: string;
          invoice_id?: string | null;
          customer_id: string;
          payment_transaction_id?: string | null;
          amount_received: number;
          payment_method?: string | null;
          payment_date?: string;
          received_by?: string | null;
          notes?: string | null;
        };
        Update: {
          receipt_number?: string;
          invoice_id?: string | null;
          customer_id?: string;
          payment_transaction_id?: string | null;
          amount_received?: number;
          payment_method?: string | null;
          payment_date?: string;
          received_by?: string | null;
          notes?: string | null;
        };
      };

      notifications: {
        Row: {
          id: string;
          user_id: string;
          type: "task" | "lead" | "payment" | "system" | "quotation";
          title: string;
          message: string;
          related_table: string | null;
          related_id: string | null;
          is_read: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          type: "task" | "lead" | "payment" | "system" | "quotation";
          title: string;
          message: string;
          related_table?: string | null;
          related_id?: string | null;
          is_read?: boolean;
        };
        Update: {
          user_id?: string;
          type?: "task" | "lead" | "payment" | "system" | "quotation";
          title?: string;
          message?: string;
          related_table?: string | null;
          related_id?: string | null;
          is_read?: boolean;
        };
      };

      expenses: {
        Row: {
          id: string;
          title: string;
          amount: number;
          category:
            | "operations"
            | "salaries"
            | "transport"
            | "marketing"
            | "utilities"
            | "repair_materials"
            | "other";
          expense_date: string;
          notes: string | null;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          amount: number;
          category:
            | "operations"
            | "salaries"
            | "transport"
            | "marketing"
            | "utilities"
            | "repair_materials"
            | "other";
          expense_date: string;
          notes?: string | null;
          created_by?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["expenses"]["Insert"]>;
      };

      daily_reports: {
        Row: {
          id: string;
          staff_id: string;
          report_date: string;
          summary: string;
          tasks_completed_count: number;
          leads_contacted_count: number;
          customers_supported_count: number;
          blockers: string | null;
          next_day_plan: string | null;
          submitted_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          staff_id: string;
          report_date: string;
          summary: string;
          tasks_completed_count?: number;
          leads_contacted_count?: number;
          customers_supported_count?: number;
          blockers?: string | null;
          next_day_plan?: string | null;
          submitted_at?: string;
        };
        Update: {
          staff_id?: string;
          report_date?: string;
          summary?: string;
          tasks_completed_count?: number;
          leads_contacted_count?: number;
          customers_supported_count?: number;
          blockers?: string | null;
          next_day_plan?: string | null;
          submitted_at?: string;
        };
      };
    };
  };
}

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Lead = Database["public"]["Tables"]["leads"]["Row"];
export type LeadInsert = Database["public"]["Tables"]["leads"]["Insert"];
export type LeadUpdate = Database["public"]["Tables"]["leads"]["Update"];
export type LeadNote = Database["public"]["Tables"]["lead_notes"]["Row"];
export type LeadNoteInsert = Database["public"]["Tables"]["lead_notes"]["Insert"];
export type LeadActivityInsert =
  Database["public"]["Tables"]["lead_activities"]["Insert"];
export type Quotation = Database["public"]["Tables"]["quotations"]["Row"];
export type QuotationInsert = Database["public"]["Tables"]["quotations"]["Insert"];
export type QuotationUpdate = Database["public"]["Tables"]["quotations"]["Update"];

export type QuotationItem = Database["public"]["Tables"]["quotation_items"]["Row"];
export type QuotationItemInsert =
  Database["public"]["Tables"]["quotation_items"]["Insert"];
export type QuotationItemUpdate =
  Database["public"]["Tables"]["quotation_items"]["Update"];