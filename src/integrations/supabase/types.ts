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
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      activities: {
        Row: {
          category: string
          content: string | null
          created_at: string | null
          description: string | null
          event_date: string | null
          id: string
          image_url: string | null
          is_featured: boolean | null
          is_public: boolean | null
          partnerships: string | null
          results: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          category: string
          content?: string | null
          created_at?: string | null
          description?: string | null
          event_date?: string | null
          id?: string
          image_url?: string | null
          is_featured?: boolean | null
          is_public?: boolean | null
          partnerships?: string | null
          results?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          category?: string
          content?: string | null
          created_at?: string | null
          description?: string | null
          event_date?: string | null
          id?: string
          image_url?: string | null
          is_featured?: boolean | null
          is_public?: boolean | null
          partnerships?: string | null
          results?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      activity_images: {
        Row: {
          activity_id: string
          created_at: string
          display_order: number
          id: string
          image_url: string
        }
        Insert: {
          activity_id: string
          created_at?: string
          display_order?: number
          id?: string
          image_url: string
        }
        Update: {
          activity_id?: string
          created_at?: string
          display_order?: number
          id?: string
          image_url?: string
        }
        Relationships: [
          {
            foreignKeyName: "activity_images_activity_id_fkey"
            columns: ["activity_id"]
            isOneToOne: false
            referencedRelation: "activities"
            referencedColumns: ["id"]
          },
        ]
      }
      articles: {
        Row: {
          created_at: string | null
          description: string | null
          file_name: string | null
          file_type: string | null
          file_url: string | null
          id: string
          title: string
          updated_at: string | null
          uploaded_by: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          file_name?: string | null
          file_type?: string | null
          file_url?: string | null
          id?: string
          title: string
          updated_at?: string | null
          uploaded_by?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          file_name?: string | null
          file_type?: string | null
          file_url?: string | null
          id?: string
          title?: string
          updated_at?: string | null
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "articles_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string
          entity_id: string | null
          entity_label: string | null
          entity_type: string
          id: string
          ip_address: string | null
          module: string
          new_data: Json | null
          previous_data: Json | null
          user_id: string | null
          user_name: string | null
          user_position: string | null
        }
        Insert: {
          action: string
          created_at?: string
          entity_id?: string | null
          entity_label?: string | null
          entity_type: string
          id?: string
          ip_address?: string | null
          module: string
          new_data?: Json | null
          previous_data?: Json | null
          user_id?: string | null
          user_name?: string | null
          user_position?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          entity_id?: string | null
          entity_label?: string | null
          entity_type?: string
          id?: string
          ip_address?: string | null
          module?: string
          new_data?: Json | null
          previous_data?: Json | null
          user_id?: string | null
          user_name?: string | null
          user_position?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      book_loans: {
        Row: {
          book_id: string
          borrower_id: string
          created_at: string | null
          due_date: string
          id: string
          loan_date: string
          return_date: string | null
          status: string
          updated_at: string | null
        }
        Insert: {
          book_id: string
          borrower_id: string
          created_at?: string | null
          due_date: string
          id?: string
          loan_date?: string
          return_date?: string | null
          status?: string
          updated_at?: string | null
        }
        Update: {
          book_id?: string
          borrower_id?: string
          created_at?: string | null
          due_date?: string
          id?: string
          loan_date?: string
          return_date?: string | null
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "book_loans_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "books"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "book_loans_borrower_id_fkey"
            columns: ["borrower_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      books: {
        Row: {
          author: string
          cover_image_url: string | null
          created_at: string | null
          description: string | null
          id: string
          isbn: string | null
          recommendation: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          author: string
          cover_image_url?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          isbn?: string | null
          recommendation?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          author?: string
          cover_image_url?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          isbn?: string | null
          recommendation?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      commemorative_dates: {
        Row: {
          created_at: string | null
          date: string
          date_type: string
          description: string
          id: string
          profile_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          date: string
          date_type: string
          description: string
          id?: string
          profile_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          date?: string
          date_type?: string
          description?: string
          id?: string
          profile_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "commemorative_dates_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      copo_dagua_calendar: {
        Row: {
          created_at: string
          day_of_week: string
          event_date: string
          id: string
          month: string
          session_degree: string | null
          session_type: string
          start_time: string
          study_time: string | null
          updated_at: string
          water_glass_group: string
        }
        Insert: {
          created_at?: string
          day_of_week: string
          event_date: string
          id?: string
          month: string
          session_degree?: string | null
          session_type: string
          start_time: string
          study_time?: string | null
          updated_at?: string
          water_glass_group: string
        }
        Update: {
          created_at?: string
          day_of_week?: string
          event_date?: string
          id?: string
          month?: string
          session_degree?: string | null
          session_type?: string
          start_time?: string
          study_time?: string | null
          updated_at?: string
          water_glass_group?: string
        }
        Relationships: []
      }
      educational_content: {
        Row: {
          category: string
          content: string | null
          created_at: string | null
          description: string | null
          id: string
          image_url: string | null
          is_public: boolean | null
          title: string
          updated_at: string | null
        }
        Insert: {
          category: string
          content?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_public?: boolean | null
          title: string
          updated_at?: string | null
        }
        Update: {
          category?: string
          content?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_public?: boolean | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      event_images: {
        Row: {
          created_at: string
          display_order: number
          event_id: string
          id: string
          image_url: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          event_id: string
          id?: string
          image_url: string
        }
        Update: {
          created_at?: string
          display_order?: number
          event_id?: string
          id?: string
          image_url?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_images_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          created_at: string | null
          description: string | null
          event_date: string
          id: string
          image_url: string | null
          is_public: boolean | null
          location: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          event_date: string
          id?: string
          image_url?: string | null
          is_public?: boolean | null
          location?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          event_date?: string
          id?: string
          image_url?: string | null
          is_public?: boolean | null
          location?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      faq_items: {
        Row: {
          answer: string
          category: string | null
          created_at: string | null
          display_order: number | null
          id: string
          question: string
          updated_at: string | null
        }
        Insert: {
          answer: string
          category?: string | null
          created_at?: string | null
          display_order?: number | null
          id?: string
          question: string
          updated_at?: string | null
        }
        Update: {
          answer?: string
          category?: string | null
          created_at?: string | null
          display_order?: number | null
          id?: string
          question?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      financial_account_movements: {
        Row: {
          account_id: string
          amount: number
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          movement_date: string
          movement_type: string
          updated_at: string
        }
        Insert: {
          account_id: string
          amount: number
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          movement_date?: string
          movement_type: string
          updated_at?: string
        }
        Update: {
          account_id?: string
          amount?: number
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          movement_date?: string
          movement_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "financial_account_movements_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "financial_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      financial_accounts: {
        Row: {
          account_name: string
          account_type: string
          balance: number
          created_at: string
          description: string | null
          id: string
          institution: string | null
          is_active: boolean
          updated_at: string
        }
        Insert: {
          account_name: string
          account_type?: string
          balance?: number
          created_at?: string
          description?: string | null
          id?: string
          institution?: string | null
          is_active?: boolean
          updated_at?: string
        }
        Update: {
          account_name?: string
          account_type?: string
          balance?: number
          created_at?: string
          description?: string | null
          id?: string
          institution?: string | null
          is_active?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      financial_transactions: {
        Row: {
          amount: number
          category: string
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          profile_id: string | null
          reference_month: string | null
          subcategory: string | null
          transaction_date: string
          transaction_type: Database["public"]["Enums"]["financial_transaction_type"]
          updated_at: string
        }
        Insert: {
          amount: number
          category: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          profile_id?: string | null
          reference_month?: string | null
          subcategory?: string | null
          transaction_date?: string
          transaction_type: Database["public"]["Enums"]["financial_transaction_type"]
          updated_at?: string
        }
        Update: {
          amount?: number
          category?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          profile_id?: string | null
          reference_month?: string | null
          subcategory?: string | null
          transaction_date?: string
          transaction_type?: Database["public"]["Enums"]["financial_transaction_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "financial_transactions_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      glossary_terms: {
        Row: {
          category: string | null
          created_at: string | null
          definition: string
          id: string
          term: string
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          definition: string
          id?: string
          term: string
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          definition?: string
          id?: string
          term?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      hospitalar_aid_requests: {
        Row: {
          aid_type: string
          approved_amount: number | null
          authorized_by: string | null
          created_at: string
          decision_date: string | null
          decision_notes: string | null
          description: string
          id: string
          profile_id: string | null
          request_date: string
          requested_amount: number | null
          requester_type: string
          status: string
          updated_at: string
        }
        Insert: {
          aid_type?: string
          approved_amount?: number | null
          authorized_by?: string | null
          created_at?: string
          decision_date?: string | null
          decision_notes?: string | null
          description: string
          id?: string
          profile_id?: string | null
          request_date?: string
          requested_amount?: number | null
          requester_type?: string
          status?: string
          updated_at?: string
        }
        Update: {
          aid_type?: string
          approved_amount?: number | null
          authorized_by?: string | null
          created_at?: string
          decision_date?: string | null
          decision_notes?: string | null
          description?: string
          id?: string
          profile_id?: string | null
          request_date?: string
          requested_amount?: number | null
          requester_type?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "hospitalar_aid_requests_authorized_by_fkey"
            columns: ["authorized_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hospitalar_aid_requests_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      hospitalar_beneficence_fund: {
        Row: {
          aid_request_id: string | null
          amount: number
          authorized_by: string | null
          created_at: string
          description: string | null
          id: string
          movement_date: string
          movement_type: string
          origin: string
          updated_at: string
        }
        Insert: {
          aid_request_id?: string | null
          amount: number
          authorized_by?: string | null
          created_at?: string
          description?: string | null
          id?: string
          movement_date?: string
          movement_type?: string
          origin?: string
          updated_at?: string
        }
        Update: {
          aid_request_id?: string | null
          amount?: number
          authorized_by?: string | null
          created_at?: string
          description?: string | null
          id?: string
          movement_date?: string
          movement_type?: string
          origin?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "hospitalar_beneficence_fund_aid_request_id_fkey"
            columns: ["aid_request_id"]
            isOneToOne: false
            referencedRelation: "hospitalar_aid_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hospitalar_beneficence_fund_authorized_by_fkey"
            columns: ["authorized_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      hospitalar_cases: {
        Row: {
          created_at: string
          description: string | null
          id: string
          priority: string
          profile_id: string
          responsible_id: string | null
          situation_type: string
          start_date: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          priority?: string
          profile_id: string
          responsible_id?: string | null
          situation_type?: string
          start_date?: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          priority?: string
          profile_id?: string
          responsible_id?: string | null
          situation_type?: string
          start_date?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "hospitalar_cases_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hospitalar_cases_responsible_id_fkey"
            columns: ["responsible_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      hospitalar_philanthropy: {
        Row: {
          action_type: string
          created_at: string
          description: string | null
          end_date: string | null
          expected_beneficiaries: number | null
          goal: string | null
          id: string
          name: string
          result: string | null
          start_date: string
          status: string
          updated_at: string
        }
        Insert: {
          action_type?: string
          created_at?: string
          description?: string | null
          end_date?: string | null
          expected_beneficiaries?: number | null
          goal?: string | null
          id?: string
          name: string
          result?: string | null
          start_date?: string
          status?: string
          updated_at?: string
        }
        Update: {
          action_type?: string
          created_at?: string
          description?: string | null
          end_date?: string | null
          expected_beneficiaries?: number | null
          goal?: string | null
          id?: string
          name?: string
          result?: string | null
          start_date?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      hospitalar_visits: {
        Row: {
          actions_taken: string | null
          case_id: string | null
          created_at: string
          id: string
          needs_identified: string | null
          next_visit_date: string | null
          profile_id: string
          report: string | null
          updated_at: string
          updated_situation: string | null
          visit_date: string
          visit_type: string
        }
        Insert: {
          actions_taken?: string | null
          case_id?: string | null
          created_at?: string
          id?: string
          needs_identified?: string | null
          next_visit_date?: string | null
          profile_id: string
          report?: string | null
          updated_at?: string
          updated_situation?: string | null
          visit_date?: string
          visit_type?: string
        }
        Update: {
          actions_taken?: string | null
          case_id?: string | null
          created_at?: string
          id?: string
          needs_identified?: string | null
          next_visit_date?: string | null
          profile_id?: string
          report?: string | null
          updated_at?: string
          updated_situation?: string | null
          visit_date?: string
          visit_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "hospitalar_visits_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "hospitalar_cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hospitalar_visits_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      lodge_info: {
        Row: {
          address: string | null
          created_at: string | null
          description: string | null
          email: string | null
          id: string
          logo_url: string | null
          mission: string | null
          name: string
          phone: string | null
          updated_at: string | null
          values: string | null
          vision: string | null
          website: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string | null
          description?: string | null
          email?: string | null
          id?: string
          logo_url?: string | null
          mission?: string | null
          name: string
          phone?: string | null
          updated_at?: string | null
          values?: string | null
          vision?: string | null
          website?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string | null
          description?: string | null
          email?: string | null
          id?: string
          logo_url?: string | null
          mission?: string | null
          name?: string
          phone?: string | null
          updated_at?: string | null
          values?: string | null
          vision?: string | null
          website?: string | null
        }
        Relationships: []
      }
      management_cargo_reports: {
        Row: {
          accepted_at: string | null
          accepted_by: string | null
          achievements: string | null
          created_at: string
          id: string
          include_audit_logs: boolean
          include_chancelaria: boolean
          include_financeiro: boolean
          include_hospitalaria: boolean
          include_secretaria: boolean
          locked: boolean
          observations: string | null
          pending_items: Json | null
          period_end: string
          period_start: string
          session_date: string | null
          signed_at: string | null
          signed_by: string | null
          snapshot_data: Json | null
          status: string
          updated_at: string
          vm_entrante_id: string | null
          vm_sainte_id: string | null
        }
        Insert: {
          accepted_at?: string | null
          accepted_by?: string | null
          achievements?: string | null
          created_at?: string
          id?: string
          include_audit_logs?: boolean
          include_chancelaria?: boolean
          include_financeiro?: boolean
          include_hospitalaria?: boolean
          include_secretaria?: boolean
          locked?: boolean
          observations?: string | null
          pending_items?: Json | null
          period_end: string
          period_start: string
          session_date?: string | null
          signed_at?: string | null
          signed_by?: string | null
          snapshot_data?: Json | null
          status?: string
          updated_at?: string
          vm_entrante_id?: string | null
          vm_sainte_id?: string | null
        }
        Update: {
          accepted_at?: string | null
          accepted_by?: string | null
          achievements?: string | null
          created_at?: string
          id?: string
          include_audit_logs?: boolean
          include_chancelaria?: boolean
          include_financeiro?: boolean
          include_hospitalaria?: boolean
          include_secretaria?: boolean
          locked?: boolean
          observations?: string | null
          pending_items?: Json | null
          period_end?: string
          period_start?: string
          session_date?: string | null
          signed_at?: string | null
          signed_by?: string | null
          snapshot_data?: Json | null
          status?: string
          updated_at?: string
          vm_entrante_id?: string | null
          vm_sainte_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "management_cargo_reports_accepted_by_fkey"
            columns: ["accepted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "management_cargo_reports_signed_by_fkey"
            columns: ["signed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "management_cargo_reports_vm_entrante_id_fkey"
            columns: ["vm_entrante_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "management_cargo_reports_vm_sainte_id_fkey"
            columns: ["vm_sainte_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      meeting_minutes: {
        Row: {
          approved_at: string | null
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          masonic_degree: number
          meeting_date: string
          session_id: string | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          approved_at?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          masonic_degree: number
          meeting_date: string
          session_id?: string | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          approved_at?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          masonic_degree?: number
          meeting_date?: string
          session_id?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "meeting_minutes_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      meeting_minutes_files: {
        Row: {
          created_at: string
          display_order: number
          file_name: string
          file_type: string
          file_url: string
          id: string
          minute_id: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          file_name: string
          file_type: string
          file_url: string
          id?: string
          minute_id: string
        }
        Update: {
          created_at?: string
          display_order?: number
          file_name?: string
          file_type?: string
          file_url?: string
          id?: string
          minute_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "meeting_minutes_files_minute_id_fkey"
            columns: ["minute_id"]
            isOneToOne: false
            referencedRelation: "meeting_minutes"
            referencedColumns: ["id"]
          },
        ]
      }
      message_reads: {
        Row: {
          id: string
          message_id: string
          read_at: string
          user_id: string
        }
        Insert: {
          id?: string
          message_id: string
          read_at?: string
          user_id: string
        }
        Update: {
          id?: string
          message_id?: string
          read_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "message_reads_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string
          created_at: string
          created_by: string | null
          id: string
          recipient_id: string | null
          title: string
          updated_at: string
        }
        Insert: {
          content: string
          created_at?: string
          created_by?: string | null
          id?: string
          recipient_id?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          created_by?: string | null
          id?: string
          recipient_id?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      n8n_chat_histories: {
        Row: {
          id: number
          message: Json
          session_id: string
        }
        Insert: {
          id?: number
          message: Json
          session_id: string
        }
        Update: {
          id?: number
          message?: Json
          session_id?: string
        }
        Relationships: []
      }
      officers: {
        Row: {
          bio: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          name: string
          photo_url: string | null
          position: string
          sort_order: number | null
          updated_at: string | null
        }
        Insert: {
          bio?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          photo_url?: string | null
          position: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Update: {
          bio?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          photo_url?: string | null
          position?: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          cim: string | null
          commission: string | null
          created_at: string | null
          email: string | null
          full_name: string | null
          graduation: string
          id: string
          is_director_member: boolean | null
          masonic_degree: number | null
          member_status: string
          phone: string | null
          photo_url: string | null
          position: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          cim?: string | null
          commission?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          graduation?: string
          id?: string
          is_director_member?: boolean | null
          masonic_degree?: number | null
          member_status?: string
          phone?: string | null
          photo_url?: string | null
          position?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          cim?: string | null
          commission?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          graduation?: string
          id?: string
          is_director_member?: boolean | null
          masonic_degree?: number | null
          member_status?: string
          phone?: string | null
          photo_url?: string | null
          position?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      secretary_certificates: {
        Row: {
          certificate_type: string
          created_at: string
          created_by: string | null
          id: string
          issue_date: string
          notes: string | null
          profile_id: string | null
          purpose: string | null
          registration_number: string | null
          status: string
          updated_at: string
        }
        Insert: {
          certificate_type?: string
          created_at?: string
          created_by?: string | null
          id?: string
          issue_date?: string
          notes?: string | null
          profile_id?: string | null
          purpose?: string | null
          registration_number?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          certificate_type?: string
          created_at?: string
          created_by?: string | null
          id?: string
          issue_date?: string
          notes?: string | null
          profile_id?: string | null
          purpose?: string | null
          registration_number?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "secretary_certificates_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      secretary_convocations: {
        Row: {
          agenda_items: string[] | null
          convocation_date: string
          convocation_time: string | null
          created_at: string
          created_by: string | null
          id: string
          location: string | null
          recipients_type: string
          send_channel: string
          sent_at: string | null
          session_type: string
          status: string
          updated_at: string
        }
        Insert: {
          agenda_items?: string[] | null
          convocation_date?: string
          convocation_time?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          location?: string | null
          recipients_type?: string
          send_channel?: string
          sent_at?: string | null
          session_type?: string
          status?: string
          updated_at?: string
        }
        Update: {
          agenda_items?: string[] | null
          convocation_date?: string
          convocation_time?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          location?: string | null
          recipients_type?: string
          send_channel?: string
          sent_at?: string | null
          session_type?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      secretary_correspondence: {
        Row: {
          category: string
          content: string | null
          correspondence_date: string
          correspondence_type: string
          created_at: string
          created_by: string | null
          id: string
          internal_notes: string | null
          priority: string
          protocol_number: string
          recipient: string
          related_correspondence_id: string | null
          sender: string
          status: string
          subject: string
          updated_at: string
        }
        Insert: {
          category?: string
          content?: string | null
          correspondence_date?: string
          correspondence_type?: string
          created_at?: string
          created_by?: string | null
          id?: string
          internal_notes?: string | null
          priority?: string
          protocol_number: string
          recipient: string
          related_correspondence_id?: string | null
          sender: string
          status?: string
          subject: string
          updated_at?: string
        }
        Update: {
          category?: string
          content?: string | null
          correspondence_date?: string
          correspondence_type?: string
          created_at?: string
          created_by?: string | null
          id?: string
          internal_notes?: string | null
          priority?: string
          protocol_number?: string
          recipient?: string
          related_correspondence_id?: string | null
          sender?: string
          status?: string
          subject?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "secretary_correspondence_related_correspondence_id_fkey"
            columns: ["related_correspondence_id"]
            isOneToOne: false
            referencedRelation: "secretary_correspondence"
            referencedColumns: ["id"]
          },
        ]
      }
      secretary_documents: {
        Row: {
          access_type: string
          category: string
          created_at: string
          description: string | null
          document_date: string
          file_name: string | null
          file_size: number | null
          file_type: string | null
          file_url: string | null
          id: string
          linked_correspondence_id: string | null
          linked_minute_id: string | null
          linked_profile_id: string | null
          reference_number: string | null
          tags: string[] | null
          title: string
          updated_at: string
          uploaded_by: string | null
        }
        Insert: {
          access_type?: string
          category?: string
          created_at?: string
          description?: string | null
          document_date?: string
          file_name?: string | null
          file_size?: number | null
          file_type?: string | null
          file_url?: string | null
          id?: string
          linked_correspondence_id?: string | null
          linked_minute_id?: string | null
          linked_profile_id?: string | null
          reference_number?: string | null
          tags?: string[] | null
          title: string
          updated_at?: string
          uploaded_by?: string | null
        }
        Update: {
          access_type?: string
          category?: string
          created_at?: string
          description?: string | null
          document_date?: string
          file_name?: string | null
          file_size?: number | null
          file_type?: string | null
          file_url?: string | null
          id?: string
          linked_correspondence_id?: string | null
          linked_minute_id?: string | null
          linked_profile_id?: string | null
          reference_number?: string | null
          tags?: string[] | null
          title?: string
          updated_at?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "secretary_documents_linked_correspondence_id_fkey"
            columns: ["linked_correspondence_id"]
            isOneToOne: false
            referencedRelation: "secretary_correspondence"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "secretary_documents_linked_minute_id_fkey"
            columns: ["linked_minute_id"]
            isOneToOne: false
            referencedRelation: "meeting_minutes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "secretary_documents_linked_profile_id_fkey"
            columns: ["linked_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      session_attendances: {
        Row: {
          created_at: string
          id: string
          is_present: boolean
          position_override: string | null
          profile_id: string
          session_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_present?: boolean
          position_override?: string | null
          profile_id: string
          session_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_present?: boolean
          position_override?: string | null
          profile_id?: string
          session_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "session_attendances_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_attendances_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      sessions: {
        Row: {
          created_at: string
          description: string | null
          id: string
          session_datetime: string
          session_degree: string
          show_description: boolean
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          session_datetime: string
          session_degree: string
          show_description?: boolean
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          session_datetime?: string
          session_degree?: string
          show_description?: boolean
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      study_works: {
        Row: {
          brother_name: string
          category: string
          created_at: string | null
          description: string | null
          file_path: string | null
          id: string
          is_approved: boolean | null
          masonic_degree: number
          updated_at: string | null
          uploaded_by: string | null
          work_title: string
        }
        Insert: {
          brother_name: string
          category: string
          created_at?: string | null
          description?: string | null
          file_path?: string | null
          id?: string
          is_approved?: boolean | null
          masonic_degree: number
          updated_at?: string | null
          uploaded_by?: string | null
          work_title: string
        }
        Update: {
          brother_name?: string
          category?: string
          created_at?: string | null
          description?: string | null
          file_path?: string | null
          id?: string
          is_approved?: boolean | null
          masonic_degree?: number
          updated_at?: string | null
          uploaded_by?: string | null
          work_title?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_works: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          category: string
          created_at: string | null
          description: string | null
          file_path: string | null
          id: string
          is_approved: boolean | null
          masonic_degree: number
          updated_at: string | null
          user_id: string
          work_title: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          category?: string
          created_at?: string | null
          description?: string | null
          file_path?: string | null
          id?: string
          is_approved?: boolean | null
          masonic_degree?: number
          updated_at?: string | null
          user_id: string
          work_title: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          category?: string
          created_at?: string | null
          description?: string | null
          file_path?: string | null
          id?: string
          is_approved?: boolean | null
          masonic_degree?: number
          updated_at?: string | null
          user_id?: string
          work_title?: string
        }
        Relationships: []
      }
      visitors: {
        Row: {
          birth_date: string | null
          cim: string | null
          city: string | null
          created_at: string | null
          email: string | null
          id: string
          landline_phone: string | null
          masonic_degree: string | null
          mobile_phone: string | null
          potencia: string | null
          session_id: string
          state: string | null
          updated_at: string | null
          visit_date: string | null
          visitor_lodge: string | null
          visitor_name: string
        }
        Insert: {
          birth_date?: string | null
          cim?: string | null
          city?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          landline_phone?: string | null
          masonic_degree?: string | null
          mobile_phone?: string | null
          potencia?: string | null
          session_id: string
          state?: string | null
          updated_at?: string | null
          visit_date?: string | null
          visitor_lodge?: string | null
          visitor_name: string
        }
        Update: {
          birth_date?: string | null
          cim?: string | null
          city?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          landline_phone?: string | null
          masonic_degree?: string | null
          mobile_phone?: string | null
          potencia?: string | null
          session_id?: string
          state?: string | null
          updated_at?: string | null
          visit_date?: string | null
          visitor_lodge?: string | null
          visitor_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "visitors_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      worshipful_masters: {
        Row: {
          achievements: string | null
          bio: string | null
          created_at: string | null
          id: string
          installation_year: number
          is_active: boolean | null
          name: string
          photo_url: string | null
          sort_order: number | null
          term_end_date: string | null
          term_start_date: string
          updated_at: string | null
        }
        Insert: {
          achievements?: string | null
          bio?: string | null
          created_at?: string | null
          id?: string
          installation_year: number
          is_active?: boolean | null
          name: string
          photo_url?: string | null
          sort_order?: number | null
          term_end_date?: string | null
          term_start_date: string
          updated_at?: string | null
        }
        Update: {
          achievements?: string | null
          bio?: string | null
          created_at?: string | null
          id?: string
          installation_year?: number
          is_active?: boolean | null
          name?: string
          photo_url?: string | null
          sort_order?: number | null
          term_end_date?: string | null
          term_start_date?: string
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_manage_profiles: { Args: { _user_id: string }; Returns: boolean }
      get_user_roles: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"][]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "member" | "commission_member"
      financial_transaction_type: "receita" | "despesa"
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      app_role: ["admin", "member", "commission_member"],
      financial_transaction_type: ["receita", "despesa"],
    },
  },
} as const
