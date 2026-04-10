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
  start_date: string | null
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
  end_date: string | null
  google_event_id: string | null
  google_calendar_id: string | null
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

export interface Contact {
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

export interface ServiceHistory {
  id: string
  contact_id: string
  date: string
  description: string
  cost: number | null
  next_visit: string | null
  created_at: string
}

export interface ManualChapter {
  id: string
  household_id: string
  title: string
  sort_order: number
  created_at: string
}

export interface ManualSection {
  id: string
  chapter_id: string
  title: string
  sort_order: number
  created_at: string
}

export interface ManualEntry {
  id: string
  section_id: string
  title: string
  body: string | null
  owner_only: boolean
  updated_by: string | null
  updated_at: string
  created_at: string
}

export interface ShoppingListItem {
  id: string
  household_id: string
  item_name: string
  linked_inventory_id: string | null
  checked: boolean
  added_by: string | null
  created_at: string
}

export interface HouseholdInvite {
  id: string
  household_id: string
  role: UserRole
  token: string
  created_by: string
  expires_at: string
  used_by: string | null
  used_at: string | null
  created_at: string
}

export type DocumentFolder = 'insurance' | 'medical' | 'legal' | 'financial' | 'home' | 'vehicles' | 'school' | 'warranties' | 'taxes' | 'other'

export interface HouseholdDocument {
  id: string
  household_id: string
  folder: DocumentFolder
  name: string
  file_url: string
  tags: string[] | null
  owner_only: boolean
  uploaded_by: string | null
  uploaded_at: string
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
