import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
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

  const { data: taskRaw } = await supabase.from('tasks').select('*').eq('id', id).limit(1)
  const task = taskRaw?.[0] as Task | undefined
  if (!task) notFound()

  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      <h1 className="text-2xl font-semibold text-stone-900 mb-2">{task.title}</h1>
      <p className="text-stone-500 text-sm capitalize">{task.category} · {task.priority} priority · {task.status}</p>
      {task.description && (
        <p className="mt-4 text-stone-700 text-sm whitespace-pre-wrap">{task.description}</p>
      )}
    </div>
  )
}
