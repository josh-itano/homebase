import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import TaskEditClient from '@/components/tasks/TaskEditClient'
import type { Task } from '@/types/app'

interface Props {
  params: Promise<{ id: string }>
}

export default async function TaskDetailPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()

  const { data: authData } = await supabase.auth.getUser()
  const user = authData?.user
  if (!user) redirect('/auth/login')

  const { data: memberData } = await supabase
    .from('household_members')
    .select('household_id')
    .eq('user_id', user.id)
    .limit(1)
    .single()
  if (!memberData) redirect('/onboarding')

  const [{ data: taskRaw }, { data: membersRaw }] = await Promise.all([
    supabase.from('tasks').select('*').eq('id', id).limit(1),
    supabase.from('household_members').select('user_id, display_name').eq('household_id', memberData.household_id),
  ])

  const task = taskRaw?.[0] as Task | undefined
  if (!task) notFound()

  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      <h1 className="text-2xl font-semibold text-stone-900 mb-6">Edit Task</h1>
      <TaskEditClient
        task={task}
        members={(membersRaw ?? []) as { user_id: string; display_name: string | null }[]}
        userId={user.id}
      />
    </div>
  )
}
