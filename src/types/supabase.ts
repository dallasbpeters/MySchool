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
          email: string
          name: string | null
          role: 'parent' | 'student' | null
          parent_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          name?: string | null
          role?: 'parent' | 'student' | null
          parent_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string | null
          role?: 'parent' | 'student' | null
          parent_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      assignments: {
        Row: {
          id: string
          parent_id: string
          title: string
          content: Json | null
          links: Json | null
          due_date: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          parent_id: string
          title: string
          content?: Json | null
          links?: Json | null
          due_date: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          parent_id?: string
          title?: string
          content?: Json | null
          links?: Json | null
          due_date?: string
          created_at?: string
          updated_at?: string
        }
      }
      student_assignments: {
        Row: {
          id: string
          assignment_id: string
          student_id: string
          completed: boolean
          completed_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          assignment_id: string
          student_id: string
          completed?: boolean
          completed_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          assignment_id?: string
          student_id?: string
          completed?: boolean
          completed_at?: string | null
          created_at?: string
        }
      }
    }
  }
}