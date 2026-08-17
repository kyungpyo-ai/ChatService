export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  public: {
    Tables: {
      account_deletions: {
        Row: {
          deleted_at: string;
          id: string;
          user_id: string;
        };
        Insert: {
          deleted_at?: string;
          id?: string;
          user_id: string;
        };
        Update: {
          deleted_at?: string;
          id?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      admin_audit_logs: {
        Row: {
          action: string;
          admin_id: string | null;
          created_at: string;
          detail: Json | null;
          id: string;
          target_id: string | null;
          target_type: string;
        };
        Insert: {
          action: string;
          admin_id?: string | null;
          created_at?: string;
          detail?: Json | null;
          id?: string;
          target_id?: string | null;
          target_type: string;
        };
        Update: {
          action?: string;
          admin_id?: string | null;
          created_at?: string;
          detail?: Json | null;
          id?: string;
          target_id?: string | null;
          target_type?: string;
        };
        Relationships: [];
      };
      admin_daily_stats: {
        Row: {
          active_rooms: number;
          deleted_users: number;
          new_users: number;
          random_sessions_matched: number;
          recorded_at: string;
          rooms_created: number;
          rooms_deleted: number;
          stat_date: string;
          total_users: number;
        };
        Insert: {
          active_rooms: number;
          deleted_users: number;
          new_users: number;
          random_sessions_matched: number;
          recorded_at?: string;
          rooms_created: number;
          rooms_deleted: number;
          stat_date: string;
          total_users: number;
        };
        Update: {
          active_rooms?: number;
          deleted_users?: number;
          new_users?: number;
          random_sessions_matched?: number;
          recorded_at?: string;
          rooms_created?: number;
          rooms_deleted?: number;
          stat_date?: string;
          total_users?: number;
        };
        Relationships: [];
      };
      daily_active_users: {
        Row: {
          activity_date: string;
          is_guest: boolean;
          user_id: string;
        };
        Insert: {
          activity_date: string;
          is_guest: boolean;
          user_id: string;
        };
        Update: {
          activity_date?: string;
          is_guest?: boolean;
          user_id?: string;
        };
        Relationships: [];
      };
      dm_conversations: {
        Row: {
          created_at: string;
          id: string;
          last_message_at: string;
          user_a_id: string;
          user_b_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          last_message_at?: string;
          user_a_id: string;
          user_b_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          last_message_at?: string;
          user_a_id?: string;
          user_b_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "dm_conversations_user_a_id_fkey";
            columns: ["user_a_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "dm_conversations_user_b_id_fkey";
            columns: ["user_b_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
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
          dm_conversation_id: string | null;
          id: string;
          room_id: string | null;
          sender_id: string | null;
          session_id: string | null;
        };
        Insert: {
          content: string;
          content_type: string;
          created_at?: string;
          dm_conversation_id?: string | null;
          id?: string;
          room_id?: string | null;
          sender_id?: string | null;
          session_id?: string | null;
        };
        Update: {
          content?: string;
          content_type?: string;
          created_at?: string;
          dm_conversation_id?: string | null;
          id?: string;
          room_id?: string | null;
          sender_id?: string | null;
          session_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "messages_dm_conversation_id_fkey";
            columns: ["dm_conversation_id"];
            isOneToOne: false;
            referencedRelation: "dm_conversations";
            referencedColumns: ["id"];
          },
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
          room_heartbeat_at: string | null;
          room_heartbeat_room_id: string | null;
          suspended_at: string | null;
          suspended_reason: string | null;
          suspended_until: string | null;
          terms_accepted_at: string | null;
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
          room_heartbeat_at?: string | null;
          room_heartbeat_room_id?: string | null;
          suspended_at?: string | null;
          suspended_reason?: string | null;
          suspended_until?: string | null;
          terms_accepted_at?: string | null;
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
          room_heartbeat_at?: string | null;
          room_heartbeat_room_id?: string | null;
          suspended_at?: string | null;
          suspended_reason?: string | null;
          suspended_until?: string | null;
          terms_accepted_at?: string | null;
          updated_at?: string | null;
          username?: string | null;
          website?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "profiles_room_heartbeat_room_id_fkey";
            columns: ["room_heartbeat_room_id"];
            isOneToOne: false;
            referencedRelation: "rooms";
            referencedColumns: ["id"];
          },
        ];
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
      reports: {
        Row: {
          action_taken: string | null;
          created_at: string;
          detail: string | null;
          id: string;
          reason: string;
          reporter_id: string | null;
          reviewed_at: string | null;
          reviewed_by: string | null;
          status: string;
          target_id: string;
          target_type: string;
        };
        Insert: {
          action_taken?: string | null;
          created_at?: string;
          detail?: string | null;
          id?: string;
          reason: string;
          reporter_id?: string | null;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          status?: string;
          target_id: string;
          target_type: string;
        };
        Update: {
          action_taken?: string | null;
          created_at?: string;
          detail?: string | null;
          id?: string;
          reason?: string;
          reporter_id?: string | null;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          status?: string;
          target_id?: string;
          target_type?: string;
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
      admin_compute_live_stats: {
        Args: never;
        Returns: {
          active_rooms: number;
          dau: number;
          deleted_users: number;
          guest_count: number;
          new_users: number;
          online_count: number;
          pending_reports: number;
          random_active_participants: number;
          random_queue_waiting_count: number;
          random_sessions_matched: number;
          rooms_created: number;
          rooms_deleted: number;
          total_users: number;
        }[];
      };
      admin_dismiss_report: {
        Args: { p_report_id: string };
        Returns: undefined;
      };
      admin_force_delete_room: {
        Args: { p_reason?: string; p_room_id: string };
        Returns: undefined;
      };
      admin_force_end_random_session: {
        Args: { p_reason?: string; p_session_id: string };
        Returns: undefined;
      };
      admin_get_cron_job_status: {
        Args: never;
        Returns: {
          active: boolean;
          jobid: number;
          jobname: string;
          last_end_time: string;
          last_return_message: string;
          last_start_time: string;
          last_status: string;
          schedule: string;
        }[];
      };
      admin_get_daily_stats: {
        Args: { p_date_from: string; p_date_to: string };
        Returns: {
          active_rooms: number;
          deleted_users: number;
          new_users: number;
          random_sessions_matched: number;
          rooms_created: number;
          rooms_deleted: number;
          stat_date: string;
          total_users: number;
        }[];
      };
      admin_get_dashboard_stats: {
        Args: never;
        Returns: {
          active_rooms: number;
          dau: number;
          deleted_users_today: number;
          guest_count: number;
          new_users_today: number;
          online_count: number;
          pending_reports: number;
          random_active_participants: number;
          random_queue_waiting_count: number;
          random_sessions_matched_today: number;
          rooms_created_today: number;
          rooms_deleted_today: number;
          total_users: number;
        }[];
      };
      admin_get_random_archive_detail: {
        Args: { p_archive_id: string };
        Returns: {
          archived_at: string;
          ended_at: string;
          ended_by: string;
          id: string;
          messages: Json;
          original_session_id: string;
          started_at: string;
          user_a_id: string;
          user_b_id: string;
        }[];
      };
      admin_get_random_archive_list: {
        Args: { p_date_from?: string; p_date_to?: string; p_query?: string };
        Returns: {
          archived_at: string;
          ended_at: string;
          id: string;
          original_session_id: string;
          started_at: string;
          user_a_id: string;
          user_b_id: string;
        }[];
      };
      admin_get_random_session_messages: {
        Args: { p_session_id: string };
        Returns: {
          content: string;
          content_type: string;
          created_at: string;
          id: string;
          sender_id: string;
        }[];
      };
      admin_get_rate_limit_anomalies: {
        Args: { p_limit?: number; p_window_hours?: number };
        Returns: {
          action: string;
          event_count: number;
          user_id: string;
          username: string;
        }[];
      };
      admin_get_room_archive_detail: {
        Args: { p_archive_id: string };
        Returns: {
          archived_at: string;
          created_at: string;
          id: string;
          is_private: boolean;
          max_members: number;
          member_ids: string[];
          messages: Json;
          original_room_id: string;
          owner_id: string;
          title: string;
        }[];
      };
      admin_get_room_archive_list: {
        Args: { p_query?: string };
        Returns: {
          archived_at: string;
          id: string;
          is_private: boolean;
          member_count: number;
          original_room_id: string;
          owner_id: string;
          title: string;
        }[];
      };
      admin_get_room_members: {
        Args: { p_room_id: string };
        Returns: {
          avatar_url: string;
          joined_at: string;
          nickname: string;
          role: string;
          user_id: string;
        }[];
      };
      admin_get_room_messages: {
        Args: { p_room_id: string };
        Returns: {
          content: string;
          content_type: string;
          created_at: string;
          id: string;
          sender_id: string;
        }[];
      };
      admin_get_user_detail: {
        Args: { p_user_id: string };
        Returns: {
          age: number;
          created_at: string;
          email: string;
          full_name: string;
          gender: string;
          id: string;
          last_seen_at: string;
          report_count: number;
          role: string;
          room_count: number;
          suspended_at: string;
          suspended_reason: string;
          suspended_until: string;
          username: string;
        }[];
      };
      admin_log_action: {
        Args: {
          p_action: string;
          p_detail?: Json;
          p_target_id: string;
          p_target_type: string;
        };
        Returns: undefined;
      };
      admin_resolve_report: {
        Args: { p_action_taken: string; p_report_id: string };
        Returns: undefined;
      };
      admin_search_messages: {
        Args: {
          p_date_from: string;
          p_date_to: string;
          p_query: string;
          p_scope?: string;
        };
        Returns: {
          content: string;
          context_id: string;
          created_at: string;
          sender_id: string;
          source: string;
        }[];
      };
      admin_search_random_sessions: {
        Args: { p_query?: string };
        Returns: {
          id: string;
          started_at: string;
          status: string;
          user_a_id: string;
          user_b_id: string;
        }[];
      };
      admin_search_rooms: {
        Args: { p_query?: string };
        Returns: {
          created_at: string;
          id: string;
          is_private: boolean;
          max_members: number;
          member_count: number;
          owner_id: string;
          owner_nickname: string;
          title: string;
        }[];
      };
      admin_search_users: {
        Args: { p_query?: string };
        Returns: {
          age: number;
          created_at: string;
          email: string;
          full_name: string;
          gender: string;
          id: string;
          last_seen_at: string;
          role: string;
          suspended_at: string;
          suspended_reason: string;
          suspended_until: string;
          username: string;
        }[];
      };
      admin_suspend_user: {
        Args: { p_reason: string; p_until?: string; p_user_id: string };
        Returns: undefined;
      };
      admin_unsuspend_user: { Args: { p_user_id: string }; Returns: undefined };
      archive_and_delete_room: {
        Args: { p_room_id: string };
        Returns: undefined;
      };
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
      cleanup_old_daily_active_users: { Args: never; Returns: undefined };
      cleanup_old_random_session_archives: { Args: never; Returns: undefined };
      cleanup_old_rate_limit_events: { Args: never; Returns: undefined };
      cleanup_old_room_archives: { Args: never; Returns: undefined };
      cleanup_stale_anonymous_users: { Args: never; Returns: undefined };
      cleanup_stale_random_queue: { Args: never; Returns: undefined };
      end_abandoned_random_sessions: { Args: never; Returns: undefined };
      end_random_session: { Args: { p_session_id: string }; Returns: undefined };
      heartbeat_random_session: {
        Args: { p_session_id: string; p_stale_seconds?: number };
        Returns: {
          ended_by: string;
          partner_stale: boolean;
          status: string;
        }[];
      };
      heartbeat_room_presence: {
        Args: { p_room_id: string };
        Returns: undefined;
      };
      is_admin: { Args: never; Returns: boolean };
      is_room_member: { Args: { p_room_id: string }; Returns: boolean };
      is_user_suspended: { Args: { p_user_id?: string }; Returns: boolean };
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
      record_daily_activity: { Args: never; Returns: undefined };
      record_daily_stats_snapshot: { Args: never; Returns: undefined };
      room_member_count: {
        Args: { r: Database["public"]["Tables"]["rooms"]["Row"] };
        Returns: number;
      };
      room_member_joined_at: { Args: { p_room_id: string }; Returns: string };
      rooms_with_online_member: {
        Args: { p_room_ids: string[]; p_threshold: string };
        Returns: string[];
      };
      start_or_get_dm_conversation: {
        Args: { p_target_user_id: string };
        Returns: string;
      };
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
