export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.4";
  };
  public: {
    Tables: {
      event_qna_questions: {
        Row: {
          answered: boolean | null;
          created_at: string | null;
          event_id: string | null;
          id: string;
          question: string;
          updated_at: string | null;
        };
        Insert: {
          answered?: boolean | null;
          created_at?: string | null;
          event_id?: string | null;
          id?: string;
          question: string;
          updated_at?: string | null;
        };
        Update: {
          answered?: boolean | null;
          created_at?: string | null;
          event_id?: string | null;
          id?: string;
          question?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "event_qna_questions_event_id_fkey";
            columns: ["event_id"];
            isOneToOne: false;
            referencedRelation: "events";
            referencedColumns: ["id"];
          },
        ];
      };
      event_schedule_items: {
        Row: {
          allocated_minutes: number;
          created_at: string | null;
          event_id: string | null;
          id: string;
          max_minutes: number | null;
          min_minutes: number | null;
          order_index: number;
          role: string;
          social_media_links: Json | null;
          speaker_avatar: string | null;
          speaker_bio: string | null;
          speaker_email: string | null;
          speaker_name: string | null;
          target_minutes: number | null;
          title: string;
          updated_at: string | null;
        };
        Insert: {
          allocated_minutes?: number;
          created_at?: string | null;
          event_id?: string | null;
          id?: string;
          max_minutes?: number | null;
          min_minutes?: number | null;
          order_index: number;
          role: string;
          social_media_links?: Json | null;
          speaker_avatar?: string | null;
          speaker_bio?: string | null;
          speaker_email?: string | null;
          speaker_name?: string | null;
          target_minutes?: number | null;
          title: string;
          updated_at?: string | null;
        };
        Update: {
          allocated_minutes?: number;
          created_at?: string | null;
          event_id?: string | null;
          id?: string;
          max_minutes?: number | null;
          min_minutes?: number | null;
          order_index?: number;
          role?: string;
          social_media_links?: Json | null;
          speaker_avatar?: string | null;
          speaker_bio?: string | null;
          speaker_email?: string | null;
          speaker_name?: string | null;
          target_minutes?: number | null;
          title?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "event_schedule_items_event_id_fkey";
            columns: ["event_id"];
            isOneToOne: false;
            referencedRelation: "events";
            referencedColumns: ["id"];
          },
        ];
      };
      event_session_data: {
        Row: {
          created_at: string | null;
          event_id: string | null;
          id: string;
          session_data: Json;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string | null;
          event_id?: string | null;
          id?: string;
          session_data?: Json;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string | null;
          event_id?: string | null;
          id?: string;
          session_data?: Json;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "event_session_data_event_id_fkey";
            columns: ["event_id"];
            isOneToOne: false;
            referencedRelation: "events";
            referencedColumns: ["id"];
          },
        ];
      };
      event_session_photos: {
        Row: {
          created_at: string | null;
          event_id: string | null;
          file_name: string;
          file_path: string;
          file_size: number | null;
          id: string;
          mime_type: string | null;
          uploaded_by: string | null;
        };
        Insert: {
          created_at?: string | null;
          event_id?: string | null;
          file_name: string;
          file_path: string;
          file_size?: number | null;
          id?: string;
          mime_type?: string | null;
          uploaded_by?: string | null;
        };
        Update: {
          created_at?: string | null;
          event_id?: string | null;
          file_name?: string;
          file_path?: string;
          file_size?: number | null;
          id?: string;
          mime_type?: string | null;
          uploaded_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "event_session_photos_event_id_fkey";
            columns: ["event_id"];
            isOneToOne: false;
            referencedRelation: "events";
            referencedColumns: ["id"];
          },
        ];
      };
      events: {
        Row: {
          allow_feedback: boolean | null;
          anonymous_feedback: boolean | null;
          attendees_count: number | null;
          configured: boolean | null;
          created_at: string | null;
          created_by: string | null;
          description: string | null;
          detailed_speaker_profiles: boolean | null;
          estimated_minutes: number | null;
          event_date: string;
          event_time: string;
          id: string;
          location: string | null;
          page_id: string | null;
          roles_count: number | null;
          status: string;
          title: string;
          updated_at: string | null;
        };
        Insert: {
          allow_feedback?: boolean | null;
          anonymous_feedback?: boolean | null;
          attendees_count?: number | null;
          configured?: boolean | null;
          created_at?: string | null;
          created_by?: string | null;
          description?: string | null;
          detailed_speaker_profiles?: boolean | null;
          estimated_minutes?: number | null;
          event_date: string;
          event_time: string;
          id?: string;
          location?: string | null;
          page_id?: string | null;
          roles_count?: number | null;
          status?: string;
          title: string;
          updated_at?: string | null;
        };
        Update: {
          allow_feedback?: boolean | null;
          anonymous_feedback?: boolean | null;
          attendees_count?: number | null;
          configured?: boolean | null;
          created_at?: string | null;
          created_by?: string | null;
          description?: string | null;
          detailed_speaker_profiles?: boolean | null;
          estimated_minutes?: number | null;
          event_date?: string;
          event_time?: string;
          id?: string;
          location?: string | null;
          page_id?: string | null;
          roles_count?: number | null;
          status?: string;
          title?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "events_page_id_fkey";
            columns: ["page_id"];
            isOneToOne: false;
            referencedRelation: "pages";
            referencedColumns: ["id"];
          },
        ];
      };
      page_members: {
        Row: {
          id: string;
          joined_at: string | null;
          page_id: string | null;
          role: string;
          user_id: string | null;
        };
        Insert: {
          id?: string;
          joined_at?: string | null;
          page_id?: string | null;
          role?: string;
          user_id?: string | null;
        };
        Update: {
          id?: string;
          joined_at?: string | null;
          page_id?: string | null;
          role?: string;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "page_members_page_id_fkey";
            columns: ["page_id"];
            isOneToOne: false;
            referencedRelation: "pages";
            referencedColumns: ["id"];
          },
        ];
      };
      pages: {
        Row: {
          created_at: string | null;
          created_by: string | null;
          description: string | null;
          id: string;
          title: string;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string | null;
          created_by?: string | null;
          description?: string | null;
          id?: string;
          title: string;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string | null;
          created_by?: string | null;
          description?: string | null;
          id?: string;
          title?: string;
          updated_at?: string | null;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<
  keyof Database,
  "public"
>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {},
  },
} as const;