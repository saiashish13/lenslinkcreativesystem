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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      availability_slots: {
        Row: {
          created_at: string
          creator_id: string
          end_time: string
          id: string
          is_booked: boolean
          listing_id: string | null
          note: string | null
          slot_date: string
          start_time: string
        }
        Insert: {
          created_at?: string
          creator_id: string
          end_time?: string
          id?: string
          is_booked?: boolean
          listing_id?: string | null
          note?: string | null
          slot_date: string
          start_time?: string
        }
        Update: {
          created_at?: string
          creator_id?: string
          end_time?: string
          id?: string
          is_booked?: boolean
          listing_id?: string | null
          note?: string | null
          slot_date?: string
          start_time?: string
        }
        Relationships: [
          {
            foreignKeyName: "availability_slots_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "creator_listings"
            referencedColumns: ["id"]
          },
        ]
      }
      bookings: {
        Row: {
          budget_inr: number | null
          category: string
          city: string | null
          created_at: string
          creator_user_id: string | null
          customer_id: string
          event_date: string | null
          id: string
          listing_id: string | null
          professional_handle: string | null
          professional_name: string
          requirements: string | null
          status: Database["public"]["Enums"]["booking_status"]
          updated_at: string
        }
        Insert: {
          budget_inr?: number | null
          category: string
          city?: string | null
          created_at?: string
          creator_user_id?: string | null
          customer_id: string
          event_date?: string | null
          id?: string
          listing_id?: string | null
          professional_handle?: string | null
          professional_name: string
          requirements?: string | null
          status?: Database["public"]["Enums"]["booking_status"]
          updated_at?: string
        }
        Update: {
          budget_inr?: number | null
          category?: string
          city?: string | null
          created_at?: string
          creator_user_id?: string | null
          customer_id?: string
          event_date?: string | null
          id?: string
          listing_id?: string | null
          professional_handle?: string | null
          professional_name?: string
          requirements?: string | null
          status?: Database["public"]["Enums"]["booking_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookings_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "creator_listings"
            referencedColumns: ["id"]
          },
        ]
      }
      claim_requests: {
        Row: {
          business_email: string | null
          claimant_user_id: string
          created_at: string
          id: string
          listing_id: string
          notes: string | null
          proof_url: string | null
          rejection_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["claim_status"]
          updated_at: string
        }
        Insert: {
          business_email?: string | null
          claimant_user_id: string
          created_at?: string
          id?: string
          listing_id: string
          notes?: string | null
          proof_url?: string | null
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["claim_status"]
          updated_at?: string
        }
        Update: {
          business_email?: string | null
          claimant_user_id?: string
          created_at?: string
          id?: string
          listing_id?: string
          notes?: string | null
          proof_url?: string | null
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["claim_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "claim_requests_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "creator_listings"
            referencedColumns: ["id"]
          },
        ]
      }
      creator_listings: {
        Row: {
          avatar_url: string | null
          bio: string | null
          business_name: string
          categories: string[]
          city: string | null
          country: string | null
          cover_url: string | null
          created_at: string
          display_name: string | null
          email: string | null
          formatted_address: string | null
          google_place_id: string | null
          id: string
          instagram: string | null
          is_published: boolean
          lat: number | null
          lng: number | null
          max_price_inr: number | null
          min_price_inr: number | null
          owner_user_id: string | null
          phone: string | null
          places_last_synced_at: string | null
          places_rating: number | null
          places_review_count: number | null
          response_time_hours: number | null
          slug: string
          source: Database["public"]["Enums"]["listing_source"]
          specialties: string[]
          state: string | null
          tagline: string | null
          updated_at: string
          verification_status: Database["public"]["Enums"]["verification_status"]
          website: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          business_name: string
          categories?: string[]
          city?: string | null
          country?: string | null
          cover_url?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          formatted_address?: string | null
          google_place_id?: string | null
          id?: string
          instagram?: string | null
          is_published?: boolean
          lat?: number | null
          lng?: number | null
          max_price_inr?: number | null
          min_price_inr?: number | null
          owner_user_id?: string | null
          phone?: string | null
          places_last_synced_at?: string | null
          places_rating?: number | null
          places_review_count?: number | null
          response_time_hours?: number | null
          slug: string
          source?: Database["public"]["Enums"]["listing_source"]
          specialties?: string[]
          state?: string | null
          tagline?: string | null
          updated_at?: string
          verification_status?: Database["public"]["Enums"]["verification_status"]
          website?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          business_name?: string
          categories?: string[]
          city?: string | null
          country?: string | null
          cover_url?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          formatted_address?: string | null
          google_place_id?: string | null
          id?: string
          instagram?: string | null
          is_published?: boolean
          lat?: number | null
          lng?: number | null
          max_price_inr?: number | null
          min_price_inr?: number | null
          owner_user_id?: string | null
          phone?: string | null
          places_last_synced_at?: string | null
          places_rating?: number | null
          places_review_count?: number | null
          response_time_hours?: number | null
          slug?: string
          source?: Database["public"]["Enums"]["listing_source"]
          specialties?: string[]
          state?: string | null
          tagline?: string | null
          updated_at?: string
          verification_status?: Database["public"]["Enums"]["verification_status"]
          website?: string | null
        }
        Relationships: []
      }
      editor_assignments: {
        Row: {
          booking_id: string | null
          brief: string | null
          budget_inr: number | null
          category: string | null
          created_at: string
          creator_user_id: string
          deadline: string | null
          editor_user_id: string | null
          id: string
          status: Database["public"]["Enums"]["editor_status"]
          title: string
          updated_at: string
        }
        Insert: {
          booking_id?: string | null
          brief?: string | null
          budget_inr?: number | null
          category?: string | null
          created_at?: string
          creator_user_id: string
          deadline?: string | null
          editor_user_id?: string | null
          id?: string
          status?: Database["public"]["Enums"]["editor_status"]
          title: string
          updated_at?: string
        }
        Update: {
          booking_id?: string | null
          brief?: string | null
          budget_inr?: number | null
          category?: string | null
          created_at?: string
          creator_user_id?: string
          deadline?: string | null
          editor_user_id?: string | null
          id?: string
          status?: Database["public"]["Enums"]["editor_status"]
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      favorites: {
        Row: {
          created_at: string
          customer_id: string
          id: string
          listing_id: string | null
          professional_handle: string | null
        }
        Insert: {
          created_at?: string
          customer_id: string
          id?: string
          listing_id?: string | null
          professional_handle?: string | null
        }
        Update: {
          created_at?: string
          customer_id?: string
          id?: string
          listing_id?: string | null
          professional_handle?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "favorites_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "creator_listings"
            referencedColumns: ["id"]
          },
        ]
      }
      listing_photos: {
        Row: {
          attribution_html: string | null
          created_at: string
          height: number | null
          id: string
          listing_id: string
          position: number
          source: Database["public"]["Enums"]["photo_source"]
          url: string
          width: number | null
        }
        Insert: {
          attribution_html?: string | null
          created_at?: string
          height?: number | null
          id?: string
          listing_id: string
          position?: number
          source?: Database["public"]["Enums"]["photo_source"]
          url: string
          width?: number | null
        }
        Update: {
          attribution_html?: string | null
          created_at?: string
          height?: number | null
          id?: string
          listing_id?: string
          position?: number
          source?: Database["public"]["Enums"]["photo_source"]
          url?: string
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "listing_photos_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "creator_listings"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          body: string
          booking_id: string
          created_at: string
          id: string
          read_at: string | null
          sender_id: string
        }
        Insert: {
          body: string
          booking_id: string
          created_at?: string
          id?: string
          read_at?: string | null
          sender_id: string
        }
        Update: {
          body?: string
          booking_id?: string
          created_at?: string
          id?: string
          read_at?: string | null
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          id: string
          kind: string
          link: string | null
          read_at: string | null
          title: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          kind: string
          link?: string | null
          read_at?: string | null
          title: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          kind?: string
          link?: string | null
          read_at?: string | null
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      places_search_log: {
        Row: {
          created_at: string
          id: string
          ip: string | null
          query: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          ip?: string | null
          query?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          ip?: string | null
          query?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      portfolio_items: {
        Row: {
          created_at: string
          creator_id: string
          description: string | null
          id: string
          listing_id: string | null
          media_url: string
          tags: string[] | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          creator_id: string
          description?: string | null
          id?: string
          listing_id?: string | null
          media_url: string
          tags?: string[] | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          creator_id?: string
          description?: string | null
          id?: string
          listing_id?: string | null
          media_url?: string
          tags?: string[] | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "portfolio_items_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "creator_listings"
            referencedColumns: ["id"]
          },
        ]
      }
      pricing_packages: {
        Row: {
          created_at: string
          creator_id: string
          delivery_days: number
          description: string | null
          id: string
          is_active: boolean
          listing_id: string | null
          price_inr: number
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          creator_id: string
          delivery_days?: number
          description?: string | null
          id?: string
          is_active?: boolean
          listing_id?: string | null
          price_inr: number
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          creator_id?: string
          delivery_days?: number
          description?: string | null
          id?: string
          is_active?: boolean
          listing_id?: string | null
          price_inr?: number
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pricing_packages_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "creator_listings"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          city: string | null
          created_at: string
          full_name: string | null
          id: string
          phone: string | null
          pref_lat: number | null
          pref_lng: number | null
          pref_location_label: string | null
          pref_location_source: string | null
          pref_radius_km: number | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          city?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          phone?: string | null
          pref_lat?: number | null
          pref_lng?: number | null
          pref_location_label?: string | null
          pref_location_source?: string | null
          pref_radius_km?: number | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          city?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          pref_lat?: number | null
          pref_lng?: number | null
          pref_location_label?: string | null
          pref_location_source?: string | null
          pref_radius_km?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      project_files: {
        Row: {
          assignment_id: string
          created_at: string
          file_url: string
          id: string
          kind: Database["public"]["Enums"]["file_kind"]
          note: string | null
          uploaded_by: string
          version: number
        }
        Insert: {
          assignment_id: string
          created_at?: string
          file_url: string
          id?: string
          kind?: Database["public"]["Enums"]["file_kind"]
          note?: string | null
          uploaded_by: string
          version?: number
        }
        Update: {
          assignment_id?: string
          created_at?: string
          file_url?: string
          id?: string
          kind?: Database["public"]["Enums"]["file_kind"]
          note?: string | null
          uploaded_by?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "project_files_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "editor_assignments"
            referencedColumns: ["id"]
          },
        ]
      }
      project_revisions: {
        Row: {
          assignment_id: string
          author_id: string
          created_at: string
          id: string
          message: string
          resolved: boolean
        }
        Insert: {
          assignment_id: string
          author_id: string
          created_at?: string
          id?: string
          message: string
          resolved?: boolean
        }
        Update: {
          assignment_id?: string
          author_id?: string
          created_at?: string
          id?: string
          message?: string
          resolved?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "project_revisions_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "editor_assignments"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          booking_id: string
          comment: string | null
          created_at: string
          customer_id: string
          id: string
          listing_id: string | null
          professional_handle: string | null
          rating: number
        }
        Insert: {
          booking_id: string
          comment?: string | null
          created_at?: string
          customer_id: string
          id?: string
          listing_id?: string | null
          professional_handle?: string | null
          rating: number
        }
        Update: {
          booking_id?: string
          comment?: string | null
          created_at?: string
          customer_id?: string
          id?: string
          listing_id?: string | null
          professional_handle?: string | null
          rating?: number
        }
        Relationships: [
          {
            foreignKeyName: "reviews_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "creator_listings"
            referencedColumns: ["id"]
          },
        ]
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
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "customer" | "photographer" | "editor" | "admin"
      booking_status:
        | "pending"
        | "confirmed"
        | "in_progress"
        | "completed"
        | "cancelled"
      claim_status: "pending" | "approved" | "rejected"
      editor_status:
        | "open"
        | "in_progress"
        | "in_review"
        | "delivered"
        | "cancelled"
      file_kind: "source" | "draft" | "revision" | "delivery"
      listing_source: "self_serve" | "google_places" | "claimed"
      photo_source: "google_places" | "uploaded"
      verification_status:
        | "unverified"
        | "email_verified"
        | "id_verified"
        | "business_verified"
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
      app_role: ["customer", "photographer", "editor", "admin"],
      booking_status: [
        "pending",
        "confirmed",
        "in_progress",
        "completed",
        "cancelled",
      ],
      claim_status: ["pending", "approved", "rejected"],
      editor_status: [
        "open",
        "in_progress",
        "in_review",
        "delivered",
        "cancelled",
      ],
      file_kind: ["source", "draft", "revision", "delivery"],
      listing_source: ["self_serve", "google_places", "claimed"],
      photo_source: ["google_places", "uploaded"],
      verification_status: [
        "unverified",
        "email_verified",
        "id_verified",
        "business_verified",
      ],
    },
  },
} as const
