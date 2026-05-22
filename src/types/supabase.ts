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
            profiles: {
                Row: {
                    id: string
                    email: string | null
                    full_name: string | null
                    avatar_url: string | null
                    role: 'user' | 'model'
                    created_at: string
                    updated_at: string | null
                }
                Insert: {
                    id: string
                    email?: string | null
                    full_name?: string | null
                    avatar_url?: string | null
                    role?: 'user' | 'model'
                    created_at?: string
                    updated_at?: string | null
                }
                Update: {
                    id?: string
                    email?: string | null
                    full_name?: string | null
                    avatar_url?: string | null
                    role?: 'user' | 'model'
                    created_at?: string
                    updated_at?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "profiles_id_fkey"
                        columns: ["id"]
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    }
                ]
            }
            chat_messages: {
                Row: {
                    id: string
                    stream_id: string
                    user_id: string
                    display_name: string
                    body: string
                    kind: 'text' | 'tip' | 'system'
                    amount: number | null
                    deleted_at: string | null
                    deleted_by: string | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    stream_id: string
                    user_id: string
                    display_name: string
                    body: string
                    kind?: 'text' | 'tip' | 'system'
                    amount?: number | null
                    deleted_at?: string | null
                    deleted_by?: string | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    stream_id?: string
                    user_id?: string
                    display_name?: string
                    body?: string
                    kind?: 'text' | 'tip' | 'system'
                    amount?: number | null
                    deleted_at?: string | null
                    deleted_by?: string | null
                    created_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "chat_messages_user_id_fkey"
                        columns: ["user_id"]
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    }
                ]
            }
            chat_mutes: {
                Row: {
                    stream_id: string
                    user_id: string
                    muted_by: string
                    created_at: string
                }
                Insert: {
                    stream_id: string
                    user_id: string
                    muted_by: string
                    created_at?: string
                }
                Update: {
                    stream_id?: string
                    user_id?: string
                    muted_by?: string
                    created_at?: string
                }
                Relationships: []
            }
        }
        Views: {
            [_ in never]: never
        }
        Functions: {
            [_ in never]: never
        }
        Enums: {
            [_ in never]: never
        }
        CompositeTypes: {
            [_ in never]: never
        }
    }
}
