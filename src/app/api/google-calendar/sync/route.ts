import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { getValidToken, gcalListEvents, googleEventToHomeBase } from '@/lib/google-calendar'

export async function POST() {
  const supabase = await createClient()
  const { data: authData } = await supabase.auth.getUser()
  if (!authData.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: memberData } = await supabase
    .from('household_members')
    .select('household_id')
    .eq('user_id', authData.user.id)
    .limit(1)
    .single()

  if (!memberData) return NextResponse.json({ error: 'No household' }, { status: 400 })

  const tokens = await getValidToken(authData.user.id)
  if (!tokens) return NextResponse.json({ synced: 0, connected: false })

  const googleEvents = await gcalListEvents(tokens.accessToken, tokens.calendarId)

  // Filter out cancelled events
  const active = googleEvents.filter((e) => e.status !== 'cancelled' && e.summary)

  let synced = 0
  for (const ge of active) {
    const event = googleEventToHomeBase(ge)

    const { data: existing } = await supabase
      .from('events')
      .select('id')
      .eq('household_id', memberData.household_id)
      .eq('google_event_id', ge.id)
      .single()

    if (existing) {
      // Update existing event
      await supabase.from('events').update({
        title: event.title,
        date: event.date,
        all_day: event.all_day,
        start_time: event.start_time,
        end_time: event.end_time,
        location: event.location,
        notes: event.notes,
      }).eq('id', existing.id)
    } else {
      // Insert new event from Google
      await supabase.from('events').insert({
        household_id: memberData.household_id,
        created_by: authData.user.id,
        title: event.title,
        date: event.date,
        all_day: event.all_day,
        start_time: event.start_time,
        end_time: event.end_time,
        location: event.location,
        notes: event.notes,
        category: 'other',
        recurring_rule: 'none',
        google_event_id: ge.id,
        google_calendar_id: tokens.calendarId,
      })
      synced++
    }
  }

  return NextResponse.json({ synced, connected: true })
}
