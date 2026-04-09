import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import TasksClient from '@/components/tasks/TasksClient'
import type { Task } from '@/types/app'

export default async function TasksPage() {
  const supabase = await createClient()

  const { data: authData } = await supabase.auth.getUser()
  const user = authData?.user
  if (!user) redirect('/auth/login')

  const { data: memberData } = await supabase
    .from('household_members')
    .select('*')
    .eq('user_id', user!.id)
    .limit(1)

  const member = memberData?.[0] as { household_id: string } | undefined
  if (!member) redirect('/onboarding')

  const householdId = member.household_id

  const [{ data: tasksRaw }, { data: membersRaw }] = await Promise.all([
    supabase.from('tasks').select('*').eq('household_id', householdId).order('due_date', { ascending: true }),
    supabase.from('household_members').select('*').eq('household_id', householdId),
  ])

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-stone-900">Tasks</h1>
        <Link
          href="/tasks/new"
          className="flex items-center gap-1.5 bg-stone-800 text-white text-sm font-medium px-3.5 py-2 rounded-xl hover:bg-stone-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          New task
        </Link>
      </div>
      <TasksClient
        initialTasks={(tasksRaw ?? []) as Task[]}
        members={(membersRaw ?? []) as { user_id: string; display_name: string | null }[]}
        userId={user!.id}
        householdId={householdId}
      />
    </div>
  )
}
