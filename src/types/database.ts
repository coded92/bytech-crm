export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type NotificationChannel = "email" | "in_app" | "sms";
export type NotificationEventType =
  | "customer_updates"
  | "customer_activity"
  | "project_updates"
  | "task_assignments"
  | "invoice_alerts"
  | "payment_alerts"
  | "field_job_updates"
  | "inventory_alerts"
  | "support_updates"
  | "support_tickets"
  | "system_alerts"
  | "system_maintenance"
  | "critical_alerts"
  | "mentions_comments"
  | "marketing_news";
export type NotificationDigestFrequency = "immediate" | "daily" | "weekly";
export type NotificationEmailFrequency = "instant" | "daily" | "weekly";
export type NotificationEmailFormat = "html" | "plain_text";
export type SmsDeliveryPriority = "normal" | "high" | "critical";
export type PhoneVerificationStatus = "unverified" | "pending" | "verified";
export type UserActiveSessionStatus =
  | "active"
  | "signed_out"
  | "expired"
  | "revoked";
export type UserTrustedDeviceStatus =
  | "trusted"
  | "unrecognized"
  | "review"
  | "blocked";
export type UserSecurityAlertFrequency = "instant" | "daily" | "weekly";
export type UserSecurityAlertTone = "default" | "subtle" | "urgent";
export type UserTwoFactorStatus =
  | "not_configured"
  | "pending"
  | "enabled"
  | "disabled";
export type UserRecoveryContactType = "email" | "phone";
export type UserRecoveryContactStatus = "unverified" | "pending" | "verified";
export type UserSecurityEventType =
  | "login"
  | "logout"
  | "password_reset"
  | "password_changed"
  | "profile_updated"
  | "avatar_updated"
  | "preferences_updated"
  | "notification_preferences_updated"
  | "general_settings_updated"
  | "company_settings_updated"
  | "security_settings_updated"
  | "security_questions_updated"
  | "recovery_contact_updated"
  | "two_factor_enabled"
  | "two_factor_disabled"
  | "backup_codes_generated"
  | "trusted_device_updated"
  | "login_alert_sent"
  | "unusual_signin_detected"
  | "document_branding_settings_updated"
  | "role_created"
  | "role_updated"
  | "role_deactivated"
  | "role_permission_updated"
  | "permission_set_created"
  | "permission_set_updated"
  | "team_created"
  | "team_updated"
  | "team_member_updated"
  | "invitation_created"
  | "invitation_updated"
  | "team_management_settings_updated";
export type CrmRoleType = "system" | "custom";
export type CrmAccessLevel =
  | "full_access"
  | "edit"
  | "view_only"
  | "no_access"
  | "not_applicable";
export type TeamDepartment =
  | "sales"
  | "operations"
  | "support"
  | "engineering"
  | "inventory"
  | "finance"
  | "hr";
export type TeamMemberRole = "lead" | "member";
export type UserInvitationDeliveryMethod = "email" | "link";
export type UserInvitationStatus =
  | "pending"
  | "accepted"
  | "expired"
  | "revoked";
export type TeamAutoAssignDepartmentMode =
  | "manual"
  | "profile_department"
  | "email_domain";
export type TeamApprovalWorkflow =
  | "disabled"
  | "project_invoice_approvals"
  | "all_financial_approvals"
  | "custom";
export type TeamApprovalChain =
  | "manager"
  | "department_head_admin"
  | "manager_department_head_admin"
  | "admin_only";
export type TeamDefaultMemberView = "card" | "table" | "compact";
export type TeamSettingsDateFormat =
  | "DD MMM YYYY"
  | "MM/DD/YYYY"
  | "DD/MM/YYYY"
  | "YYYY-MM-DD";
export type TeamSalaryVisibility =
  | "admins_only"
  | "admins_and_hr"
  | "admins_and_managers"
  | "hidden";
export type TeamDepartmentVisibility =
  | "all_managers"
  | "same_department"
  | "admins_only";
export type TeamDataExportPermission =
  | "admins_only"
  | "admins_and_managers"
  | "disabled";
export type TeamIntegrationStatus =
  | "not_configured"
  | "configured"
  | "disabled";

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string;
          first_name: string | null;
          last_name: string | null;
          email: string | null;
          phone: string | null;
          role: "admin" | "staff";
          department:
          | "sales"
          | "operations"
          | "support"
          | "engineering"
          | "inventory"
          | "finance"
          | "hr"
          | null;
          job_title: string | null;
          is_active: boolean;
          avatar_url: string | null;
          address: string | null;
          city: string | null;
          state: string | null;
          hire_date: string | null;
          birthday: string | null;
          employee_number: string | null;
          username: string | null;
          force_password_change: boolean;
          allowed_modules: string[];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name: string;
          first_name?: string | null;
          last_name?: string | null;
          email?: string | null;
          phone?: string | null;
          role: "admin" | "staff";
          department?:
          | "sales"
          | "operations"
          | "support"
          | "engineering"
          | "inventory"
          | "finance"
          | "hr"
          | null;
          job_title?: string | null;
          is_active?: boolean;
          avatar_url?: string | null;
          address?: string | null;
          city?: string | null;
          state?: string | null;
          hire_date?: string | null;
          birthday?: string | null;
          employee_number?: string | null;
          username?: string | null;
          force_password_change?: boolean;
          allowed_modules?: string[];
        };
        Update: {
          full_name?: string;
          first_name?: string | null;
          last_name?: string | null;
          email?: string | null;
          phone?: string | null;
          role?: "admin" | "staff";
          department?:
          | "sales"
          | "operations"
          | "support"
          | "engineering"
          | "inventory"
          | "finance"
          | "hr"
          | null;
          job_title?: string | null;
          is_active?: boolean;
          avatar_url?: string | null;
          address?: string | null;
          city?: string | null;
          state?: string | null;
          hire_date?: string | null;
          birthday?: string | null;
          employee_number?: string | null;
          username?: string | null;
          force_password_change?: boolean;
          allowed_modules?: string[];
        };
      };

      crm_roles: {
        Row: {
          id: string;
          name: string;
          slug: string;
          description: string | null;
          role_type: CrmRoleType;
          role_level: number;
          parent_role_id: string | null;
          icon: string;
          color: string;
          is_active: boolean;
          is_system: boolean;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          description?: string | null;
          role_type?: CrmRoleType;
          role_level?: number;
          parent_role_id?: string | null;
          icon?: string;
          color?: string;
          is_active?: boolean;
          is_system?: boolean;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          name?: string;
          slug?: string;
          description?: string | null;
          role_type?: CrmRoleType;
          role_level?: number;
          parent_role_id?: string | null;
          icon?: string;
          color?: string;
          is_active?: boolean;
          is_system?: boolean;
          created_by?: string | null;
          updated_at?: string;
        };
      };

      profile_roles: {
        Row: {
          id: string;
          profile_id: string;
          role_id: string;
          is_primary: boolean;
          assigned_by: string | null;
          assigned_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          profile_id: string;
          role_id: string;
          is_primary?: boolean;
          assigned_by?: string | null;
          assigned_at?: string;
          created_at?: string;
        };
        Update: {
          profile_id?: string;
          role_id?: string;
          is_primary?: boolean;
          assigned_by?: string | null;
          assigned_at?: string;
        };
      };

      teams: {
        Row: {
          id: string;
          name: string;
          slug: string;
          description: string | null;
          department: TeamDepartment | null;
          icon: string;
          color: string;
          team_lead_id: string | null;
          is_active: boolean;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          description?: string | null;
          department?: TeamDepartment | null;
          icon?: string;
          color?: string;
          team_lead_id?: string | null;
          is_active?: boolean;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          name?: string;
          slug?: string;
          description?: string | null;
          department?: TeamDepartment | null;
          icon?: string;
          color?: string;
          team_lead_id?: string | null;
          is_active?: boolean;
          created_by?: string | null;
          updated_at?: string;
        };
      };

      team_members: {
        Row: {
          id: string;
          team_id: string;
          profile_id: string;
          team_role: TeamMemberRole;
          added_by: string | null;
          joined_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          team_id: string;
          profile_id: string;
          team_role?: TeamMemberRole;
          added_by?: string | null;
          joined_at?: string;
          created_at?: string;
        };
        Update: {
          team_id?: string;
          profile_id?: string;
          team_role?: TeamMemberRole;
          added_by?: string | null;
          joined_at?: string;
        };
      };

      crm_permission_sets: {
        Row: {
          id: string;
          name: string;
          slug: string;
          description: string | null;
          icon: string;
          color: string;
          is_system: boolean;
          is_active: boolean;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          description?: string | null;
          icon?: string;
          color?: string;
          is_system?: boolean;
          is_active?: boolean;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          name?: string;
          slug?: string;
          description?: string | null;
          icon?: string;
          color?: string;
          is_system?: boolean;
          is_active?: boolean;
          created_by?: string | null;
          updated_at?: string;
        };
      };

      crm_permission_set_rules: {
        Row: {
          id: string;
          permission_set_id: string;
          module_name: string;
          access_level: CrmAccessLevel;
          can_read: boolean;
          can_create: boolean;
          can_update: boolean;
          can_delete: boolean;
          can_approve: boolean;
          can_export: boolean;
          can_admin: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          permission_set_id: string;
          module_name: string;
          access_level?: CrmAccessLevel;
          can_read?: boolean;
          can_create?: boolean;
          can_update?: boolean;
          can_delete?: boolean;
          can_approve?: boolean;
          can_export?: boolean;
          can_admin?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          permission_set_id?: string;
          module_name?: string;
          access_level?: CrmAccessLevel;
          can_read?: boolean;
          can_create?: boolean;
          can_update?: boolean;
          can_delete?: boolean;
          can_approve?: boolean;
          can_export?: boolean;
          can_admin?: boolean;
          updated_at?: string;
        };
      };

      crm_role_permission_sets: {
        Row: {
          role_id: string;
          permission_set_id: string;
          assigned_by: string | null;
          assigned_at: string;
        };
        Insert: {
          role_id: string;
          permission_set_id: string;
          assigned_by?: string | null;
          assigned_at?: string;
        };
        Update: {
          role_id?: string;
          permission_set_id?: string;
          assigned_by?: string | null;
          assigned_at?: string;
        };
      };

      crm_role_permissions: {
        Row: {
          id: string;
          role_id: string;
          module_name: string;
          access_level: CrmAccessLevel;
          can_read: boolean;
          can_create: boolean;
          can_update: boolean;
          can_delete: boolean;
          can_approve: boolean;
          can_export: boolean;
          can_admin: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          role_id: string;
          module_name: string;
          access_level?: CrmAccessLevel;
          can_read?: boolean;
          can_create?: boolean;
          can_update?: boolean;
          can_delete?: boolean;
          can_approve?: boolean;
          can_export?: boolean;
          can_admin?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          role_id?: string;
          module_name?: string;
          access_level?: CrmAccessLevel;
          can_read?: boolean;
          can_create?: boolean;
          can_update?: boolean;
          can_delete?: boolean;
          can_approve?: boolean;
          can_export?: boolean;
          can_admin?: boolean;
          updated_at?: string;
        };
      };

      user_invitations: {
        Row: {
          id: string;
          email: string;
          full_name: string;
          department: TeamDepartment | null;
          job_title: string | null;
          role_id: string | null;
          team_id: string | null;
          invite_token_hash: string | null;
          delivery_method: UserInvitationDeliveryMethod;
          status: UserInvitationStatus;
          invited_by: string | null;
          accepted_by: string | null;
          invited_at: string;
          accepted_at: string | null;
          expires_at: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          full_name: string;
          department?: TeamDepartment | null;
          job_title?: string | null;
          role_id?: string | null;
          team_id?: string | null;
          invite_token_hash?: string | null;
          delivery_method?: UserInvitationDeliveryMethod;
          status?: UserInvitationStatus;
          invited_by?: string | null;
          accepted_by?: string | null;
          invited_at?: string;
          accepted_at?: string | null;
          expires_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          email?: string;
          full_name?: string;
          department?: TeamDepartment | null;
          job_title?: string | null;
          role_id?: string | null;
          team_id?: string | null;
          invite_token_hash?: string | null;
          delivery_method?: UserInvitationDeliveryMethod;
          status?: UserInvitationStatus;
          invited_by?: string | null;
          accepted_by?: string | null;
          invited_at?: string;
          accepted_at?: string | null;
          expires_at?: string;
          updated_at?: string;
        };
      };

      team_management_settings: {
        Row: {
          id: string;
          default_role_id: string | null;
          auto_assign_department_mode: TeamAutoAssignDepartmentMode;
          invite_approval_enabled: boolean;
          team_timezone: string;
          allow_managers_invite_members: boolean;
          allow_team_leads_create_projects: boolean;
          restrict_data_access_by_department: boolean;
          role_inheritance_enabled: boolean;
          send_welcome_email: boolean;
          require_profile_completion: boolean;
          onboarding_checklist_enabled: boolean;
          default_onboarding_department: TeamDepartment | null;
          approval_workflow: TeamApprovalWorkflow;
          default_approval_chain: TeamApprovalChain;
          escalation_hours: number;
          auto_approve_admins: boolean;
          new_member_invite_alerts: boolean;
          role_change_alerts: boolean;
          department_assignment_alerts: boolean;
          member_deactivation_alerts: boolean;
          default_member_view: TeamDefaultMemberView;
          items_per_page: 10 | 20 | 25 | 50 | 100;
          date_format: TeamSettingsDateFormat;
          show_online_status: boolean;
          salary_visibility: TeamSalaryVisibility;
          department_visibility: TeamDepartmentVisibility;
          hide_inactive_members: boolean;
          data_export_permission: TeamDataExportPermission;
          directory_sync_status: TeamIntegrationStatus;
          sso_status: TeamIntegrationStatus;
          webhooks_status: TeamIntegrationStatus;
          api_access_status: TeamIntegrationStatus;
          created_by: string | null;
          updated_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          default_role_id?: string | null;
          auto_assign_department_mode?: TeamAutoAssignDepartmentMode;
          invite_approval_enabled?: boolean;
          team_timezone?: string;
          allow_managers_invite_members?: boolean;
          allow_team_leads_create_projects?: boolean;
          restrict_data_access_by_department?: boolean;
          role_inheritance_enabled?: boolean;
          send_welcome_email?: boolean;
          require_profile_completion?: boolean;
          onboarding_checklist_enabled?: boolean;
          default_onboarding_department?: TeamDepartment | null;
          approval_workflow?: TeamApprovalWorkflow;
          default_approval_chain?: TeamApprovalChain;
          escalation_hours?: number;
          auto_approve_admins?: boolean;
          new_member_invite_alerts?: boolean;
          role_change_alerts?: boolean;
          department_assignment_alerts?: boolean;
          member_deactivation_alerts?: boolean;
          default_member_view?: TeamDefaultMemberView;
          items_per_page?: 10 | 20 | 25 | 50 | 100;
          date_format?: TeamSettingsDateFormat;
          show_online_status?: boolean;
          salary_visibility?: TeamSalaryVisibility;
          department_visibility?: TeamDepartmentVisibility;
          hide_inactive_members?: boolean;
          data_export_permission?: TeamDataExportPermission;
          directory_sync_status?: TeamIntegrationStatus;
          sso_status?: TeamIntegrationStatus;
          webhooks_status?: TeamIntegrationStatus;
          api_access_status?: TeamIntegrationStatus;
          created_by?: string | null;
          updated_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          default_role_id?: string | null;
          auto_assign_department_mode?: TeamAutoAssignDepartmentMode;
          invite_approval_enabled?: boolean;
          team_timezone?: string;
          allow_managers_invite_members?: boolean;
          allow_team_leads_create_projects?: boolean;
          restrict_data_access_by_department?: boolean;
          role_inheritance_enabled?: boolean;
          send_welcome_email?: boolean;
          require_profile_completion?: boolean;
          onboarding_checklist_enabled?: boolean;
          default_onboarding_department?: TeamDepartment | null;
          approval_workflow?: TeamApprovalWorkflow;
          default_approval_chain?: TeamApprovalChain;
          escalation_hours?: number;
          auto_approve_admins?: boolean;
          new_member_invite_alerts?: boolean;
          role_change_alerts?: boolean;
          department_assignment_alerts?: boolean;
          member_deactivation_alerts?: boolean;
          default_member_view?: TeamDefaultMemberView;
          items_per_page?: 10 | 20 | 25 | 50 | 100;
          date_format?: TeamSettingsDateFormat;
          show_online_status?: boolean;
          salary_visibility?: TeamSalaryVisibility;
          department_visibility?: TeamDepartmentVisibility;
          hide_inactive_members?: boolean;
          data_export_permission?: TeamDataExportPermission;
          directory_sync_status?: TeamIntegrationStatus;
          sso_status?: TeamIntegrationStatus;
          webhooks_status?: TeamIntegrationStatus;
          api_access_status?: TeamIntegrationStatus;
          updated_by?: string | null;
          updated_at?: string;
        };
      };

      user_preferences: {
        Row: {
          user_id: string;
          theme: "light" | "dark" | "system";
          language: string;
          timezone: string;
          compact_mode: boolean;
          email_notifications: boolean;
          push_notifications: boolean;
          default_landing_page:
            | "dashboard"
            | "leads"
            | "customers"
            | "projects"
            | "field-jobs"
            | "support"
            | "inventory"
            | "payments"
            | "reports";
          items_per_page: 10 | 25 | 50 | 100;
          time_format: "12-hour" | "24-hour";
          date_format: "MM/DD/YYYY" | "DD/MM/YYYY" | "YYYY-MM-DD";
          inline_editing_enabled: boolean;
          start_of_week:
            | "sunday"
            | "monday"
            | "tuesday"
            | "wednesday"
            | "thursday"
            | "friday"
            | "saturday";
          default_view_mode: "comfortable" | "compact";
          view_density: "comfortable" | "compact" | "condensed";
          highlight_color: string;
          show_avatars: boolean;
          show_tooltips: boolean;
          auto_save_changes: boolean;
          show_productivity_tips: boolean;
          confirm_before_deleting: boolean;
          keyboard_shortcuts_enabled: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          theme?: "light" | "dark" | "system";
          language?: string;
          timezone?: string;
          compact_mode?: boolean;
          email_notifications?: boolean;
          push_notifications?: boolean;
          default_landing_page?:
            | "dashboard"
            | "leads"
            | "customers"
            | "projects"
            | "field-jobs"
            | "support"
            | "inventory"
            | "payments"
            | "reports";
          items_per_page?: 10 | 25 | 50 | 100;
          time_format?: "12-hour" | "24-hour";
          date_format?: "MM/DD/YYYY" | "DD/MM/YYYY" | "YYYY-MM-DD";
          inline_editing_enabled?: boolean;
          start_of_week?:
            | "sunday"
            | "monday"
            | "tuesday"
            | "wednesday"
            | "thursday"
            | "friday"
            | "saturday";
          default_view_mode?: "comfortable" | "compact";
          view_density?: "comfortable" | "compact" | "condensed";
          highlight_color?: string;
          show_avatars?: boolean;
          show_tooltips?: boolean;
          auto_save_changes?: boolean;
          show_productivity_tips?: boolean;
          confirm_before_deleting?: boolean;
          keyboard_shortcuts_enabled?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          theme?: "light" | "dark" | "system";
          language?: string;
          timezone?: string;
          compact_mode?: boolean;
          email_notifications?: boolean;
          push_notifications?: boolean;
          default_landing_page?:
            | "dashboard"
            | "leads"
            | "customers"
            | "projects"
            | "field-jobs"
            | "support"
            | "inventory"
            | "payments"
            | "reports";
          items_per_page?: 10 | 25 | 50 | 100;
          time_format?: "12-hour" | "24-hour";
          date_format?: "MM/DD/YYYY" | "DD/MM/YYYY" | "YYYY-MM-DD";
          inline_editing_enabled?: boolean;
          start_of_week?:
            | "sunday"
            | "monday"
            | "tuesday"
            | "wednesday"
            | "thursday"
            | "friday"
            | "saturday";
          default_view_mode?: "comfortable" | "compact";
          view_density?: "comfortable" | "compact" | "condensed";
          highlight_color?: string;
          show_avatars?: boolean;
          show_tooltips?: boolean;
          auto_save_changes?: boolean;
          show_productivity_tips?: boolean;
          confirm_before_deleting?: boolean;
          keyboard_shortcuts_enabled?: boolean;
          updated_at?: string;
        };
      };

      notification_preferences: {
        Row: {
          id: string;
          user_id: string;
          channel: NotificationChannel;
          event_type: NotificationEventType;
          enabled: boolean;
          digest_frequency: NotificationDigestFrequency | null;
          quiet_hours_enabled: boolean;
          quiet_hours_start: string | null;
          quiet_hours_end: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          channel: NotificationChannel;
          event_type: NotificationEventType;
          enabled?: boolean;
          digest_frequency?: NotificationDigestFrequency | null;
          quiet_hours_enabled?: boolean;
          quiet_hours_start?: string | null;
          quiet_hours_end?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          channel?: NotificationChannel;
          event_type?: NotificationEventType;
          enabled?: boolean;
          digest_frequency?: NotificationDigestFrequency | null;
          quiet_hours_enabled?: boolean;
          quiet_hours_start?: string | null;
          quiet_hours_end?: string | null;
          updated_at?: string;
        };
      };

      notification_channel_settings: {
        Row: {
          user_id: string;
          channel: NotificationChannel;
          email_frequency: NotificationEmailFrequency | null;
          email_format: NotificationEmailFormat | null;
          digest_summary_enabled: boolean;
          include_read_items: boolean;
          browser_notifications_enabled: boolean;
          play_sound: boolean;
          show_unread_count: boolean;
          sms_delivery_priority: SmsDeliveryPriority | null;
          quiet_hours_enabled: boolean;
          quiet_hours_start: string | null;
          quiet_hours_end: string | null;
          timezone: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          channel: NotificationChannel;
          email_frequency?: NotificationEmailFrequency | null;
          email_format?: NotificationEmailFormat | null;
          digest_summary_enabled?: boolean;
          include_read_items?: boolean;
          browser_notifications_enabled?: boolean;
          play_sound?: boolean;
          show_unread_count?: boolean;
          sms_delivery_priority?: SmsDeliveryPriority | null;
          quiet_hours_enabled?: boolean;
          quiet_hours_start?: string | null;
          quiet_hours_end?: string | null;
          timezone?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          email_frequency?: NotificationEmailFrequency | null;
          email_format?: NotificationEmailFormat | null;
          digest_summary_enabled?: boolean;
          include_read_items?: boolean;
          browser_notifications_enabled?: boolean;
          play_sound?: boolean;
          show_unread_count?: boolean;
          sms_delivery_priority?: SmsDeliveryPriority | null;
          quiet_hours_enabled?: boolean;
          quiet_hours_start?: string | null;
          quiet_hours_end?: string | null;
          timezone?: string | null;
          updated_at?: string;
        };
      };

      notification_phone_numbers: {
        Row: {
          id: string;
          user_id: string;
          phone_number: string;
          label: string;
          is_primary: boolean;
          verification_status: PhoneVerificationStatus;
          verified_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          phone_number: string;
          label?: string;
          is_primary?: boolean;
          verification_status?: PhoneVerificationStatus;
          verified_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          phone_number?: string;
          label?: string;
          is_primary?: boolean;
          verification_status?: PhoneVerificationStatus;
          verified_at?: string | null;
          updated_at?: string;
        };
      };

      user_security_events: {
        Row: {
          id: string;
          user_id: string;
          event_type: UserSecurityEventType;
          ip_address: string | null;
          user_agent: string | null;
          metadata: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          event_type: UserSecurityEventType;
          ip_address?: string | null;
          user_agent?: string | null;
          metadata?: Json | null;
          created_at?: string;
        };
        Update: never;
      };

      user_security_settings: {
        Row: {
          user_id: string;
          login_alerts_enabled: boolean;
          alert_new_device_signins: boolean;
          alert_new_location_signins: boolean;
          alert_unusual_signin_attempts: boolean;
          alert_successful_signins: boolean;
          alert_email_enabled: boolean;
          alert_sms_enabled: boolean;
          alert_frequency: UserSecurityAlertFrequency;
          alert_tone: UserSecurityAlertTone;
          password_expiry_reminder_enabled: boolean;
          session_timeout_minutes: number;
          restrict_login_by_ip: boolean;
          require_2fa_for_all_logins: boolean;
          security_questions_enabled: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          login_alerts_enabled?: boolean;
          alert_new_device_signins?: boolean;
          alert_new_location_signins?: boolean;
          alert_unusual_signin_attempts?: boolean;
          alert_successful_signins?: boolean;
          alert_email_enabled?: boolean;
          alert_sms_enabled?: boolean;
          alert_frequency?: UserSecurityAlertFrequency;
          alert_tone?: UserSecurityAlertTone;
          password_expiry_reminder_enabled?: boolean;
          session_timeout_minutes?: number;
          restrict_login_by_ip?: boolean;
          require_2fa_for_all_logins?: boolean;
          security_questions_enabled?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          login_alerts_enabled?: boolean;
          alert_new_device_signins?: boolean;
          alert_new_location_signins?: boolean;
          alert_unusual_signin_attempts?: boolean;
          alert_successful_signins?: boolean;
          alert_email_enabled?: boolean;
          alert_sms_enabled?: boolean;
          alert_frequency?: UserSecurityAlertFrequency;
          alert_tone?: UserSecurityAlertTone;
          password_expiry_reminder_enabled?: boolean;
          session_timeout_minutes?: number;
          restrict_login_by_ip?: boolean;
          require_2fa_for_all_logins?: boolean;
          security_questions_enabled?: boolean;
          updated_at?: string;
        };
      };

      user_2fa_settings: {
        Row: {
          user_id: string;
          provider: "totp";
          status: UserTwoFactorStatus;
          supabase_factor_id: string | null;
          enabled_at: string | null;
          disabled_at: string | null;
          last_verified_at: string | null;
          backup_codes_generated_at: string | null;
          backup_codes_remaining: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          provider?: "totp";
          status?: UserTwoFactorStatus;
          supabase_factor_id?: string | null;
          enabled_at?: string | null;
          disabled_at?: string | null;
          last_verified_at?: string | null;
          backup_codes_generated_at?: string | null;
          backup_codes_remaining?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          provider?: "totp";
          status?: UserTwoFactorStatus;
          supabase_factor_id?: string | null;
          enabled_at?: string | null;
          disabled_at?: string | null;
          last_verified_at?: string | null;
          backup_codes_generated_at?: string | null;
          backup_codes_remaining?: number;
          updated_at?: string;
        };
      };

      user_backup_codes: {
        Row: {
          id: string;
          user_id: string;
          code_salt: string;
          code_hash: string;
          used_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          code_salt: string;
          code_hash: string;
          used_at?: string | null;
          created_at?: string;
        };
        Update: {
          code_salt?: string;
          code_hash?: string;
          used_at?: string | null;
        };
      };

      user_recovery_contacts: {
        Row: {
          id: string;
          user_id: string;
          contact_type: UserRecoveryContactType;
          contact_value: string;
          is_primary: boolean;
          verification_status: UserRecoveryContactStatus;
          verified_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          contact_type: UserRecoveryContactType;
          contact_value: string;
          is_primary?: boolean;
          verification_status?: UserRecoveryContactStatus;
          verified_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          contact_type?: UserRecoveryContactType;
          contact_value?: string;
          is_primary?: boolean;
          verification_status?: UserRecoveryContactStatus;
          verified_at?: string | null;
          updated_at?: string;
        };
      };

      user_security_questions: {
        Row: {
          id: string;
          user_id: string;
          position: number;
          question: string;
          answer_salt: string;
          answer_hash: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          position: number;
          question: string;
          answer_salt: string;
          answer_hash: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          position?: number;
          question?: string;
          answer_salt?: string;
          answer_hash?: string;
          updated_at?: string;
        };
      };

      user_session_events: {
        Row: {
          id: string;
          user_id: string;
          session_identifier: string;
          device_type: string | null;
          browser: string | null;
          os: string | null;
          ip_address: string | null;
          location: string | null;
          event_type: "login" | "logout" | "refresh";
          last_seen_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          session_identifier: string;
          device_type?: string | null;
          browser?: string | null;
          os?: string | null;
          ip_address?: string | null;
          location?: string | null;
          event_type: "login" | "logout" | "refresh";
          last_seen_at?: string;
          created_at?: string;
        };
        Update: never;
      };

      user_active_sessions: {
        Row: {
          id: string;
          user_id: string;
          session_identifier: string;
          device_type: string | null;
          browser: string | null;
          os: string | null;
          ip_address: string | null;
          location: string | null;
          user_agent: string | null;
          status: UserActiveSessionStatus;
          trusted_status: UserTrustedDeviceStatus;
          trusted_at: string | null;
          reviewed_at: string | null;
          is_2fa_verified: boolean;
          last_2fa_verified_at: string | null;
          first_seen_at: string;
          last_seen_at: string;
          signed_out_at: string | null;
          revoked_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          session_identifier: string;
          device_type?: string | null;
          browser?: string | null;
          os?: string | null;
          ip_address?: string | null;
          location?: string | null;
          user_agent?: string | null;
          status?: UserActiveSessionStatus;
          trusted_status?: UserTrustedDeviceStatus;
          trusted_at?: string | null;
          reviewed_at?: string | null;
          is_2fa_verified?: boolean;
          last_2fa_verified_at?: string | null;
          first_seen_at?: string;
          last_seen_at?: string;
          signed_out_at?: string | null;
          revoked_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          device_type?: string | null;
          browser?: string | null;
          os?: string | null;
          ip_address?: string | null;
          location?: string | null;
          user_agent?: string | null;
          status?: UserActiveSessionStatus;
          trusted_status?: UserTrustedDeviceStatus;
          trusted_at?: string | null;
          reviewed_at?: string | null;
          is_2fa_verified?: boolean;
          last_2fa_verified_at?: string | null;
          last_seen_at?: string;
          signed_out_at?: string | null;
          revoked_at?: string | null;
          updated_at?: string;
        };
      };

      employee_files: {
        Row: {
          id: string;
          employee_id: string;
          file_name: string;
          file_url: string;
          file_type: string | null;
          uploaded_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          employee_id: string;
          file_name: string;
          file_url: string;
          file_type?: string | null;
          uploaded_by?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["employee_files"]["Insert"]>;
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
          asset_id: string | null;
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
          asset_id?: string | null;
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
          asset_id?: string | null;
          description?: string | null;
          assigned_to?: string | null;
          created_by?: string | null;
          resolved_at?: string | null;
          resolution_notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };

      asset_repair_history: {
        Row: {
          id: string;
          asset_id: string;
          support_ticket_id: string | null;
          repair_title: string;
          repair_type: "inspection" | "repair" | "replacement" | "maintenance" | "other";
          repair_status: "pending" | "in_progress" | "completed" | "cancelled";
          technician_id: string | null;
          cost: number;
          notes: string | null;
          repair_date: string;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          asset_id: string;
          support_ticket_id?: string | null;
          repair_title: string;
          repair_type: "inspection" | "repair" | "replacement" | "maintenance" | "other";
          repair_status?: "pending" | "in_progress" | "completed" | "cancelled";
          technician_id?: string | null;
          cost?: number;
          notes?: string | null;
          repair_date?: string;
          created_by?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["asset_repair_history"]["Insert"]>;
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
          supplier_id: string | null;
          restock_order_id: string | null;
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
          supplier_id: string | null;
          restock_order_id: string | null;
          expense_date: string;
          notes?: string | null;
          created_by?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["expenses"]["Insert"]>;
      };

      company_settings: {
        Row: {
          id: string;
          company_name: string;
          brand_name: string | null;
          email: string | null;
          phone: string | null;
          website: string | null;
          address: string | null;
          city: string | null;
          state: string | null;
          country: string | null;
          logo_url: string | null;
          currency_symbol: string;
          document_footer: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          company_name: string;
          brand_name?: string | null;
          email?: string | null;
          phone?: string | null;
          website?: string | null;
          address?: string | null;
          city?: string | null;
          state?: string | null;
          country?: string | null;
          logo_url?: string | null;
          currency_symbol?: string;
          document_footer?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["company_settings"]["Insert"]>;
      };

      document_branding_settings: {
        Row: {
          id: string;
          tagline: string | null;
          primary_brand_color: string;
          secondary_brand_color: string | null;
          show_logo_on_documents: boolean;
          invoice_number_prefix: string;
          invoice_title: string;
          invoice_default_due_days: number;
          invoice_date_format: "MM/DD/YYYY" | "DD/MM/YYYY" | "YYYY-MM-DD";
          invoice_show_title: boolean;
          invoice_show_invoice_date: boolean;
          invoice_show_due_date: boolean;
          invoice_show_company_logo: boolean;
          invoice_show_company_address: boolean;
          invoice_show_company_email_phone: boolean;
          invoice_show_customer_address: boolean;
          invoice_show_item_descriptions: boolean;
          invoice_show_item_quantity: boolean;
          invoice_show_item_unit_price: boolean;
          invoice_show_line_total: boolean;
          invoice_show_subtotal: boolean;
          invoice_show_tax: boolean;
          invoice_show_discounts: boolean;
          invoice_show_grand_total: boolean;
          invoice_paid_label: string;
          invoice_unpaid_label: string;
          invoice_overdue_label: string;
          quotation_number_prefix: string;
          quotation_title: string;
          quotation_default_validity_days: number;
          quotation_date_format: "MM/DD/YYYY" | "DD/MM/YYYY" | "YYYY-MM-DD";
          quotation_show_title: boolean;
          quotation_show_quotation_date: boolean;
          quotation_show_expiry_date: boolean;
          quotation_show_company_logo: boolean;
          quotation_show_company_address: boolean;
          quotation_show_company_email_phone: boolean;
          quotation_show_customer_address: boolean;
          quotation_show_item_descriptions: boolean;
          quotation_show_item_quantity: boolean;
          quotation_show_item_unit_price: boolean;
          quotation_show_line_total: boolean;
          quotation_show_subtotal: boolean;
          quotation_show_tax: boolean;
          quotation_show_discounts: boolean;
          quotation_show_grand_total: boolean;
          quotation_draft_label: string;
          quotation_sent_label: string;
          quotation_accepted_label: string;
          quotation_expired_label: string;
          receipt_number_prefix: string;
          receipt_title: string;
          receipt_default_validity_days: number;
          receipt_date_format: "MM/DD/YYYY" | "DD/MM/YYYY" | "YYYY-MM-DD";
          receipt_show_title: boolean;
          receipt_show_receipt_date: boolean;
          receipt_show_payment_date: boolean;
          receipt_show_company_logo: boolean;
          receipt_show_company_address: boolean;
          receipt_show_company_email_phone: boolean;
          receipt_show_customer_address: boolean;
          receipt_show_payment_method: boolean;
          receipt_show_item_descriptions: boolean;
          receipt_show_item_quantity: boolean;
          receipt_show_item_unit_price: boolean;
          receipt_show_subtotal: boolean;
          receipt_show_tax: boolean;
          receipt_show_discounts: boolean;
          receipt_show_grand_total: boolean;
          receipt_paid_label: string;
          receipt_partial_label: string;
          receipt_refunded_label: string;
          receipt_cancelled_label: string;
          default_footer_text: string | null;
          invoice_footer_text: string | null;
          quotation_footer_text: string | null;
          receipt_footer_text: string | null;
          terms_conditions: string | null;
          payment_instructions: string | null;
          show_footer_on_documents: boolean;
          show_terms_conditions: boolean;
          show_signature_block: boolean;
          show_page_numbers: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          tagline?: string | null;
          primary_brand_color?: string;
          secondary_brand_color?: string | null;
          show_logo_on_documents?: boolean;
          invoice_number_prefix?: string;
          invoice_title?: string;
          invoice_default_due_days?: number;
          invoice_date_format?: "MM/DD/YYYY" | "DD/MM/YYYY" | "YYYY-MM-DD";
          invoice_show_title?: boolean;
          invoice_show_invoice_date?: boolean;
          invoice_show_due_date?: boolean;
          invoice_show_company_logo?: boolean;
          invoice_show_company_address?: boolean;
          invoice_show_company_email_phone?: boolean;
          invoice_show_customer_address?: boolean;
          invoice_show_item_descriptions?: boolean;
          invoice_show_item_quantity?: boolean;
          invoice_show_item_unit_price?: boolean;
          invoice_show_line_total?: boolean;
          invoice_show_subtotal?: boolean;
          invoice_show_tax?: boolean;
          invoice_show_discounts?: boolean;
          invoice_show_grand_total?: boolean;
          invoice_paid_label?: string;
          invoice_unpaid_label?: string;
          invoice_overdue_label?: string;
          quotation_number_prefix?: string;
          quotation_title?: string;
          quotation_default_validity_days?: number;
          quotation_date_format?: "MM/DD/YYYY" | "DD/MM/YYYY" | "YYYY-MM-DD";
          quotation_show_title?: boolean;
          quotation_show_quotation_date?: boolean;
          quotation_show_expiry_date?: boolean;
          quotation_show_company_logo?: boolean;
          quotation_show_company_address?: boolean;
          quotation_show_company_email_phone?: boolean;
          quotation_show_customer_address?: boolean;
          quotation_show_item_descriptions?: boolean;
          quotation_show_item_quantity?: boolean;
          quotation_show_item_unit_price?: boolean;
          quotation_show_line_total?: boolean;
          quotation_show_subtotal?: boolean;
          quotation_show_tax?: boolean;
          quotation_show_discounts?: boolean;
          quotation_show_grand_total?: boolean;
          quotation_draft_label?: string;
          quotation_sent_label?: string;
          quotation_accepted_label?: string;
          quotation_expired_label?: string;
          receipt_number_prefix?: string;
          receipt_title?: string;
          receipt_default_validity_days?: number;
          receipt_date_format?: "MM/DD/YYYY" | "DD/MM/YYYY" | "YYYY-MM-DD";
          receipt_show_title?: boolean;
          receipt_show_receipt_date?: boolean;
          receipt_show_payment_date?: boolean;
          receipt_show_company_logo?: boolean;
          receipt_show_company_address?: boolean;
          receipt_show_company_email_phone?: boolean;
          receipt_show_customer_address?: boolean;
          receipt_show_payment_method?: boolean;
          receipt_show_item_descriptions?: boolean;
          receipt_show_item_quantity?: boolean;
          receipt_show_item_unit_price?: boolean;
          receipt_show_subtotal?: boolean;
          receipt_show_tax?: boolean;
          receipt_show_discounts?: boolean;
          receipt_show_grand_total?: boolean;
          receipt_paid_label?: string;
          receipt_partial_label?: string;
          receipt_refunded_label?: string;
          receipt_cancelled_label?: string;
          default_footer_text?: string | null;
          invoice_footer_text?: string | null;
          quotation_footer_text?: string | null;
          receipt_footer_text?: string | null;
          terms_conditions?: string | null;
          payment_instructions?: string | null;
          show_footer_on_documents?: boolean;
          show_terms_conditions?: boolean;
          show_signature_block?: boolean;
          show_page_numbers?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["document_branding_settings"]["Insert"]
        >;
      };

      field_jobs: {
        Row: {
          id: string;
          job_number: string;
          customer_id: string;
          branch_id: string | null;
          asset_id: string | null;
          support_ticket_id: string | null;
          title: string;
          job_type:
            | "wiring_repair"
            | "hardware_repair"
            | "site_inspection"
            | "site_survey"
            | "site_assessment"
            | "installation"
            | "maintenance_visit"
            | "device_replacement"
            | "network_troubleshooting"
            | "training_visit"
            | "other";
          priority: "low" | "medium" | "high" | "urgent";
          status:
            | "pending"
            | "assigned"
            | "in_progress"
            | "awaiting_parts"
            | "completed"
            | "cancelled";
          assigned_engineer_id: string | null;
          scheduled_date: string | null;
          started_at: string | null;
          completed_at: string | null;
          reported_issue: string | null;
          work_done: string | null;
          materials_used: string | null;
          recommendation: string | null;
          customer_feedback: string | null;
          checked_in_at: string | null;
          work_started_at: string | null;
          work_completed_at: string | null;
          checked_out_at: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          job_number?: string;
          customer_id: string;
          branch_id?: string | null;
          asset_id?: string | null;
          support_ticket_id?: string | null;
          title: string;
          job_type:
            | "wiring_repair"
            | "hardware_repair"
            | "site_inspection"
            | "site_survey"
            | "site_assessment"
            | "installation"
            | "maintenance_visit"
            | "device_replacement"
            | "network_troubleshooting"
            | "training_visit"
            | "other";
          priority?: "low" | "medium" | "high" | "urgent";
          status?:
            | "pending"
            | "assigned"
            | "in_progress"
            | "awaiting_parts"
            | "completed"
            | "cancelled";
          assigned_engineer_id?: string | null;
          scheduled_date?: string | null;
          started_at?: string | null;
          completed_at?: string | null;
          reported_issue?: string | null;
          work_done?: string | null;
          materials_used?: string | null;
          recommendation?: string | null;
          customer_feedback?: string | null;
          checked_in_at?: string | null;
          work_started_at: string | null;
          work_completed_at: string | null;
          checked_out_at: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["field_jobs"]["Insert"]>;
      };

      field_job_inventory_usage: {
        Row: {
          id: string;
          field_job_id: string;
          inventory_item_id: string;
          quantity: number;
          unit_cost: number;
          total_cost: number;
          notes: string | null;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          field_job_id: string;
          inventory_item_id: string;
          quantity: number;
          unit_cost?: number;
          notes?: string | null;
          created_by?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["field_job_inventory_usage"]["Insert"]>;
      };

      field_job_photos: {
        Row: {
          id: string;
          field_job_id: string;
          photo_type: "before" | "after" | "inspection" | "materials" | "other";
          file_attachment_id: string | null;
          caption: string | null;
          uploaded_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          field_job_id: string;
          photo_type: "before" | "after" | "inspection" | "materials" | "other";
          file_attachment_id?: string | null;
          caption?: string | null;
          uploaded_by?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["field_job_photos"]["Insert"]>;
      };
      field_job_updates: {
        Row: {
          id: string;
          field_job_id: string;
          note: string;
          status:
            | "pending"
            | "assigned"
            | "in_progress"
            | "awaiting_parts"
            | "completed"
            | "cancelled"
            | null;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          field_job_id: string;
          note: string;
          status?:
            | "pending"
            | "assigned"
            | "in_progress"
            | "awaiting_parts"
            | "completed"
            | "cancelled"
            | null;
          created_by?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["field_job_updates"]["Insert"]>;
      };

      suppliers: {
        Row: {
          id: string;
          supplier_code: string;
          company_name: string;
          contact_person: string | null;
          email: string | null;
          phone: string | null;
          address: string | null;
          city: string | null;
          state: string | null;
          notes: string | null;
          is_active: boolean;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          supplier_code?: string;
          company_name: string;
          contact_person?: string | null;
          email?: string | null;
          phone?: string | null;
          address?: string | null;
          city?: string | null;
          state?: string | null;
          notes?: string | null;
          is_active?: boolean;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["suppliers"]["Insert"]>;
      };
      inventory_restock_orders: {
        Row: {
          id: string;
          restock_number: string;
          supplier_id: string | null;
          status: "draft" | "ordered" | "received" | "cancelled";
          paid_amount: number;
          payment_status: "unpaid" | "part_paid" | "paid";
          order_date: string;
          expected_date: string | null;
          received_date: string | null;
          reference: string | null;
          notes: string | null;
          total_amount: number;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          restock_number?: string;
          supplier_id?: string | null;
          status?: "draft" | "ordered" | "received" | "cancelled";
          paid_amount: number;
          payment_status: "unpaid" | "part_paid" | "paid";
          order_date?: string;
          expected_date?: string | null;
          received_date?: string | null;
          reference?: string | null;
          notes?: string | null;
          total_amount?: number;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["inventory_restock_orders"]["Insert"]>;
      };
      inventory_restock_order_items: {
        Row: {
          id: string;
          restock_order_id: string;
          inventory_item_id: string;
          quantity: number;
          unit_cost: number;
          total_cost: number;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          restock_order_id: string;
          inventory_item_id: string;
          quantity: number;
          unit_cost?: number;
          notes?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["inventory_restock_order_items"]["Insert"]>;
      };

      inventory_items: {
        Row: {
          id: string;
          item_code: string;
          item_name: string;
          category:
            | "cables"
            | "printer_parts"
            | "network_devices"
            | "accessories"
            | "spare_parts"
            | "tools"
            | "consumables"
            | "other";
          sku: string | null;
          unit: string;
          current_quantity: number;
          minimum_quantity: number;
          unit_cost: number;
          notes: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          item_code?: string;
          item_name: string;
          category:
            | "cables"
            | "printer_parts"
            | "network_devices"
            | "accessories"
            | "spare_parts"
            | "tools"
            | "consumables"
            | "other";
          sku?: string | null;
          unit?: string;
          current_quantity?: number;
          minimum_quantity?: number;
          unit_cost?: number;
          notes?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["inventory_items"]["Insert"]>;
      };
      inventory_movements: {
        Row: {
          id: string;
          inventory_item_id: string;
          movement_type: "stock_in" | "stock_out" | "adjustment";
          quantity: number;
          unit_cost: number | null;
          field_job_id: string | null;
          note: string | null;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          inventory_item_id: string;
          movement_type: "stock_in" | "stock_out" | "adjustment";
          quantity: number;
          unit_cost?: number | null;
          field_job_id?: string | null;
          note?: string | null;
          created_by?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["inventory_movements"]["Insert"]>;
      };

      field_job_materials: {
        Row: {
          id: string;
          field_job_id: string;
          item_name: string;
          quantity: number;
          unit: string | null;
          unit_cost: number;
          total_cost: number;
          notes: string | null;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          field_job_id: string;
          item_name: string;
          quantity?: number;
          unit?: string | null;
          unit_cost?: number;
          notes?: string | null;
          created_by?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["field_job_materials"]["Insert"]>;
      };

      file_attachments: {
        Row: {
          id: string;
          related_table: string;
          related_id: string;
          bucket_name: string;
          file_path: string;
          file_name: string;
          mime_type: string | null;
          file_size: number | null;
          uploaded_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          related_table: string;
          related_id: string;
          bucket_name: string;
          file_path: string;
          file_name: string;
          mime_type?: string | null;
          file_size?: number | null;
          uploaded_by?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["file_attachments"]["Insert"]>;
      };

            projects: {
        Row: {
          id: string;
          project_code: string;
          project_name: string;
          customer_id: string | null;
          lead_id: string | null;
          quotation_id: string | null;
          invoice_id: string | null;
          receipt_id: string | null;
          project_type:
            | "website_development"
            | "pos_deployment"
            | "crm_setup"
            | "digital_marketing"
            | "networking_infrastructure"
            | "maintenance"
            | "custom_software"
            | "other";
          description: string | null;
          project_manager_id: string | null;
          start_date: string | null;
          deadline: string | null;
          priority: "low" | "medium" | "high" | "urgent";
          status:
            | "proposal"
            | "approved"
            | "paid"
            | "planning"
            | "in_progress"
            | "review"
            | "completed"
            | "maintenance"
            | "on_hold"
            | "cancelled";
          quotation_amount: number;
          amount_paid: number;
          outstanding_balance: number;
          payment_status: "unpaid" | "part_payment" | "paid_in_full";
          invoice_number: string | null;
          receipt_number: string | null;
          recurring_revenue: boolean;
          annual_renewal_amount: number;
          next_renewal_date: string | null;
          project_cost_estimate: number;
          profit_estimate: number;
          progress: number;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          project_code?: string;
          project_name: string;
          customer_id?: string | null;
          lead_id?: string | null;
          quotation_id?: string | null;
          invoice_id?: string | null;
          receipt_id?: string | null;
          project_type:
            | "website_development"
            | "pos_deployment"
            | "crm_setup"
            | "digital_marketing"
            | "networking_infrastructure"
            | "maintenance"
            | "custom_software"
            | "other";
          description?: string | null;
          project_manager_id?: string | null;
          start_date?: string | null;
          deadline?: string | null;
          priority?: "low" | "medium" | "high" | "urgent";
          status?:
            | "proposal"
            | "approved"
            | "paid"
            | "planning"
            | "in_progress"
            | "review"
            | "completed"
            | "maintenance"
            | "on_hold"
            | "cancelled";
          quotation_amount?: number;
          amount_paid?: number;
          payment_status?: "unpaid" | "part_payment" | "paid_in_full";
          invoice_number?: string | null;
          receipt_number?: string | null;
          recurring_revenue?: boolean;
          annual_renewal_amount?: number;
          next_renewal_date?: string | null;
          project_cost_estimate?: number;
          progress?: number;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["projects"]["Insert"]>;
      };

      project_members: {
        Row: {
          id: string;
          project_id: string;
          staff_id: string;
          role: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          staff_id: string;
          role?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["project_members"]["Insert"]>;
      };

      project_tasks: {
        Row: {
          id: string;
          project_id: string;
          title: string;
          description: string | null;
          assigned_to: string | null;
          status: "todo" | "in_progress" | "review" | "completed" | "blocked" | "cancelled";
          priority: "low" | "medium" | "high" | "urgent";
          due_date: string | null;
          completed_at: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          title: string;
          description?: string | null;
          assigned_to?: string | null;
          status?: "todo" | "in_progress" | "review" | "completed" | "blocked" | "cancelled";
          priority?: "low" | "medium" | "high" | "urgent";
          due_date?: string | null;
          completed_at?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["project_tasks"]["Insert"]>;
      };

      project_task_checklists: {
        Row: {
          id: string;
          task_id: string;
          title: string;
          is_done: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          task_id: string;
          title: string;
          is_done?: boolean;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["project_task_checklists"]["Insert"]>;
      };

      project_task_comments: {
        Row: {
          id: string;
          task_id: string;
          comment: string;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          task_id: string;
          comment: string;
          created_by?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["project_task_comments"]["Insert"]>;
      };

      project_timeline: {
        Row: {
          id: string;
          project_id: string;
          timeline_type: string;
          title: string;
          note: string | null;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          timeline_type?: string;
          title: string;
          note?: string | null;
          created_by?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["project_timeline"]["Insert"]>;
      };

      project_templates: {
        Row: {
          id: string;
          name: string;
          project_type:
            | "website_development"
            | "pos_deployment"
            | "crm_setup"
            | "digital_marketing"
            | "networking_infrastructure"
            | "maintenance"
            | "custom_software"
            | "other";
          description: string | null;
          default_tasks: Json;
          is_active: boolean;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          project_type:
            | "website_development"
            | "pos_deployment"
            | "crm_setup"
            | "digital_marketing"
            | "networking_infrastructure"
            | "maintenance"
            | "custom_software"
            | "other";
          description?: string | null;
          default_tasks?: Json;
          is_active?: boolean;
          created_by?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["project_templates"]["Insert"]>;
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
export type ProfileUpdate = Database["public"]["Tables"]["profiles"]["Update"];
export type CrmRole = Database["public"]["Tables"]["crm_roles"]["Row"];
export type CrmRoleInsert =
  Database["public"]["Tables"]["crm_roles"]["Insert"];
export type CrmRoleUpdate =
  Database["public"]["Tables"]["crm_roles"]["Update"];
export type ProfileRole =
  Database["public"]["Tables"]["profile_roles"]["Row"];
export type ProfileRoleInsert =
  Database["public"]["Tables"]["profile_roles"]["Insert"];
export type Team = Database["public"]["Tables"]["teams"]["Row"];
export type TeamInsert = Database["public"]["Tables"]["teams"]["Insert"];
export type TeamUpdate = Database["public"]["Tables"]["teams"]["Update"];
export type TeamMember =
  Database["public"]["Tables"]["team_members"]["Row"];
export type TeamMemberInsert =
  Database["public"]["Tables"]["team_members"]["Insert"];
export type TeamMemberUpdate =
  Database["public"]["Tables"]["team_members"]["Update"];
export type CrmPermissionSet =
  Database["public"]["Tables"]["crm_permission_sets"]["Row"];
export type CrmPermissionSetInsert =
  Database["public"]["Tables"]["crm_permission_sets"]["Insert"];
export type CrmPermissionSetUpdate =
  Database["public"]["Tables"]["crm_permission_sets"]["Update"];
export type CrmPermissionSetRule =
  Database["public"]["Tables"]["crm_permission_set_rules"]["Row"];
export type CrmPermissionSetRuleInsert =
  Database["public"]["Tables"]["crm_permission_set_rules"]["Insert"];
export type CrmPermissionSetRuleUpdate =
  Database["public"]["Tables"]["crm_permission_set_rules"]["Update"];
export type CrmRolePermissionSet =
  Database["public"]["Tables"]["crm_role_permission_sets"]["Row"];
export type CrmRolePermission =
  Database["public"]["Tables"]["crm_role_permissions"]["Row"];
export type CrmRolePermissionInsert =
  Database["public"]["Tables"]["crm_role_permissions"]["Insert"];
export type CrmRolePermissionUpdate =
  Database["public"]["Tables"]["crm_role_permissions"]["Update"];
export type UserInvitation =
  Database["public"]["Tables"]["user_invitations"]["Row"];
export type UserInvitationInsert =
  Database["public"]["Tables"]["user_invitations"]["Insert"];
export type UserInvitationUpdate =
  Database["public"]["Tables"]["user_invitations"]["Update"];
export type TeamManagementSettings =
  Database["public"]["Tables"]["team_management_settings"]["Row"];
export type TeamManagementSettingsInsert =
  Database["public"]["Tables"]["team_management_settings"]["Insert"];
export type TeamManagementSettingsUpdate =
  Database["public"]["Tables"]["team_management_settings"]["Update"];
export type UserPreferences =
  Database["public"]["Tables"]["user_preferences"]["Row"];
export type UserPreferencesInsert =
  Database["public"]["Tables"]["user_preferences"]["Insert"];
export type UserPreferencesUpdate =
  Database["public"]["Tables"]["user_preferences"]["Update"];
export type NotificationPreference =
  Database["public"]["Tables"]["notification_preferences"]["Row"];
export type NotificationPreferenceInsert =
  Database["public"]["Tables"]["notification_preferences"]["Insert"];
export type NotificationPreferenceUpdate =
  Database["public"]["Tables"]["notification_preferences"]["Update"];
export type NotificationChannelSettings =
  Database["public"]["Tables"]["notification_channel_settings"]["Row"];
export type NotificationChannelSettingsInsert =
  Database["public"]["Tables"]["notification_channel_settings"]["Insert"];
export type NotificationChannelSettingsUpdate =
  Database["public"]["Tables"]["notification_channel_settings"]["Update"];
export type NotificationPhoneNumber =
  Database["public"]["Tables"]["notification_phone_numbers"]["Row"];
export type NotificationPhoneNumberInsert =
  Database["public"]["Tables"]["notification_phone_numbers"]["Insert"];
export type NotificationPhoneNumberUpdate =
  Database["public"]["Tables"]["notification_phone_numbers"]["Update"];
export type DocumentBrandingSettings =
  Database["public"]["Tables"]["document_branding_settings"]["Row"];
export type DocumentBrandingSettingsInsert =
  Database["public"]["Tables"]["document_branding_settings"]["Insert"];
export type DocumentBrandingSettingsUpdate =
  Database["public"]["Tables"]["document_branding_settings"]["Update"];
export type UserSecurityEvent =
  Database["public"]["Tables"]["user_security_events"]["Row"];
export type UserSecurityEventInsert =
  Database["public"]["Tables"]["user_security_events"]["Insert"];
export type UserSecuritySettings =
  Database["public"]["Tables"]["user_security_settings"]["Row"];
export type UserSecuritySettingsInsert =
  Database["public"]["Tables"]["user_security_settings"]["Insert"];
export type UserSecuritySettingsUpdate =
  Database["public"]["Tables"]["user_security_settings"]["Update"];
export type UserTwoFactorSettings =
  Database["public"]["Tables"]["user_2fa_settings"]["Row"];
export type UserTwoFactorSettingsInsert =
  Database["public"]["Tables"]["user_2fa_settings"]["Insert"];
export type UserTwoFactorSettingsUpdate =
  Database["public"]["Tables"]["user_2fa_settings"]["Update"];
export type UserBackupCode =
  Database["public"]["Tables"]["user_backup_codes"]["Row"];
export type UserBackupCodeInsert =
  Database["public"]["Tables"]["user_backup_codes"]["Insert"];
export type UserBackupCodeUpdate =
  Database["public"]["Tables"]["user_backup_codes"]["Update"];
export type UserRecoveryContact =
  Database["public"]["Tables"]["user_recovery_contacts"]["Row"];
export type UserRecoveryContactInsert =
  Database["public"]["Tables"]["user_recovery_contacts"]["Insert"];
export type UserRecoveryContactUpdate =
  Database["public"]["Tables"]["user_recovery_contacts"]["Update"];
export type UserSecurityQuestion =
  Database["public"]["Tables"]["user_security_questions"]["Row"];
export type UserSecurityQuestionInsert =
  Database["public"]["Tables"]["user_security_questions"]["Insert"];
export type UserSecurityQuestionUpdate =
  Database["public"]["Tables"]["user_security_questions"]["Update"];
export type UserSessionEvent =
  Database["public"]["Tables"]["user_session_events"]["Row"];
export type UserSessionEventInsert =
  Database["public"]["Tables"]["user_session_events"]["Insert"];
export type UserActiveSession =
  Database["public"]["Tables"]["user_active_sessions"]["Row"];
export type UserActiveSessionInsert =
  Database["public"]["Tables"]["user_active_sessions"]["Insert"];
export type UserActiveSessionUpdate =
  Database["public"]["Tables"]["user_active_sessions"]["Update"];
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
export type EmployeeFile = Database["public"]["Tables"]["employee_files"]["Row"];
export type EmployeeFileInsert =
  Database["public"]["Tables"]["employee_files"]["Insert"];
export type EmployeeFileUpdate =
  Database["public"]["Tables"]["employee_files"]["Update"];
export type Project = Database["public"]["Tables"]["projects"]["Row"];
export type ProjectInsert = Database["public"]["Tables"]["projects"]["Insert"];
export type ProjectUpdate = Database["public"]["Tables"]["projects"]["Update"];

export type ProjectMember = Database["public"]["Tables"]["project_members"]["Row"];
export type ProjectMemberInsert =
  Database["public"]["Tables"]["project_members"]["Insert"];

export type ProjectTask = Database["public"]["Tables"]["project_tasks"]["Row"];
export type ProjectTaskInsert =
  Database["public"]["Tables"]["project_tasks"]["Insert"];
export type ProjectTaskUpdate =
  Database["public"]["Tables"]["project_tasks"]["Update"];

export type ProjectTimeline =
  Database["public"]["Tables"]["project_timeline"]["Row"];
export type ProjectTimelineInsert =
  Database["public"]["Tables"]["project_timeline"]["Insert"];

export type ProjectTemplate =
  Database["public"]["Tables"]["project_templates"]["Row"];
