import { createClient } from '@/lib/supabase/server'
import { NextResponse, type NextRequest } from 'next/server'
import { getValidToken, gcalUpdateEvent, gcalDeleteEvent } from '@/lib/google-calendar'

interface Props { params: Promise<{ id: string }> }

export async function PATCH(request: NextRequest, { params }: Props) {
  const { id } = await params
  const supabase = await createClient()
  const { data: authData } = await supabase.auth.getUser()
  if (!authData.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { title, date, start_time, end_time, all_day, category, location, notes, recurring_rule } = body

  const update = {
    title,
    date,
    start_time: start_time || null,
    end_time: end_time || null,
    all_day: all_day ?? false,
    category,
    location: location || null,
    notes: notes || null,
    recurring_rule,
  }

  const { data: event, error } = await supabase
    .from('events')
    .update(update)
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Push update to Google Calendar
  if (event?.google_event_id) {
    const tokens = await getValidToken(authData.user.id)
    if (tokens) {
      await gcalUpdateEvent(tokens.accessToken, event.google_calendar_id ?? tokens.calendarId, event.google_event_id, {
        title,
        date,
        start_time: start_time || null,
        end_time: end_time || null,
        all_day: all_day ?? false,
        location: location || null,
        notes: notes || null,
      })
    }
  }

  return NextResponse.json(event)
}

export async function DELETE(_: NextRequest, { params }: Props) {
  const { id } = await params
  const supabase = await createClient()
  const { data: authData } = await supabase.auth.getUser()
  if (!authData.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Get event before deleting to grab google_event_id
  const { data: event } = await supabase
    .from('events')
    .select('google_event_id, google_calendar_id')
    .eq('id', id)
    .single()

  await supabase.from('events').delete().eq('id', id)

  // Delete from Google Calendar
  if (event?.google_event_id) {
    const tokens = await getValidToken(authData.user.id)
    if (tokens) {
      await gcalDeleteEvent(tokens.accessToken, event.google_calendar_id ?? tokens.calendarId, event.google_event_id)
    }
  }

  return NextResponse.json({ ok: true })
}
