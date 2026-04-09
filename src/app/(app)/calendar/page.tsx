import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import CalendarClient from '@/components/calendar/CalendarClient'
import type { CalendarEvent } from '@/types/app'

export default async function CalendarPage() {
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

  const rangeStart = new Date()
  rangeStart.setDate(rangeStart.getDate() - 30)
  const rangeEnd = new Date()
  rangeEnd.setDate(rangeEnd.getDate() + 180)

  const [{ data: eventsRaw }, { data: tokenData }] = await Promise.all([
    supabase
      .from('events')
      .select('*')
      .eq('household_id', memberData.household_id)
      .gte('date', rangeStart.toISOString().split('T')[0])
      .lte('date', rangeEnd.toISOString().split('T')[0])
      .order('date', { ascending: true })
      .order('start_time', { ascending: true }),
    supabase
      .from('google_calendar_tokens')
      .select('user_id')
      .eq('user_id', user.id)
      .limit(1),
  ])

  const isGoogleConnected = !!(tokenData && tokenData.length > 0)

  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      <h1 className="text-2xl font-semibold text-stone-900 mb-6">Calendar</h1>
      <CalendarClient
        initialEvents={(eventsRaw ?? []) as CalendarEvent[]}
        isGoogleConnected={isGoogleConnected}
      />
    </div>
  )
}
