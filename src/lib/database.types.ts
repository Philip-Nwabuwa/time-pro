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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      event_poll_options: {
        Row: {
          id: string
          option_text: string
          order_index: number | null
          poll_id: string
          vote_count: number | null
        }
        Insert: {
          id?: string
          option_text: string
          order_index?: number | null
          poll_id: string
          vote_count?: number | null
        }
        Update: {
          id?: string
          option_text?: string
          order_index?: number | null
          poll_id?: string
          vote_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "event_poll_options_poll_id_fkey"
            columns: ["poll_id"]
            isOneToOne: false
            referencedRelation: "event_polls"
            referencedColumns: ["id"]
          },
        ]
      }
      event_poll_responses: {
        Row: {
          created_at: string | null
          id: string
          option_id: string
          poll_id: string
          respondent_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          option_id: string
          poll_id: string
          respondent_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          option_id?: string
          poll_id?: string
          respondent_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_poll_responses_option_id_fkey"
            columns: ["option_id"]
            isOneToOne: false
            referencedRelation: "event_poll_options"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_poll_responses_poll_id_fkey"
            columns: ["poll_id"]
            isOneToOne: false
            referencedRelation: "event_polls"
            referencedColumns: ["id"]
          },
        ]
      }
      event_polls: {
        Row: {
          active: boolean | null
          anonymous: boolean | null
          created_at: string | null
          description: string | null
          event_id: string
          id: string
          title: string
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          anonymous?: boolean | null
          created_at?: string | null
          description?: string | null
          event_id: string
          id?: string
          title: string
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          anonymous?: boolean | null
          created_at?: string | null
          description?: string | null
          event_id?: string
          id?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_polls_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_qna_questions: {
        Row: {
          answered: boolean | null
          approved_at: string | null
          approved_by: string | null
          created_at: string | null
          event_id: string | null
          id: string
          question: string
          status: Database["public"]["Enums"]["question_status"]
          updated_at: string | null
        }
        Insert: {
          answered?: boolean | null
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string | null
          event_id?: string | null
          id?: string
          question: string
          status?: Database["public"]["Enums"]["question_status"]
          updated_at?: string | null
        }
        Update: {
          answered?: boolean | null
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string | null
          event_id?: string | null
          id?: string
          question?: string
          status?: Database["public"]["Enums"]["question_status"]
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_qna_questions_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_schedule_items: {
        Row: {
          allocated_minutes: number
          created_at: string | null
          event_id: string | null
          id: string
          max_minutes: number | null
          min_minutes: number | null
          order_index: number
          role: string
          social_media_links: Json | null
          speaker_avatar: string | null
          speaker_bio: string | null
          speaker_email: string | null
          speaker_name: string | null
          target_minutes: number | null
          title: string
          updated_at: string | null
        }
        Insert: {
          allocated_minutes?: number
          created_at?: string | null
          event_id?: string | null
          id?: string
          max_minutes?: number | null
          min_minutes?: number | null
          order_index: number
          role: string
          social_media_links?: Json | null
          speaker_avatar?: string | null
          speaker_bio?: string | null
          speaker_email?: string | null
          speaker_name?: string | null
          target_minutes?: number | null
          title: string
          updated_at?: string | null
        }
        Update: {
          allocated_minutes?: number
          created_at?: string | null
          event_id?: string | null
          id?: string
          max_minutes?: number | null
          min_minutes?: number | null
          order_index?: number
          role?: string
          social_media_links?: Json | null
          speaker_avatar?: string | null
          speaker_bio?: string | null
          speaker_email?: string | null
          speaker_name?: string | null
          target_minutes?: number | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_schedule_items_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_session_data: {
        Row: {
          created_at: string | null
          event_id: string | null
          id: string
          session_data: Json
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          event_id?: string | null
          id?: string
          session_data?: Json
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          event_id?: string | null
          id?: string
          session_data?: Json
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_session_data_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: true
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_session_photos: {
        Row: {
          approved: boolean | null
          approved_at: string | null
          approved_by: string | null
          created_at: string | null
          event_id: string | null
          file_name: string
          file_path: string
          file_size: number | null
          id: string
          mime_type: string | null
          status: Database["public"]["Enums"]["photo_status"]
          updated_at: string | null
          uploaded_by: string | null
        }
        Insert: {
          approved?: boolean | null
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string | null
          event_id?: string | null
          file_name: string
          file_path: string
          file_size?: number | null
          id?: string
          mime_type?: string | null
          status?: Database["public"]["Enums"]["photo_status"]
          updated_at?: string | null
          uploaded_by?: string | null
        }
        Update: {
          approved?: boolean | null
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string | null
          event_id?: string | null
          file_name?: string
          file_path?: string
          file_size?: number | null
          id?: string
          mime_type?: string | null
          status?: Database["public"]["Enums"]["photo_status"]
          updated_at?: string | null
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_session_photos_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          allow_feedback: boolean | null
          anonymous_feedback: boolean | null
          attendees_count: number | null
          configured: boolean | null
          created_at: string | null
          created_by: string | null
          description: string | null
          detailed_speaker_profiles: boolean | null
          estimated_minutes: number | null
          event_date: string
          event_time: string
          id: string
          location: string | null
          page_id: string | null
          roles_count: number | null
          status: string
          title: string
          updated_at: string | null
        }
        Insert: {
          allow_feedback?: boolean | null
          anonymous_feedback?: boolean | null
          attendees_count?: number | null
          configured?: boolean | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          detailed_speaker_profiles?: boolean | null
          estimated_minutes?: number | null
          event_date: string
          event_time: string
          id?: string
          location?: string | null
          page_id?: string | null
          roles_count?: number | null
          status?: string
          title: string
          updated_at?: string | null
        }
        Update: {
          allow_feedback?: boolean | null
          anonymous_feedback?: boolean | null
          attendees_count?: number | null
          configured?: boolean | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          detailed_speaker_profiles?: boolean | null
          estimated_minutes?: number | null
          event_date?: string
          event_time?: string
          id?: string
          location?: string | null
          page_id?: string | null
          roles_count?: number | null
          status?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "events_page_id_fkey"
            columns: ["page_id"]
            isOneToOne: false
            referencedRelation: "pages"
            referencedColumns: ["id"]
          },
        ]
      }
      page_members: {
        Row: {
          id: string
          joined_at: string | null
          page_id: string | null
          role: string
          user_id: string | null
        }
        Insert: {
          id?: string
          joined_at?: string | null
          page_id?: string | null
          role?: string
          user_id?: string | null
        }
        Update: {
          id?: string
          joined_at?: string | null
          page_id?: string | null
          role?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "page_members_page_id_fkey"
            columns: ["page_id"]
            isOneToOne: false
            referencedRelation: "pages"
            referencedColumns: ["id"]
          },
        ]
      }
      pages: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          image_file_path: string | null
          image_url: string | null
          is_private: boolean | null
          pin: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          image_file_path?: string | null
          image_url?: string | null
          is_private?: boolean | null
          pin?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          image_file_path?: string | null
          image_url?: string | null
          is_private?: boolean | null
          pin?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      approve_photo: {
        Args: { approver_id: string; photo_id: string }
        Returns: Json
      }
      get_all_pages_public: {
        Args: Record<PropertyKey, never>
        Returns: {
          created_at: string
          description: string
          id: string
          image_url: string
          is_private: boolean
          title: string
        }[]
      }
      get_event_photos_for_user: {
        Args: { event_id_param: string; user_id_param: string }
        Returns: {
          approved: boolean
          approved_at: string
          approved_by: string
          created_at: string
          event_id: string
          file_name: string
          file_path: string
          file_size: number
          id: string
          mime_type: string
          status: Database["public"]["Enums"]["photo_status"]
          updated_at: string
          uploaded_by: string
          user_role: string
        }[]
      }
      get_page_members_with_user_data: {
        Args: { page_id_param: string }
        Returns: {
          id: string
          joined_at: string
          role: string
          user_avatar_url: string
          user_bio: string
          user_email: string
          user_first_name: string
          user_id: string
          user_last_name: string
          user_linkedin: string
          user_social_links: Json
        }[]
      }
      reject_and_delete_photo: {
        Args: { photo_id: string; rejector_id: string }
        Returns: Json
      }
      update_timer_state: {
        Args: {
          p_accumulated_ms: number
          p_added_time: number
          p_controlled_by: string
          p_current_speaker_index: number
          p_event_id: string
          p_has_started: boolean
          p_is_running: boolean
          p_last_resumed_at: string
        }
        Returns: Json
      }
    }
    Enums: {
      photo_status: "pending" | "accepted" | "rejected"
      question_status: "pending" | "accepted" | "answered" | "rejected"
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
      photo_status: ["pending", "accepted", "rejected"],
      question_status: ["pending", "accepted", "answered", "rejected"],
    },
  },
} as const