export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  public: {
    Tables: {
      guest_profiles: {
        Row: {
          id: string;
          last_seen_at: string;
        };
        Insert: {
          id: string;
          last_seen_at?: string;
        };
        Update: {
          id?: string;
          last_seen_at?: string;
        };
        Relationships: [];
      };
      messages: {
        Row: {
          content: string;
          content_type: string;
          created_at: string;
          id: string;
          room_id: string | null;
          sender_id: string | null;
          session_id: string | null;
        };
        Insert: {
          content: string;
          content_type: string;
          created_at?: string;
          id?: string;
          room_id?: string | null;
          sender_id?: string | null;
          session_id?: string | null;
        };
        Update: {
          content?: string;
          content_type?: string;
          created_at?: string;
          id?: string;
          room_id?: string | null;
          sender_id?: string | null;
          session_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "messages_room_id_fkey";
            columns: ["room_id"];
            isOneToOne: false;
            referencedRelation: "rooms";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "messages_session_id_fkey";
            columns: ["session_id"];
            isOneToOne: false;
            referencedRelation: "random_sessions";
            referencedColumns: ["id"];
          },
        ];
      };
      profiles: {
        Row: {
          age: number | null;
          avatar_url: string | null;
          created_at: string;
          email: string | null;
          full_name: string | null;
          gender: string | null;
          id: string;
          last_seen_at: string;
          role: string;
          updated_at: string | null;
          username: string | null;
          website: string | null;
        };
        Insert: {
          age?: number | null;
          avatar_url?: string | null;
          created_at?: string;
          email?: string | null;
          full_name?: string | null;
          gender?: string | null;
          id: string;
          last_seen_at?: string;
          role?: string;
          updated_at?: string | null;
          username?: string | null;
          website?: string | null;
        };
        Update: {
          age?: number | null;
          avatar_url?: string | null;
          created_at?: string;
          email?: string | null;
          full_name?: string | null;
          gender?: string | null;
          id?: string;
          last_seen_at?: string;
          role?: string;
          updated_at?: string | null;
          username?: string | null;
          website?: string | null;
        };
        Relationships: [];
      };
      random_queue: {
        Row: {
          last_seen_at: string;
          queued_at: string;
          user_id: string;
        };
        Insert: {
          last_seen_at?: string;
          queued_at?: string;
          user_id: string;
        };
        Update: {
          last_seen_at?: string;
          queued_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      random_session_archives: {
        Row: {
          archived_at: string;
          ended_at: string;
          ended_by: string | null;
          id: string;
          messages: Json;
          original_session_id: string;
          started_at: string;
          user_a_id: string;
          user_b_id: string;
        };
        Insert: {
          archived_at?: string;
          ended_at: string;
          ended_by?: string | null;
          id?: string;
          messages?: Json;
          original_session_id: string;
          started_at: string;
          user_a_id: string;
          user_b_id: string;
        };
        Update: {
          archived_at?: string;
          ended_at?: string;
          ended_by?: string | null;
          id?: string;
          messages?: Json;
          original_session_id?: string;
          started_at?: string;
          user_a_id?: string;
          user_b_id?: string;
        };
        Relationships: [];
      };
      random_sessions: {
        Row: {
          ended_at: string | null;
          ended_by: string | null;
          id: string;
          last_seen_a_at: string;
          last_seen_b_at: string;
          started_at: string;
          status: string;
          user_a_id: string;
          user_b_id: string;
        };
        Insert: {
          ended_at?: string | null;
          ended_by?: string | null;
          id?: string;
          last_seen_a_at?: string;
          last_seen_b_at?: string;
          started_at?: string;
          status?: string;
          user_a_id: string;
          user_b_id: string;
        };
        Update: {
          ended_at?: string | null;
          ended_by?: string | null;
          id?: string;
          last_seen_a_at?: string;
          last_seen_b_at?: string;
          started_at?: string;
          status?: string;
          user_a_id?: string;
          user_b_id?: string;
        };
        Relationships: [];
      };
      rate_limit_events: {
        Row: {
          action: string;
          created_at: string;
          user_id: string;
        };
        Insert: {
          action: string;
          created_at?: string;
          user_id: string;
        };
        Update: {
          action?: string;
          created_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      room_archives: {
        Row: {
          archived_at: string;
          created_at: string;
          id: string;
          is_private: boolean;
          max_members: number;
          member_ids: string[];
          messages: Json;
          original_room_id: string;
          owner_id: string | null;
          title: string;
        };
        Insert: {
          archived_at?: string;
          created_at: string;
          id?: string;
          is_private: boolean;
          max_members: number;
          member_ids?: string[];
          messages?: Json;
          original_room_id: string;
          owner_id?: string | null;
          title: string;
        };
        Update: {
          archived_at?: string;
          created_at?: string;
          id?: string;
          is_private?: boolean;
          max_members?: number;
          member_ids?: string[];
          messages?: Json;
          original_room_id?: string;
          owner_id?: string | null;
          title?: string;
        };
        Relationships: [];
      };
      room_bans: {
        Row: {
          banned_at: string;
          banned_by: string | null;
          room_id: string;
          user_id: string;
        };
        Insert: {
          banned_at?: string;
          banned_by?: string | null;
          room_id: string;
          user_id: string;
        };
        Update: {
          banned_at?: string;
          banned_by?: string | null;
          room_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "room_bans_banned_by_fkey";
            columns: ["banned_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "room_bans_room_id_fkey";
            columns: ["room_id"];
            isOneToOne: false;
            referencedRelation: "rooms";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "room_bans_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      room_members: {
        Row: {
          id: string;
          joined_at: string;
          role: string;
          room_id: string;
          user_id: string;
        };
        Insert: {
          id?: string;
          joined_at?: string;
          role?: string;
          room_id: string;
          user_id: string;
        };
        Update: {
          id?: string;
          joined_at?: string;
          role?: string;
          room_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "room_members_room_id_fkey";
            columns: ["room_id"];
            isOneToOne: false;
            referencedRelation: "rooms";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "room_members_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      rooms: {
        Row: {
          created_at: string;
          id: string;
          is_private: boolean;
          max_members: number;
          owner_id: string;
          password_hash: string | null;
          title: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          is_private?: boolean;
          max_members: number;
          owner_id: string;
          password_hash?: string | null;
          title: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          is_private?: boolean;
          max_members?: number;
          owner_id?: string;
          password_hash?: string | null;
          title?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "rooms_owner_id_fkey";
            columns: ["owner_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      archive_ended_random_sessions: { Args: never; Returns: undefined };
      cancel_random_queue: { Args: never; Returns: undefined };
      check_and_record_rate_limit: {
        Args: {
          p_action: string;
          p_max_count: number;
          p_window_seconds: number;
        };
        Returns: boolean;
      };
      cleanup_old_random_session_archives: { Args: never; Returns: undefined };
      cleanup_old_rate_limit_events: { Args: never; Returns: undefined };
      cleanup_old_room_archives: { Args: never; Returns: undefined };
      cleanup_stale_anonymous_users: { Args: never; Returns: undefined };
      cleanup_stale_random_queue: { Args: never; Returns: undefined };
      end_abandoned_random_sessions: { Args: never; Returns: undefined };
      end_random_session: { Args: { p_session_id: string }; Returns: undefined };
      heartbeat_random_session: {
        Args: { p_session_id: string };
        Returns: {
          ended_by: string;
          partner_last_seen_at: string;
          status: string;
        }[];
      };
      is_room_member: { Args: { p_room_id: string }; Returns: boolean };
      join_room: {
        Args: { p_password?: string; p_room_id: string };
        Returns: undefined;
      };
      kick_member: {
        Args: { p_room_id: string; p_target_user_id: string };
        Returns: undefined;
      };
      leave_room: { Args: { p_room_id: string }; Returns: undefined };
      list_orphaned_chat_images: { Args: never; Returns: string[] };
      match_or_wait: { Args: never; Returns: string };
      room_member_count: {
        Args: { r: Database["public"]["Tables"]["rooms"]["Row"] };
        Returns: number;
      };
      room_member_joined_at: { Args: { p_room_id: string }; Returns: string };
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

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

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
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
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
