export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type UserRole = 'owner' | 'manager'
export type TaskStatus = 'todo' | 'in_progress' | 'done'
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent'
export type TaskCategory = 'errands' | 'household' | 'kids' | 'dog' | 'groceries' | 'maintenance' | 'admin' | 'other'
export type RecurringRule = 'none' | 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'annually'
export type EventCategory = 'kids' | 'family' | 'home_maintenance' | 'appointments' | 'social' | 'travel' | 'school' | 'other'
export type ContactRole = 'pediatrician' | 'dentist' | 'veterinarian' | 'plumber' | 'electrician' | 'hvac' | 'landscaper' | 'housekeeper' | 'school' | 'extracurricular' | 'insurance' | 'financial' | 'emergency' | 'family' | 'friend' | 'other'
export type InventoryCategory = 'pantry' | 'refrigerator' | 'freezer' | 'cleaning' | 'bathroom' | 'laundry' | 'kids' | 'dog' | 'office' | 'medicine' | 'other'
export type AssetCategory = 'appliance' | 'hvac' | 'plumbing' | 'electrical' | 'furniture' | 'electronics' | 'outdoor' | 'vehicle' | 'other'

export interface Database {
  public: {
    Tables: {
      households: {
        Row: {
          id: string
          name: string
          created_by: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          created_by: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          created_by?: string
          created_at?: string
        }
      }
      household_members: {
        Row: {
          id: string
          household_id: string
          user_id: string
          role: UserRole
          display_name: string | null
          avatar_url: string | null
          joined_at: string
        }
        Insert: {
          id?: string
          household_id: string
          user_id: string
          role: UserRole
          display_name?: string | null
          avatar_url?: string | null
          joined_at?: string
        }
        Update: {
          id?: string
          household_id?: string
          user_id?: string
          role?: UserRole
          display_name?: string | null
          avatar_url?: string | null
          joined_at?: string
        }
      }
      tasks: {
        Row: {
          id: string
          household_id: string
          title: string
          description: string | null
          category: TaskCategory
          priority: TaskPriority
          assigned_to: string | null
          due_date: string | null
          recurring_rule: RecurringRule
          status: TaskStatus
          created_by: string
          completed_by: string | null
          completed_at: string | null
          parent_task_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          household_id: string
          title: string
          description?: string | null
          category?: TaskCategory
          priority?: TaskPriority
          assigned_to?: string | null
          due_date?: string | null
          recurring_rule?: RecurringRule
          status?: TaskStatus
          created_by: string
          completed_by?: string | null
          completed_at?: string | null
          parent_task_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          household_id?: string
          title?: string
          description?: string | null
          category?: TaskCategory
          priority?: TaskPriority
          assigned_to?: string | null
          due_date?: string | null
          recurring_rule?: RecurringRule
          status?: TaskStatus
          created_by?: string
          completed_by?: string | null
          completed_at?: string | null
          parent_task_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      task_comments: {
        Row: {
          id: string
          task_id: string
          user_id: string
          body: string
          created_at: string
        }
        Insert: {
          id?: string
          task_id: string
          user_id: string
          body: string
          created_at?: string
        }
        Update: {
          id?: string
          task_id?: string
          user_id?: string
          body?: string
          created_at?: string
        }
      }
      events: {
        Row: {
          id: string
          household_id: string
          title: string
          date: string
          start_time: string | null
          end_time: string | null
          all_day: boolean
          category: EventCategory
          location: string | null
          notes: string | null
          recurring_rule: RecurringRule
          created_by: string
          created_at: string
        }
        Insert: {
          id?: string
          household_id: string
          title: string
          date: string
          start_time?: string | null
          end_time?: string | null
          all_day?: boolean
          category?: EventCategory
          location?: string | null
          notes?: string | null
          recurring_rule?: RecurringRule
          created_by: string
          created_at?: string
        }
        Update: {
          id?: string
          household_id?: string
          title?: string
          date?: string
          start_time?: string | null
          end_time?: string | null
          all_day?: boolean
          category?: EventCategory
          location?: string | null
          notes?: string | null
          recurring_rule?: RecurringRule
          created_by?: string
          created_at?: string
        }
      }
      contacts: {
        Row: {
          id: string
          household_id: string
          name: string
          role_type: ContactRole
          company: string | null
          phone: string | null
          email: string | null
          address: string | null
          website: string | null
          account_number: string | null
          availability: string | null
          notes: string | null
          is_favorite: boolean
          owner_only: boolean
          created_at: string
        }
        Insert: {
          id?: string
          household_id: string
          name: string
          role_type?: ContactRole
          company?: string | null
          phone?: string | null
          email?: string | null
          address?: string | null
          website?: string | null
          account_number?: string | null
          availability?: string | null
          notes?: string | null
          is_favorite?: boolean
          owner_only?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          household_id?: string
          name?: string
          role_type?: ContactRole
          company?: string | null
          phone?: string | null
          email?: string | null
          address?: string | null
          website?: string | null
          account_number?: string | null
          availability?: string | null
          notes?: string | null
          is_favorite?: boolean
          owner_only?: boolean
          created_at?: string
        }
      }
      inventory_items: {
        Row: {
          id: string
          household_id: string
          name: string
          category: InventoryCategory
          qty: number
          unit: string
          min_qty: number
          preferred_brand: string | null
          where_to_buy: string | null
          notes: string | null
          photo_url: string | null
          last_restocked: string | null
          created_at: string
        }
        Insert: {
          id?: string
          household_id: string
          name: string
          category?: InventoryCategory
          qty?: number
          unit?: string
          min_qty?: number
          preferred_brand?: string | null
          where_to_buy?: string | null
          notes?: string | null
          photo_url?: string | null
          last_restocked?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          household_id?: string
          name?: string
          category?: InventoryCategory
          qty?: number
          unit?: string
          min_qty?: number
          preferred_brand?: string | null
          where_to_buy?: string | null
          notes?: string | null
          photo_url?: string | null
          last_restocked?: string | null
          created_at?: string
        }
      }
      daily_logs: {
        Row: {
          id: string
          household_id: string
          date: string
          author_id: string
          summary: string | null
          kids_update: string | null
          pet_update: string | null
          inventory_notes: string | null
          issues: string | null
          created_at: string
        }
        Insert: {
          id?: string
          household_id: string
          date: string
          author_id: string
          summary?: string | null
          kids_update?: string | null
          pet_update?: string | null
          inventory_notes?: string | null
          issues?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          household_id?: string
          date?: string
          author_id?: string
          summary?: string | null
          kids_update?: string | null
          pet_update?: string | null
          inventory_notes?: string | null
          issues?: string | null
          created_at?: string
        }
      }
      notifications: {
        Row: {
          id: string
          household_id: string
          user_id: string
          type: string
          reference_id: string | null
          message: string
          read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          household_id: string
          user_id: string
          type: string
          reference_id?: string | null
          message: string
          read?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          household_id?: string
          user_id?: string
          type?: string
          reference_id?: string | null
          message?: string
          read?: boolean
          created_at?: string
        }
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
  }
}
