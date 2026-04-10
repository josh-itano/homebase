import { createClient } from '@/lib/supabase/server'

const TOKEN_URL = 'https://oauth2.googleapis.com/token'
const GCAL_BASE = 'https://www.googleapis.com/calendar/v3'

export interface GCalEventPayload {
  title: string
  date: string        // YYYY-MM-DD
  end_date?: string | null
  start_time: string | null  // HH:MM:SS or null
  end_time: string | null
  all_day: boolean
  location: string | null
  notes: string | null
}

// ── Token management ──────────────────────────────────────────────────────────

export async function getValidToken(userId: string): Promise<{ accessToken: string; calendarId: string } | null> {
  const supabase = await createClient()

  const { data } = await supabase
    .from('google_calendar_tokens')
    .select('access_token, refresh_token, token_expiry, calendar_id')
    .eq('user_id', userId)
    .single()

  if (!data) return null

  const expiry = new Date(data.token_expiry)
  const needsRefresh = expiry.getTime() - Date.now() < 60_000

  if (!needsRefresh) {
    return { accessToken: data.access_token, calendarId: data.calendar_id }
  }

  // Refresh
  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      refresh_token: data.refresh_token,
      grant_type: 'refresh_token',
    }),
  })

  const json = await res.json()
  if (!json.access_token) return null

  const newExpiry = new Date(Date.now() + json.expires_in * 1000).toISOString()
  await supabase
    .from('google_calendar_tokens')
    .update({ access_token: json.access_token, token_expiry: newExpiry, updated_at: new Date().toISOString() })
    .eq('user_id', userId)

  return { accessToken: json.access_token, calendarId: data.calendar_id }
}

// ── Google Calendar REST helpers ───────────────────────────────────────────────

export async function gcalListEvents(accessToken: string, calendarId: string) {
  const timeMin = new Date()
  timeMin.setDate(timeMin.getDate() - 30)
  const timeMax = new Date()
  timeMax.setDate(timeMax.getDate() + 180)

  const params = new URLSearchParams({
    timeMin: timeMin.toISOString(),
    timeMax: timeMax.toISOString(),
    singleEvents: 'true',
    orderBy: 'startTime',
    maxResults: '500',
  })

  const res = await fetch(`${GCAL_BASE}/calendars/${encodeURIComponent(calendarId)}/events?${params}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  const json = await res.json()
  return (json.items ?? []) as GoogleEvent[]
}

export async function gcalCreateEvent(accessToken: string, calendarId: string, payload: GCalEventPayload): Promise<string | null> {
  const res = await fetch(`${GCAL_BASE}/calendars/${encodeURIComponent(calendarId)}/events`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(buildBody(payload)),
  })
  const json = await res.json()
  return json.id ?? null
}

export async function gcalUpdateEvent(accessToken: string, calendarId: string, googleEventId: string, payload: GCalEventPayload) {
  await fetch(`${GCAL_BASE}/calendars/${encodeURIComponent(calendarId)}/events/${googleEventId}`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(buildBody(payload)),
  })
}

export async function gcalDeleteEvent(accessToken: string, calendarId: string, googleEventId: string) {
  await fetch(`${GCAL_BASE}/calendars/${encodeURIComponent(calendarId)}/events/${googleEventId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${accessToken}` },
  })
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function buildBody(p: GCalEventPayload) {
  // Google Calendar all-day end date is exclusive, so add 1 day
  const endDateExclusive = p.end_date
    ? addOneDay(p.end_date)
    : p.all_day ? addOneDay(p.date) : null

  if (p.all_day) {
    return {
      summary: p.title,
      location: p.location ?? undefined,
      description: p.notes ?? undefined,
      start: { date: p.date },
      end: { date: endDateExclusive ?? addOneDay(p.date) },
    }
  }
  const endDate = p.end_date ?? p.date
  const start = p.start_time ? `${p.date}T${p.start_time}` : `${p.date}T00:00:00`
  const end = p.end_time ? `${endDate}T${p.end_time}` : start
  return {
    summary: p.title,
    location: p.location ?? undefined,
    description: p.notes ?? undefined,
    start: { dateTime: start },
    end: { dateTime: end },
  }
}

function addOneDay(date: string): string {
  const d = new Date(date + 'T00:00:00')
  d.setDate(d.getDate() + 1)
  return d.toISOString().split('T')[0]
}

export interface GoogleEvent {
  id: string
  summary?: string
  description?: string
  location?: string
  start: { date?: string; dateTime?: string }
  end: { date?: string; dateTime?: string }
  status?: string
}

export function googleEventToHomeBase(g: GoogleEvent): Omit<GCalEventPayload, never> & { google_event_id: string } {
  const allDay = !!g.start.date
  const date = g.start.date ?? g.start.dateTime!.split('T')[0]
  const startTime = g.start.dateTime ? g.start.dateTime.split('T')[1].substring(0, 8) : null
  const endTime = g.end.dateTime ? g.end.dateTime.split('T')[1].substring(0, 8) : null

  return {
    title: g.summary ?? '(No title)',
    date,
    all_day: allDay,
    start_time: startTime,
    end_time: endTime,
    location: g.location ?? null,
    notes: g.description ?? null,
    google_event_id: g.id,
  }
}
