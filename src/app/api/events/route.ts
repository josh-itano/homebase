import { createClient } from '@/lib/supabase/server'
import { NextResponse, type NextRequest } from 'next/server'
import { getValidToken, gcalCreateEvent } from '@/lib/google-calendar'

export async function POST(request: NextRequest) {
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

  const body = await request.json()
  const { title, date, start_time, end_time, all_day, category, location, notes, recurring_rule } = body

  // Save to Supabase
  const { data: event, error } = await supabase.from('events').insert({
    household_id: memberData.household_id,
    created_by: authData.user.id,
    title,
    date,
    start_time: start_time || null,
    end_time: end_time || null,
    all_day: all_day ?? false,
    category: category ?? 'other',
    location: location || null,
    notes: notes || null,
    recurring_rule: recurring_rule ?? 'none',
  }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Push to Google Calendar if connected
  const tokens = await getValidToken(authData.user.id)
  if (tokens && event) {
    const googleEventId = await gcalCreateEvent(tokens.accessToken, tokens.calendarId, {
      title,
      date,
      start_time: start_time || null,
      end_time: end_time || null,
      all_day: all_day ?? false,
      location: location || null,
      notes: notes || null,
    })
    if (googleEventId) {
      await supabase.from('events').update({
        google_event_id: googleEventId,
        google_calendar_id: tokens.calendarId,
      }).eq('id', event.id)
      event.google_event_id = googleEventId
    }
  }

  return NextResponse.json(event)
}
