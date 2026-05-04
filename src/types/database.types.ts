// src/types/database.types.ts
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      buildings: {
        Row: {
          id: string
          address: string
          coords: unknown
          created_at: string | null
        }
        Insert: {
          id?: string
          address: string
          coords: unknown
          created_at?: string | null
        }
        Update: {
          id?: string
          address?: string
          coords?: unknown
          created_at?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          id: string
          first_name: string
          last_name: string | null
          avatar_url: string | null
          rating: number | null
          building_id: string
          created_at: string
        }
        Insert: {
          id?: string
          first_name?: string
          last_name?: string | null
          avatar_url?: string | null
          rating?: number | null
          building_id: string
          created_at?: string
        }
        Update: {
          id?: string
          first_name?: string
          last_name?: string | null
          avatar_url?: string | null
          rating?: number | null
          building_id?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_building_id_fkey"
            columns: ["building_id"]
            isOneToOne: false
            referencedRelation: "buildings"
            referencedColumns: ["id"]
          }
        ]
      }
      items: {
        Row: {
          id: string
          title: string
          description: string | null
          price: number
          deal_type: "sale" | "rent" | "gift"
          image_urls: string[]
          is_active: boolean
          owner_id: string
          building_id: string
          created_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          price?: number
          deal_type?: "sale" | "rent" | "gift"
          image_urls?: string[]
          is_active?: boolean
          owner_id: string
          building_id: string
          created_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          price?: number
          deal_type?: "sale" | "rent" | "gift"
          image_urls?: string[]
          is_active?: boolean
          owner_id?: string
          building_id?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_items_building"
            columns: ["building_id"]
            isOneToOne: false
            referencedRelation: "buildings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_items_owner"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      chats: {
        Row: {
          id: string
          buyer_id: string
          seller_id: string
          item_id: string
          last_message_text: string | null
          last_message_time: string | null
          unread_count_buyer: number | null
          unread_count_seller: number | null
          created_at: string | null
        }
        Insert: {
          id?: string
          buyer_id: string
          seller_id: string
          item_id: string
          last_message_text?: string | null
          last_message_time?: string | null
          unread_count_buyer?: number | null
          unread_count_seller?: number | null
          created_at?: string | null
        }
        Update: {
          id?: string
          buyer_id?: string
          seller_id?: string
          item_id?: string
          last_message_text?: string | null
          last_message_time?: string | null
          unread_count_buyer?: number | null
          unread_count_seller?: number | null
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chats_buyer_id_fkey"
            columns: ["buyer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chats_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chats_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "items"
            referencedColumns: ["id"]
          }
        ]
      }
      messages: {
        Row: {
          id: string
          chat_id: string
          sender_id: string
          content: string | null
          image_url: string | null
          is_read: boolean | null
          created_at: string | null
        }
        Insert: {
          id?: string
          chat_id: string
          sender_id: string
          content?: string | null
          image_url?: string | null
          is_read?: boolean | null
          created_at?: string | null
        }
        Update: {
          id?: string
          chat_id?: string
          sender_id?: string
          content?: string | null
          image_url?: string | null
          is_read?: boolean | null
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_chat_id_fkey"
            columns: ["chat_id"]
            isOneToOne: false
            referencedRelation: "chats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      favorites: {
        Row: {
          id: string
          user_id: string
          item_id: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          item_id: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          item_id?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "favorites_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "favorites_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "items"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      deal_type: "sale" | "rent" | "gift"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// Вспомогательные типы для удобства
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type TablesInsert<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type TablesUpdate<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']
export type Enums<T extends keyof Database['public']['Enums']> = Database['public']['Enums'][T]