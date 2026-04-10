import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import LogForm from '@/components/log/LogForm'
import type { DailyLog } from '@/types/app'

interface Props { params: Promise<{ id: string }> }

export default async function EditLogPage({ params }: Props) {
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

  const { data: logRaw } = await supabase.from('daily_logs').select('*').eq('id', id).single()
  if (!logRaw) notFound()

  const log = logRaw as DailyLog
  if (log.author_id !== user.id) redirect(`/log/${id}`)

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-semibold text-stone-900 mb-1">Edit Log</h1>
      <p className="text-sm text-stone-400 mb-6">{formatDate(log.date)}</p>
      <LogForm
        householdId={memberData.household_id}
        userId={user.id}
        date={log.date}
        item={log}
      />
    </div>
  )
}

function formatDate(d: string) {
  return new Date(d + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric',
  })
}
