export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          role: 'admin' | 'manager'
          display_name: string | null
          organization_name: string | null
          company_public_token: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          role?: 'admin' | 'manager'
          display_name?: string | null
          organization_name?: string | null
          company_public_token?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          role?: 'admin' | 'manager'
          display_name?: string | null
          organization_name?: string | null
          company_public_token?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'profiles_id_fkey'
            columns: ['id']
            isOneToOne: true
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
        ]
      }
      sops: {
        Row: {
          id: string
          owner_id: string
          title: string
          description: string | null
          source_file_path: string | null
          source_file_name: string | null
          source_file_mime: string | null
          company_public_token: string
          ai_summary: Json
          education_cards: Json
          languages: string[]
          public_token: string
          status: 'draft' | 'active' | 'archived'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          owner_id: string
          title: string
          description?: string | null
          source_file_path?: string | null
          source_file_name?: string | null
          source_file_mime?: string | null
          company_public_token: string
          ai_summary?: Json
          education_cards?: Json
          languages?: string[]
          public_token?: string
          status?: 'draft' | 'active' | 'archived'
          created_at?: string
          updated_at?: string
        }
        Update: {
          title?: string
          description?: string | null
          source_file_path?: string | null
          source_file_name?: string | null
          source_file_mime?: string | null
          company_public_token?: string
          ai_summary?: Json
          education_cards?: Json
          languages?: string[]
          status?: 'draft' | 'active' | 'archived'
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'sops_owner_id_fkey'
            columns: ['owner_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
        ]
      }
      quiz_questions: {
        Row: {
          id: string
          sop_id: string
          language: string
          position: number
          type: 'ox' | 'multiple'
          prompt: string
          options: Json | null
          correct_answer: Json
          explanation: string | null
          created_at: string
        }
        Insert: {
          id?: string
          sop_id: string
          language?: string
          position: number
          type: 'ox' | 'multiple'
          prompt: string
          options?: Json | null
          correct_answer: Json
          explanation?: string | null
          created_at?: string
        }
        Update: {
          language?: string
          position?: number
          type?: 'ox' | 'multiple'
          prompt?: string
          options?: Json | null
          correct_answer?: Json
          explanation?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'quiz_questions_sop_id_fkey'
            columns: ['sop_id']
            isOneToOne: false
            referencedRelation: 'sops'
            referencedColumns: ['id']
          },
        ]
      }
      education_logs: {
        Row: {
          id: string
          sop_id: string
          worker_name: string
          worker_birth_date: string
          language: string
          status: 'pending' | 'safe' | 'warning' | 'failed'
          attempts: number
          started_at: string
          completed_at: string | null
          elapsed_seconds: number | null
          wrong_question_ids: string[]
          answers: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          sop_id: string
          worker_name: string
          worker_birth_date: string
          language?: string
          status?: 'pending' | 'safe' | 'warning' | 'failed'
          attempts?: number
          started_at?: string
          completed_at?: string | null
          elapsed_seconds?: number | null
          wrong_question_ids?: string[]
          answers?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          status?: 'pending' | 'safe' | 'warning' | 'failed'
          attempts?: number
          completed_at?: string | null
          elapsed_seconds?: number | null
          wrong_question_ids?: string[]
          answers?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'education_logs_sop_id_fkey'
            columns: ['sop_id']
            isOneToOne: false
            referencedRelation: 'sops'
            referencedColumns: ['id']
          },
        ]
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: {
      profile_role: 'admin' | 'manager'
      sop_status: 'draft' | 'active' | 'archived'
      question_type: 'ox' | 'multiple'
      education_status: 'pending' | 'safe' | 'warning' | 'failed'
    }
    CompositeTypes: Record<string, never>
  }
}
