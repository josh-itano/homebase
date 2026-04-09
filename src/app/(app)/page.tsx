import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { formatDate, getGreeting, todayISO } from '@/lib/utils'
import DashboardClient from '@/components/dashboard/DashboardClient'
import type { Task, CalendarEvent, InventoryItem, DailyLog } from '@/types/app'

export default async function DashboardPage() {
  const supabase = await createClient()

  const { data: authData } = await supabase.auth.getUser()
  const user = authData?.user
  if (!user) redirect('/auth/login')

  const { data: memberData } = await supabase
    .from('household_members')
    .select('*')
    .eq('user_id', user!.id)
    .limit(1)

  const member = memberData?.[0] as { household_id: string; role: string; display_name: string | null } | undefined
  if (!member) redirect('/onboarding')

  const householdId = member.household_id
  const today = todayISO()

  const [
    { data: todayTasksRaw },
    { data: overdueTasksRaw },
    { data: todayEventsRaw },
    { data: lowStockRaw },
    { data: todayLogRaw },
    { data: membersRaw },
  ] = await Promise.all([
    supabase.from('tasks').select('*').eq('household_id', householdId).eq('due_date', today).neq('status', 'done').order('priority', { ascending: false }),
    supabase.from('tasks').select('*').eq('household_id', householdId).lt('due_date', today).neq('status', 'done').order('due_date', { ascending: true }),
    supabase.from('events').select('*').eq('household_id', householdId).eq('date', today).order('start_time', { ascending: true }),
    supabase.from('inventory_items').select('*').eq('household_id', householdId).filter('qty', 'lte', 'min_qty'),
    supabase.from('daily_logs').select('*').eq('household_id', householdId).eq('date', today).limit(1),
    supabase.from('household_members').select('*').eq('household_id', householdId),
  ])

  return (
    <DashboardClient
      greeting={getGreeting()}
      displayName={member.display_name ?? user!.email?.split('@')[0] ?? 'there'}
      formattedDate={formatDate(new Date())}
      role={member.role as 'owner' | 'manager'}
      householdId={householdId}
      userId={user!.id}
      todayTasks={(todayTasksRaw ?? []) as Task[]}
      overdueTasks={(overdueTasksRaw ?? []) as Task[]}
      todayEvents={(todayEventsRaw ?? []) as CalendarEvent[]}
      lowStockItems={(lowStockRaw ?? []) as InventoryItem[]}
      todayLog={(todayLogRaw?.[0] ?? null) as DailyLog | null}
      members={(membersRaw ?? []) as { user_id: string; display_name: string | null; role: string }[]}
    />
  )
}
