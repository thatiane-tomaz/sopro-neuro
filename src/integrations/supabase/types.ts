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
      app_sessions: {
        Row: {
          id: string
          opened_at: string
          user_id: string
        }
        Insert: {
          id?: string
          opened_at?: string
          user_id: string
        }
        Update: {
          id?: string
          opened_at?: string
          user_id?: string
        }
        Relationships: []
      }
      content_views: {
        Row: {
          content_identifier: string
          content_type: string
          id: string
          user_id: string
          viewed_at: string
        }
        Insert: {
          content_identifier: string
          content_type: string
          id?: string
          user_id: string
          viewed_at?: string
        }
        Update: {
          content_identifier?: string
          content_type?: string
          id?: string
          user_id?: string
          viewed_at?: string
        }
        Relationships: []
      }
      daily_content: {
        Row: {
          created_at: string
          day_number: number
          hypnosis_minutes: number | null
          id: string
          title: string
          updated_at: string
          video_minutes: number | null
          welcome_title: string | null
        }
        Insert: {
          created_at?: string
          day_number: number
          hypnosis_minutes?: number | null
          id?: string
          title: string
          updated_at?: string
          video_minutes?: number | null
          welcome_title?: string | null
        }
        Update: {
          created_at?: string
          day_number?: number
          hypnosis_minutes?: number | null
          id?: string
          title?: string
          updated_at?: string
          video_minutes?: number | null
          welcome_title?: string | null
        }
        Relationships: []
      }
      feedback_responses: {
        Row: {
          comment: string | null
          created_at: string
          day_number: number
          id: string
          question_type: string
          rating: number | null
          response: string | null
          user_id: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          day_number: number
          id?: string
          question_type: string
          rating?: number | null
          response?: string | null
          user_id: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          day_number?: number
          id?: string
          question_type?: string
          rating?: number | null
          response?: string | null
          user_id?: string
        }
        Relationships: []
      }
      journey_tracking: {
        Row: {
          created_at: string
          finished_at: string | null
          id: string
          interaction_type: string
          progress_percentage: number | null
          started_at: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          finished_at?: string | null
          id?: string
          interaction_type: string
          progress_percentage?: number | null
          started_at?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          finished_at?: string | null
          id?: string
          interaction_type?: string
          progress_percentage?: number | null
          started_at?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      onboarding_responses: {
        Row: {
          age: string | null
          completed_at: string
          gender: string | null
          id: string
          smoking_frequency: string | null
          smoking_reasons: string[] | null
          smoking_types: string[] | null
          user_id: string
          weekly_cost: string | null
        }
        Insert: {
          age?: string | null
          completed_at?: string
          gender?: string | null
          id?: string
          smoking_frequency?: string | null
          smoking_reasons?: string[] | null
          smoking_types?: string[] | null
          user_id: string
          weekly_cost?: string | null
        }
        Update: {
          age?: string | null
          completed_at?: string
          gender?: string | null
          id?: string
          smoking_frequency?: string | null
          smoking_reasons?: string[] | null
          smoking_types?: string[] | null
          user_id?: string
          weekly_cost?: string | null
        }
        Relationships: []
      }
      phases: {
        Row: {
          created_at: string
          id: string
          phase_number: number
          subtitle: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          phase_number: number
          subtitle: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          phase_number?: number
          subtitle?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string | null
          email: string | null
          id: string
          onesignal_player_id: string | null
          subscription_status: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          onesignal_player_id?: string | null
          subscription_status?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          onesignal_player_id?: string | null
          subscription_status?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          amount_paid: number | null
          cancellation_notes: string | null
          cancellation_reason:
            | Database["public"]["Enums"]["cancellation_reason"]
            | null
          cancelled_at: string | null
          created_at: string
          email: string | null
          expires_at: string | null
          id: string
          plan_type: string
          previous_status:
            | Database["public"]["Enums"]["subscription_status"]
            | null
          started_at: string
          status: Database["public"]["Enums"]["subscription_status"]
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          amount_paid?: number | null
          cancellation_notes?: string | null
          cancellation_reason?:
            | Database["public"]["Enums"]["cancellation_reason"]
            | null
          cancelled_at?: string | null
          created_at?: string
          email?: string | null
          expires_at?: string | null
          id?: string
          plan_type?: string
          previous_status?:
            | Database["public"]["Enums"]["subscription_status"]
            | null
          started_at?: string
          status?: Database["public"]["Enums"]["subscription_status"]
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          amount_paid?: number | null
          cancellation_notes?: string | null
          cancellation_reason?:
            | Database["public"]["Enums"]["cancellation_reason"]
            | null
          cancelled_at?: string | null
          created_at?: string
          email?: string | null
          expires_at?: string | null
          id?: string
          plan_type?: string
          previous_status?:
            | Database["public"]["Enums"]["subscription_status"]
            | null
          started_at?: string
          status?: Database["public"]["Enums"]["subscription_status"]
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      triggers_content: {
        Row: {
          created_at: string
          description: string
          display_order: number
          duration_minutes: number | null
          file_name: string
          id: string
          is_active: boolean
          section: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description: string
          display_order?: number
          duration_minutes?: number | null
          file_name: string
          id?: string
          is_active?: boolean
          section?: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string
          display_order?: number
          duration_minutes?: number | null
          file_name?: string
          id?: string
          is_active?: boolean
          section?: string
          title?: string
          updated_at?: string
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
      get_current_subscription: {
        Args: { user_uuid: string }
        Returns: {
          amount_paid: number | null
          cancellation_notes: string | null
          cancellation_reason:
            | Database["public"]["Enums"]["cancellation_reason"]
            | null
          cancelled_at: string | null
          created_at: string
          email: string | null
          expires_at: string | null
          id: string
          plan_type: string
          previous_status:
            | Database["public"]["Enums"]["subscription_status"]
            | null
          started_at: string
          status: Database["public"]["Enums"]["subscription_status"]
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          updated_at: string
          user_id: string | null
        }
        SetofOptions: {
          from: "*"
          to: "subscriptions"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      get_day_completion_time: {
        Args: { p_day: number; p_user_id: string }
        Returns: string
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_day_completed: {
        Args: { p_day: number; p_user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
      cancellation_reason:
        | "user_request"
        | "payment_failed"
        | "expired"
        | "upgrade"
        | "downgrade"
        | "admin_action"
      subscription_status: "free" | "premium" | "cancelled" | "expired"
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
      app_role: ["admin", "moderator", "user"],
      cancellation_reason: [
        "user_request",
        "payment_failed",
        "expired",
        "upgrade",
        "downgrade",
        "admin_action",
      ],
      subscription_status: ["free", "premium", "cancelled", "expired"],
    },
  },
} as const
