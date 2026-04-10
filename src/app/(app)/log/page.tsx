import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import LogList from '@/components/log/LogList'
import type { DailyLog } from '@/types/app'

export default async function LogPage() {
  const supabase = await createClient()
  const { data: authData } = await supabase.auth.getUser()
  const user = authData?.user
  if (!user) redirect('/auth/login')

  const { data: memberData } = await supabase
    .from('household_members')
    .select('household_id, display_name')
    .eq('user_id', user.id)
    .limit(1)
    .single()

  if (!memberData) redirect('/onboarding')

  const today = new Date().toISOString().split('T')[0]

  const { data: logsRaw } = await supabase
    .from('daily_logs')
    .select('*')
    .eq('household_id', memberData.household_id)
    .order('date', { ascending: false })
    .limit(60)

  const logs = (logsRaw ?? []) as DailyLog[]
  const todayLog = logs.find((l) => l.date === today)

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-stone-900">Daily Log</h1>
        {!todayLog && (
          <Link
            href="/log/new"
            className="flex items-center gap-1.5 bg-stone-800 text-white text-sm font-medium px-3.5 py-2 rounded-xl hover:bg-stone-700 transition-colors"
          >
            <Plus className="w-4 h-4" /> Write today's log
          </Link>
        )}
        {todayLog && (
          <Link
            href={`/log/${todayLog.id}`}
            className="flex items-center gap-1.5 border border-stone-200 text-stone-700 text-sm font-medium px-3.5 py-2 rounded-xl hover:bg-stone-50 transition-colors"
          >
            Today's entry
          </Link>
        )}
      </div>
      <LogList logs={logs} todayDate={today} userId={user.id} />
    </div>
  )
}
