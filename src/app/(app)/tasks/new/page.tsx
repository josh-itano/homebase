import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import NewTaskClient from '@/components/tasks/NewTaskClient'

export default async function NewTaskPage() {
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

  const { data: membersRaw } = await supabase
    .from('household_members')
    .select('*')
    .eq('household_id', member.household_id)

  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      <h1 className="text-2xl font-semibold text-stone-900 mb-6">New Task</h1>
      <NewTaskClient
        householdId={member.household_id}
        userId={user!.id}
        members={(membersRaw ?? []) as { user_id: string; display_name: string | null }[]}
      />
    </div>
  )
}
