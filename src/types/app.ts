// Plain app types used throughout — not tied to Supabase generics

export type UserRole = 'owner' | 'manager'
export type TaskStatus = 'todo' | 'in_progress' | 'done'
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent'
export type TaskCategory = 'errands' | 'household' | 'kids' | 'dog' | 'groceries' | 'maintenance' | 'admin' | 'other'
export type RecurringRule = 'none' | 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'annually'
export type EventCategory = 'kids' | 'family' | 'home_maintenance' | 'appointments' | 'social' | 'travel' | 'school' | 'other'
export type ContactRole = 'pediatrician' | 'dentist' | 'veterinarian' | 'plumber' | 'electrician' | 'hvac' | 'landscaper' | 'housekeeper' | 'school' | 'extracurricular' | 'insurance' | 'financial' | 'emergency' | 'family' | 'friend' | 'other'
export type InventoryCategory = 'pantry' | 'refrigerator' | 'freezer' | 'cleaning' | 'bathroom' | 'laundry' | 'kids' | 'dog' | 'office' | 'medicine' | 'other'
export type AssetCategory = 'appliance' | 'hvac' | 'plumbing' | 'electrical' | 'furniture' | 'electronics' | 'outdoor' | 'vehicle' | 'other'

export interface HouseholdMember {
  id: string
  household_id: string
  user_id: string
  role: UserRole
  display_name: string | null
  avatar_url: string | null
  joined_at: string
}

export interface Task {
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

export interface CalendarEvent {
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

export interface InventoryItem {
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

export interface DailyLog {
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
