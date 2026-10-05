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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      donor_requests: {
        Row: {
          admin_notes: string | null
          contact_method: string
          created_at: string
          email: string | null
          full_name: string
          id: string
          intended_amount: number | null
          message: string | null
          phone: string
          project_id: string | null
          status: Database["public"]["Enums"]["donor_status"]
          updated_at: string
        }
        Insert: {
          admin_notes?: string | null
          contact_method?: string
          created_at?: string
          email?: string | null
          full_name: string
          id?: string
          intended_amount?: number | null
          message?: string | null
          phone: string
          project_id?: string | null
          status?: Database["public"]["Enums"]["donor_status"]
          updated_at?: string
        }
        Update: {
          admin_notes?: string | null
          contact_method?: string
          created_at?: string
          email?: string | null
          full_name?: string
          id?: string
          intended_amount?: number | null
          message?: string | null
          phone?: string
          project_id?: string | null
          status?: Database["public"]["Enums"]["donor_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "donor_requests_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      portfolio_items: {
        Row: {
          beneficiaries: number | null
          completion_date: string | null
          cost: number | null
          cover_image: string | null
          created_at: string
          currency: string
          description: string | null
          id: string
          is_published: boolean
          location: string | null
          project_id: string | null
          project_type: Database["public"]["Enums"]["project_type"]
          slug: string
          title: string
          updated_at: string
        }
        Insert: {
          beneficiaries?: number | null
          completion_date?: string | null
          cost?: number | null
          cover_image?: string | null
          created_at?: string
          currency?: string
          description?: string | null
          id?: string
          is_published?: boolean
          location?: string | null
          project_id?: string | null
          project_type: Database["public"]["Enums"]["project_type"]
          slug: string
          title: string
          updated_at?: string
        }
        Update: {
          beneficiaries?: number | null
          completion_date?: string | null
          cost?: number | null
          cover_image?: string | null
          created_at?: string
          currency?: string
          description?: string | null
          id?: string
          is_published?: boolean
          location?: string | null
          project_id?: string | null
          project_type?: Database["public"]["Enums"]["project_type"]
          slug?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "portfolio_items_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      portfolio_media: {
        Row: {
          created_at: string
          id: string
          item_id: string
          kind: string
          sort_order: number
          url: string
        }
        Insert: {
          created_at?: string
          id?: string
          item_id: string
          kind: string
          sort_order?: number
          url: string
        }
        Update: {
          created_at?: string
          id?: string
          item_id?: string
          kind?: string
          sort_order?: number
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "portfolio_media_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "portfolio_items"
            referencedColumns: ["id"]
          },
        ]
      }
      project_media: {
        Row: {
          created_at: string
          id: string
          kind: string
          project_id: string
          sort_order: number
          url: string
        }
        Insert: {
          created_at?: string
          id?: string
          kind: string
          project_id: string
          sort_order?: number
          url: string
        }
        Update: {
          created_at?: string
          id?: string
          kind?: string
          project_id?: string
          sort_order?: number
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_media_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_requests: {
        Row: {
          admin_notes: string | null
          contact_name: string
          created_at: string
          documents: string[]
          email: string | null
          expected_beneficiaries: number
          extra_notes: string | null
          geo_location: string | null
          id: string
          locality: string
          need_description: string
          need_reason: string
          org_name: string
          org_type: string
          phone: string
          project_type: Database["public"]["Enums"]["project_type"]
          site_images: string[]
          state: string
          status: Database["public"]["Enums"]["request_status"]
          updated_at: string
          video_path: string | null
          village: string
        }
        Insert: {
          admin_notes?: string | null
          contact_name: string
          created_at?: string
          documents?: string[]
          email?: string | null
          expected_beneficiaries: number
          extra_notes?: string | null
          geo_location?: string | null
          id?: string
          locality: string
          need_description: string
          need_reason: string
          org_name: string
          org_type: string
          phone: string
          project_type: Database["public"]["Enums"]["project_type"]
          site_images?: string[]
          state: string
          status?: Database["public"]["Enums"]["request_status"]
          updated_at?: string
          video_path?: string | null
          village: string
        }
        Update: {
          admin_notes?: string | null
          contact_name?: string
          created_at?: string
          documents?: string[]
          email?: string | null
          expected_beneficiaries?: number
          extra_notes?: string | null
          geo_location?: string | null
          id?: string
          locality?: string
          need_description?: string
          need_reason?: string
          org_name?: string
          org_type?: string
          phone?: string
          project_type?: Database["public"]["Enums"]["project_type"]
          site_images?: string[]
          state?: string
          status?: Database["public"]["Enums"]["request_status"]
          updated_at?: string
          video_path?: string | null
          village?: string
        }
        Relationships: []
      }
      projects: {
        Row: {
          beneficiaries: number | null
          cover_image: string | null
          created_at: string
          currency: string
          description: string | null
          estimated_cost: number | null
          id: string
          is_archived: boolean
          is_featured: boolean
          is_published: boolean
          locality: string | null
          need_reason: string | null
          project_date: string | null
          project_type: Database["public"]["Enums"]["project_type"]
          request_id: string | null
          service_id: string | null
          short_description: string | null
          slug: string
          state: string | null
          status: Database["public"]["Enums"]["request_status"]
          title: string
          updated_at: string
          village: string | null
        }
        Insert: {
          beneficiaries?: number | null
          cover_image?: string | null
          created_at?: string
          currency?: string
          description?: string | null
          estimated_cost?: number | null
          id?: string
          is_archived?: boolean
          is_featured?: boolean
          is_published?: boolean
          locality?: string | null
          need_reason?: string | null
          project_date?: string | null
          project_type: Database["public"]["Enums"]["project_type"]
          request_id?: string | null
          service_id?: string | null
          short_description?: string | null
          slug: string
          state?: string | null
          status?: Database["public"]["Enums"]["request_status"]
          title: string
          updated_at?: string
          village?: string | null
        }
        Update: {
          beneficiaries?: number | null
          cover_image?: string | null
          created_at?: string
          currency?: string
          description?: string | null
          estimated_cost?: number | null
          id?: string
          is_archived?: boolean
          is_featured?: boolean
          is_published?: boolean
          locality?: string | null
          need_reason?: string | null
          project_date?: string | null
          project_type?: Database["public"]["Enums"]["project_type"]
          request_id?: string | null
          service_id?: string | null
          short_description?: string | null
          slug?: string
          state?: string | null
          status?: Database["public"]["Enums"]["request_status"]
          title?: string
          updated_at?: string
          village?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "projects_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "project_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      services: {
        Row: {
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          is_published: boolean
          name: string
          project_type: Database["public"]["Enums"]["project_type"] | null
          short_description: string | null
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_published?: boolean
          name: string
          project_type?: Database["public"]["Enums"]["project_type"] | null
          short_description?: string | null
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_published?: boolean
          name?: string
          project_type?: Database["public"]["Enums"]["project_type"] | null
          short_description?: string | null
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          address: string | null
          email: string | null
          facebook: string | null
          id: number
          instagram: string | null
          linkedin: string | null
          phone: string | null
          twitter: string | null
          updated_at: string
          whatsapp: string | null
          youtube: string | null
        }
        Insert: {
          address?: string | null
          email?: string | null
          facebook?: string | null
          id?: number
          instagram?: string | null
          linkedin?: string | null
          phone?: string | null
          twitter?: string | null
          updated_at?: string
          whatsapp?: string | null
          youtube?: string | null
        }
        Update: {
          address?: string | null
          email?: string | null
          facebook?: string | null
          id?: number
          instagram?: string | null
          linkedin?: string | null
          phone?: string | null
          twitter?: string | null
          updated_at?: string
          whatsapp?: string | null
          youtube?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_exists: { Args: never; Returns: boolean }
      claim_first_admin: { Args: never; Returns: boolean }
      grant_admin_by_email: { Args: { _email: string }; Returns: boolean }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      list_admins: {
        Args: never
        Returns: {
          created_at: string
          email: string
          user_id: string
        }[]
      }
      revoke_admin: { Args: { _user_id: string }; Returns: undefined }
    }
    Enums: {
      app_role: "admin"
      donor_status: "new" | "contacted" | "following" | "completed"
      project_type:
        | "cooler"
        | "well_drilling"
        | "solar"
        | "well_maintenance"
        | "other"
      request_status:
        | "new"
        | "reviewing"
        | "approved"
        | "rejected"
        | "published"
        | "funded"
        | "in_progress"
        | "completed"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      app_role: ["admin"],
      donor_status: ["new", "contacted", "following", "completed"],
      project_type: [
        "cooler",
        "well_drilling",
        "solar",
        "well_maintenance",
        "other",
      ],
      request_status: [
        "new",
        "reviewing",
        "approved",
        "rejected",
        "published",
        "funded",
        "in_progress",
        "completed",
      ],
    },
  },
} as const
