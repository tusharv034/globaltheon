export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      affiliate_notes: {
        Row: {
          affiliate_id: string
          created_at: string
          created_by: string
          id: string
          metadata: Json | null
          note_text: string
          note_type: string
          updated_at: string
        }
        Insert: {
          affiliate_id: string
          created_at?: string
          created_by: string
          id?: string
          metadata?: Json | null
          note_text: string
          note_type?: string
          updated_at?: string
        }
        Update: {
          affiliate_id?: string
          created_at?: string
          created_by?: string
          id?: string
          metadata?: Json | null
          note_text?: string
          note_type?: string
          updated_at?: string
        }
        Relationships: []
      }
      affiliates: {
        Row: {
          address: string | null
          address2: string | null
          affiliate_id: string
          allow_automatic_chargebacks: boolean
          auth_user_id: string | null
          city: string | null
          country: string | null
          created_at: string
          deleted_at: string | null
          deleted_by: string | null
          email: string
          email_opted_out: boolean
          email_opted_out_at: string | null
          enrolled_by: string | null
          first_name: string
          id: string
          kyc_approved_at: string | null
          kyc_data: Json | null
          kyc_pass: boolean
          kyc_rejection_reason: string | null
          kyc_submitted_at: string | null
          last_name: string
          phone: string | null
          phone_numbers: Json | null
          postal_code: string | null
          rank: string | null
          site_name: string | null
          state_province: string | null
          status: string
          status_change_reason: string | null
          status_changed_at: string | null
          status_changed_by: string | null
          tax_id: string | null
          teqnavi_enabled: boolean | null
          tipalti_enabled: boolean | null
          total_commissions: number | null
          total_sales: number | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          address2?: string | null
          affiliate_id: string
          allow_automatic_chargebacks?: boolean
          auth_user_id?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          deleted_at?: string | null
          deleted_by?: string | null
          email: string
          email_opted_out?: boolean
          email_opted_out_at?: string | null
          enrolled_by?: string | null
          first_name: string
          id?: string
          kyc_approved_at?: string | null
          kyc_data?: Json | null
          kyc_pass?: boolean
          kyc_rejection_reason?: string | null
          kyc_submitted_at?: string | null
          last_name: string
          phone?: string | null
          phone_numbers?: Json | null
          postal_code?: string | null
          rank?: string | null
          site_name?: string | null
          state_province?: string | null
          status?: string
          status_change_reason?: string | null
          status_changed_at?: string | null
          status_changed_by?: string | null
          tax_id?: string | null
          teqnavi_enabled?: boolean | null
          tipalti_enabled?: boolean | null
          total_commissions?: number | null
          total_sales?: number | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          address2?: string | null
          affiliate_id?: string
          allow_automatic_chargebacks?: boolean
          auth_user_id?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          deleted_at?: string | null
          deleted_by?: string | null
          email?: string
          email_opted_out?: boolean
          email_opted_out_at?: string | null
          enrolled_by?: string | null
          first_name?: string
          id?: string
          kyc_approved_at?: string | null
          kyc_data?: Json | null
          kyc_pass?: boolean
          kyc_rejection_reason?: string | null
          kyc_submitted_at?: string | null
          last_name?: string
          phone?: string | null
          phone_numbers?: Json | null
          postal_code?: string | null
          rank?: string | null
          site_name?: string | null
          state_province?: string | null
          status?: string
          status_change_reason?: string | null
          status_changed_at?: string | null
          status_changed_by?: string | null
          tax_id?: string | null
          teqnavi_enabled?: boolean | null
          tipalti_enabled?: boolean | null
          total_commissions?: number | null
          total_sales?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "affiliates_enrolled_by_fkey"
            columns: ["enrolled_by"]
            isOneToOne: false
            referencedRelation: "affiliates"
            referencedColumns: ["id"]
          },
        ]
      }
      announcements: {
        Row: {
          announcement_type: string
          content: string
          created_at: string
          created_by: string
          end_date: string | null
          id: string
          is_active: boolean
          requires_completion: boolean
          show_once: boolean
          start_date: string | null
          target_role: string
          title: string
          updated_at: string
        }
        Insert: {
          announcement_type?: string
          content: string
          created_at?: string
          created_by: string
          end_date?: string | null
          id?: string
          is_active?: boolean
          requires_completion?: boolean
          show_once?: boolean
          start_date?: string | null
          target_role?: string
          title: string
          updated_at?: string
        }
        Update: {
          announcement_type?: string
          content?: string
          created_at?: string
          created_by?: string
          end_date?: string | null
          id?: string
          is_active?: boolean
          requires_completion?: boolean
          show_once?: boolean
          start_date?: string | null
          target_role?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      commission_period_adjustments: {
        Row: {
          adjustment_amount: number
          affiliate_id: string
          created_at: string
          created_by: string
          id: string
          period_id: string
          reason: string
          updated_at: string
        }
        Insert: {
          adjustment_amount: number
          affiliate_id: string
          created_at?: string
          created_by: string
          id?: string
          period_id: string
          reason: string
          updated_at?: string
        }
        Update: {
          adjustment_amount?: number
          affiliate_id?: string
          created_at?: string
          created_by?: string
          id?: string
          period_id?: string
          reason?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "commission_period_adjustments_affiliate_id_fkey"
            columns: ["affiliate_id"]
            isOneToOne: false
            referencedRelation: "affiliates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commission_period_adjustments_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commission_period_adjustments_period_id_fkey"
            columns: ["period_id"]
            isOneToOne: false
            referencedRelation: "commission_periods"
            referencedColumns: ["id"]
          },
        ]
      }
      commission_periods: {
        Row: {
          created_at: string
          display_in_backoffice: boolean
          end_date: string
          id: string
          notes: string | null
          period_number: number
          start_date: string
          status: string
          total_adjustments: number
          total_affiliate_commissions: number
          total_commissions: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_in_backoffice?: boolean
          end_date: string
          id?: string
          notes?: string | null
          period_number: number
          start_date: string
          status?: string
          total_adjustments?: number
          total_affiliate_commissions?: number
          total_commissions?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_in_backoffice?: boolean
          end_date?: string
          id?: string
          notes?: string | null
          period_number?: number
          start_date?: string
          status?: string
          total_adjustments?: number
          total_affiliate_commissions?: number
          total_commissions?: number
          updated_at?: string
        }
        Relationships: []
      }
      company_settings: {
        Row: {
          address_line1: string | null
          address_line2: string | null
          city: string | null
          company_email: string | null
          company_name: string
          company_phone: string | null
          created_at: string
          hours_of_operation: string | null
          id: string
          logo_url: string | null
          owner_first_name: string
          owner_last_name: string
          postal_code: string | null
          state_province: string | null
          support_email: string | null
          updated_at: string
        }
        Insert: {
          address_line1?: string | null
          address_line2?: string | null
          city?: string | null
          company_email?: string | null
          company_name: string
          company_phone?: string | null
          created_at?: string
          hours_of_operation?: string | null
          id?: string
          logo_url?: string | null
          owner_first_name: string
          owner_last_name: string
          postal_code?: string | null
          state_province?: string | null
          support_email?: string | null
          updated_at?: string
        }
        Update: {
          address_line1?: string | null
          address_line2?: string | null
          city?: string | null
          company_email?: string | null
          company_name?: string
          company_phone?: string | null
          created_at?: string
          hours_of_operation?: string | null
          id?: string
          logo_url?: string | null
          owner_first_name?: string
          owner_last_name?: string
          postal_code?: string | null
          state_province?: string | null
          support_email?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      compensation_plans: {
        Row: {
          created_at: string
          default_rank_name: string
          id: string
          level_percentages: Json | null
          num_levels: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          default_rank_name?: string
          id?: string
          level_percentages?: Json | null
          num_levels?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          default_rank_name?: string
          id?: string
          level_percentages?: Json | null
          num_levels?: number
          updated_at?: string
        }
        Relationships: []
      }
      customer_notes: {
        Row: {
          created_at: string
          created_by: string
          customer_id: string
          id: string
          metadata: Json | null
          note_text: string
          note_type: Database["public"]["Enums"]["note_type"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          customer_id: string
          id?: string
          metadata?: Json | null
          note_text: string
          note_type?: Database["public"]["Enums"]["note_type"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          customer_id?: string
          id?: string
          metadata?: Json | null
          note_text?: string
          note_type?: Database["public"]["Enums"]["note_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_notes_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          address: string | null
          address2: string | null
          city: string | null
          country: string | null
          created_at: string
          customer_id: string
          deleted_at: string | null
          deleted_by: string | null
          email: string
          email_opted_out: boolean
          email_opted_out_at: string | null
          enrolled_by: string | null
          first_name: string
          id: string
          last_name: string
          phone: string | null
          phone_numbers: Json | null
          postal_code: string | null
          state_province: string | null
          status: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          address2?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          customer_id: string
          deleted_at?: string | null
          deleted_by?: string | null
          email: string
          email_opted_out?: boolean
          email_opted_out_at?: string | null
          enrolled_by?: string | null
          first_name: string
          id?: string
          last_name: string
          phone?: string | null
          phone_numbers?: Json | null
          postal_code?: string | null
          state_province?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          address2?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          customer_id?: string
          deleted_at?: string | null
          deleted_by?: string | null
          email?: string
          email_opted_out?: boolean
          email_opted_out_at?: string | null
          enrolled_by?: string | null
          first_name?: string
          id?: string
          last_name?: string
          phone?: string | null
          phone_numbers?: Json | null
          postal_code?: string | null
          state_province?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "customers_enrolled_by_fkey"
            columns: ["enrolled_by"]
            isOneToOne: false
            referencedRelation: "affiliates"
            referencedColumns: ["id"]
          },
        ]
      }
      deletion_logs: {
        Row: {
          additional_info: Json | null
          created_at: string
          deleted_by: string
          deletion_date: string
          deletion_type: string
          entity_id: string
          entity_identifier: string
          entity_name: string | null
          entity_type: string
          id: string
        }
        Insert: {
          additional_info?: Json | null
          created_at?: string
          deleted_by: string
          deletion_date?: string
          deletion_type: string
          entity_id: string
          entity_identifier: string
          entity_name?: string | null
          entity_type: string
          id?: string
        }
        Update: {
          additional_info?: Json | null
          created_at?: string
          deleted_by?: string
          deletion_date?: string
          deletion_type?: string
          entity_id?: string
          entity_identifier?: string
          entity_name?: string | null
          entity_type?: string
          id?: string
        }
        Relationships: []
      }
      email_master_template: {
        Row: {
          created_at: string
          footer_html: string | null
          header_html: string | null
          id: string
          is_enabled: boolean
          updated_at: string
        }
        Insert: {
          created_at?: string
          footer_html?: string | null
          header_html?: string | null
          id?: string
          is_enabled?: boolean
          updated_at?: string
        }
        Update: {
          created_at?: string
          footer_html?: string | null
          header_html?: string | null
          id?: string
          is_enabled?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      email_templates: {
        Row: {
          category: string
          created_at: string
          description: string | null
          html_content: string
          id: string
          is_active: boolean
          subject: string
          template_id: string | null
          template_name: string
          updated_at: string
          use_master_template: boolean
        }
        Insert: {
          category: string
          created_at?: string
          description?: string | null
          html_content: string
          id?: string
          is_active?: boolean
          subject: string
          template_id?: string | null
          template_name: string
          updated_at?: string
          use_master_template?: boolean
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          html_content?: string
          id?: string
          is_active?: boolean
          subject?: string
          template_id?: string | null
          template_name?: string
          updated_at?: string
          use_master_template?: boolean
        }
        Relationships: []
      }
      integrations: {
        Row: {
          config: Json | null
          created_at: string
          id: string
          integration_name: string
          is_enabled: boolean
          updated_at: string
        }
        Insert: {
          config?: Json | null
          created_at?: string
          id?: string
          integration_name: string
          is_enabled?: boolean
          updated_at?: string
        }
        Update: {
          config?: Json | null
          created_at?: string
          id?: string
          integration_name?: string
          is_enabled?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      module_permissions: {
        Row: {
          created_at: string
          id: string
          module_name: string
          permission_level: Database["public"]["Enums"]["permission_level"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          module_name: string
          permission_level?: Database["public"]["Enums"]["permission_level"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          module_name?: string
          permission_level?: Database["public"]["Enums"]["permission_level"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      order_commissions: {
        Row: {
          affiliate_id: string
          commission_amount: number
          commission_rate: number
          created_at: string
          id: string
          level: number
          order_id: string
          updated_at: string
        }
        Insert: {
          affiliate_id: string
          commission_amount: number
          commission_rate: number
          created_at?: string
          id?: string
          level: number
          order_id: string
          updated_at?: string
        }
        Update: {
          affiliate_id?: string
          commission_amount?: number
          commission_rate?: number
          created_at?: string
          id?: string
          level?: number
          order_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_commissions_affiliate_id_fkey"
            columns: ["affiliate_id"]
            isOneToOne: false
            referencedRelation: "affiliates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_commissions_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          created_at: string
          description: string
          id: string
          item_id: string
          order_id: string
          price: number
          quantity: number
          total: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          description: string
          id?: string
          item_id: string
          order_id: string
          price?: number
          quantity?: number
          total?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          item_id?: string
          order_id?: string
          price?: number
          quantity?: number
          total?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      order_notes: {
        Row: {
          created_at: string
          created_by: string
          id: string
          note_text: string
          order_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          note_text: string
          order_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          note_text?: string
          order_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_notes_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          amount: number
          amount_paid: number | null
          billing_address_line1: string | null
          billing_address_line2: string | null
          billing_city: string | null
          billing_country: string | null
          billing_postal_code: string | null
          billing_same_as_shipping: boolean | null
          billing_state: string | null
          cancelled_date: string | null
          created_at: string
          customer_id: string
          deleted_at: string | null
          deleted_by: string | null
          id: string
          order_date: string
          order_number: string
          payment_date: string | null
          payment_method: string | null
          refunded_date: string | null
          sales_tax_id: string | null
          shipping_address_line1: string | null
          shipping_address_line2: string | null
          shipping_city: string | null
          shipping_cost: number | null
          shipping_country: string | null
          shipping_method: string | null
          shipping_postal_code: string | null
          shipping_state: string | null
          shopify_order_number: string | null
          status: string
          subscription: boolean
          subtotal: number | null
          tax_amount: number | null
          updated_at: string
        }
        Insert: {
          amount: number
          amount_paid?: number | null
          billing_address_line1?: string | null
          billing_address_line2?: string | null
          billing_city?: string | null
          billing_country?: string | null
          billing_postal_code?: string | null
          billing_same_as_shipping?: boolean | null
          billing_state?: string | null
          cancelled_date?: string | null
          created_at?: string
          customer_id: string
          deleted_at?: string | null
          deleted_by?: string | null
          id?: string
          order_date?: string
          order_number: string
          payment_date?: string | null
          payment_method?: string | null
          refunded_date?: string | null
          sales_tax_id?: string | null
          shipping_address_line1?: string | null
          shipping_address_line2?: string | null
          shipping_city?: string | null
          shipping_cost?: number | null
          shipping_country?: string | null
          shipping_method?: string | null
          shipping_postal_code?: string | null
          shipping_state?: string | null
          shopify_order_number?: string | null
          status?: string
          subscription?: boolean
          subtotal?: number | null
          tax_amount?: number | null
          updated_at?: string
        }
        Update: {
          amount?: number
          amount_paid?: number | null
          billing_address_line1?: string | null
          billing_address_line2?: string | null
          billing_city?: string | null
          billing_country?: string | null
          billing_postal_code?: string | null
          billing_same_as_shipping?: boolean | null
          billing_state?: string | null
          cancelled_date?: string | null
          created_at?: string
          customer_id?: string
          deleted_at?: string | null
          deleted_by?: string | null
          id?: string
          order_date?: string
          order_number?: string
          payment_date?: string | null
          payment_method?: string | null
          refunded_date?: string | null
          sales_tax_id?: string | null
          shipping_address_line1?: string | null
          shipping_address_line2?: string | null
          shipping_city?: string | null
          shipping_cost?: number | null
          shipping_country?: string | null
          shipping_method?: string | null
          shipping_postal_code?: string | null
          shipping_state?: string | null
          shopify_order_number?: string | null
          status?: string
          subscription?: boolean
          subtotal?: number | null
          tax_amount?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          address: string | null
          avatar_color: string | null
          avatar_initials: string | null
          avatar_url: string | null
          city: string | null
          country: string | null
          created_at: string
          first_name: string | null
          id: string
          last_name: string | null
          phone: string | null
          state: string | null
          updated_at: string
          zip_code: string | null
        }
        Insert: {
          address?: string | null
          avatar_color?: string | null
          avatar_initials?: string | null
          avatar_url?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          first_name?: string | null
          id: string
          last_name?: string | null
          phone?: string | null
          state?: string | null
          updated_at?: string
          zip_code?: string | null
        }
        Update: {
          address?: string | null
          avatar_color?: string | null
          avatar_initials?: string | null
          avatar_url?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          phone?: string | null
          state?: string | null
          updated_at?: string
          zip_code?: string | null
        }
        Relationships: []
      }
      social_media_links: {
        Row: {
          created_at: string
          facebook_url: string | null
          id: string
          instagram_url: string | null
          updated_at: string
          x_url: string | null
          youtube_url: string | null
        }
        Insert: {
          created_at?: string
          facebook_url?: string | null
          id?: string
          instagram_url?: string | null
          updated_at?: string
          x_url?: string | null
          youtube_url?: string | null
        }
        Update: {
          created_at?: string
          facebook_url?: string | null
          id?: string
          instagram_url?: string | null
          updated_at?: string
          x_url?: string | null
          youtube_url?: string | null
        }
        Relationships: []
      }
      user_announcements: {
        Row: {
          announcement_id: string
          completed: boolean
          created_at: string
          dismissed_at: string
          id: string
          user_id: string
        }
        Insert: {
          announcement_id: string
          completed?: boolean
          created_at?: string
          dismissed_at?: string
          id?: string
          user_id: string
        }
        Update: {
          announcement_id?: string
          completed?: boolean
          created_at?: string
          dismissed_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_announcements_announcement_id_fkey"
            columns: ["announcement_id"]
            isOneToOne: false
            referencedRelation: "announcements"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_user_id_profiles_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_affiliate_id_for_user: { Args: { _user_id: string }; Returns: string }
      get_level1_affiliate_ids: {
        Args: { _user_id: string }
        Returns: {
          affiliate_id: string
        }[]
      }
      get_level2_affiliate_customer_ids: {
        Args: { _user_id: string }
        Returns: {
          customer_id: string
        }[]
      }
      get_level2_affiliate_ids: {
        Args: { _user_id: string }
        Returns: {
          affiliate_id: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
      is_affiliate: { Args: { _user_id: string }; Returns: boolean }
      is_super_admin: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "manager" | "user" | "affiliate" | "super_admin"
      note_type: "note" | "merge"
      permission_level: "none" | "view" | "edit"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "manager", "user", "affiliate", "super_admin"],
      note_type: ["note", "merge"],
      permission_level: ["none", "view", "edit"],
    },
  },
} as const
