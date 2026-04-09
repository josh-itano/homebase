'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronLeft, ChevronRight, Plus, MapPin, Clock, RefreshCw, CalendarDays } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { CalendarEvent } from '@/types/app'

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December']

const CATEGORY_COLORS: Record<string, string> = {
  family:           'bg-violet-400',
  kids:             'bg-sky-400',
  school:           'bg-blue-400',
  appointments:     'bg-emerald-400',
  home_maintenance: 'bg-orange-400',
  social:           'bg-pink-400',
  travel:           'bg-amber-400',
  other:            'bg-stone-400',
}

interface Props {
  initialEvents: CalendarEvent[]
  isGoogleConnected: boolean
}

function toLocalDateStr(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export default function CalendarClient({ initialEvents, isGoogleConnected }: Props) {
  const router = useRouter()
  const today = toLocalDateStr(new Date())
  const todayYear = new Date().getFullYear()
  const todayMonth = new Date().getMonth()

  const [year, setYear] = useState(todayYear)
  const [month, setMonth] = useState(todayMonth)
  const [selected, setSelected] = useState<string>(today)
  const [events, setEvents] = useState<CalendarEvent[]>(initialEvents)
  const [syncing, setSyncing] = useState(false)
  const [justSynced, setJustSynced] = useState(false)

  const sync = useCallback(async (silent = false) => {
    if (!isGoogleConnected) return
    if (!silent) setSyncing(true)
    try {
      const res = await fetch('/api/google-calendar/sync', { method: 'POST' })
      if (res.ok) {
        const { synced } = await res.json()
        if (synced > 0) {
          // Reload events from server
          router.refresh()
        }
        setJustSynced(true)
        setTimeout(() => setJustSynced(false), 2000)
      }
    } finally {
      setSyncing(false)
    }
  }, [isGoogleConnected, router])

  // Auto-sync on mount
  useEffect(() => {
    sync(true)
  }, [sync])

  // Update events when initialEvents changes (after router.refresh)
  useEffect(() => {
    setEvents(initialEvents)
  }, [initialEvents])

  function prevMonth() {
    if (month === 0) { setYear(y => y - 1); setMonth(11) }
    else setMonth(m => m - 1)
  }

  function nextMonth() {
    if (month === 11) { setYear(y => y + 1); setMonth(0) }
    else setMonth(m => m + 1)
  }

  // Build month grid
  const firstDow = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells: (number | null)[] = [
    ...Array(firstDow).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]
  // Pad to complete last row
  while (cells.length % 7 !== 0) cells.push(null)

  function dateStr(day: number) {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
  }

  function eventsForDate(d: string) {
    return events.filter((e) => e.date === d)
  }

  const selectedEvents = eventsForDate(selected)

  function formatTime(t: string | null) {
    if (!t) return null
    const [h, m] = t.split(':').map(Number)
    const ampm = h >= 12 ? 'pm' : 'am'
    const h12 = h % 12 || 12
    return `${h12}:${String(m).padStart(2, '0')}${ampm}`
  }

  function formatSelectedDate(d: string) {
    const dt = new Date(d + 'T00:00:00')
    return dt.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
  }

  return (
    <div className="space-y-4">
      {/* Google Calendar status bar */}
      <div className="flex items-center gap-2">
        {isGoogleConnected ? (
          <button
            onClick={() => sync(false)}
            disabled={syncing}
            className="flex items-center gap-1.5 text-xs text-stone-500 hover:text-stone-700 transition-colors"
          >
            <RefreshCw className={cn('w-3.5 h-3.5', syncing && 'animate-spin')} />
            {syncing ? 'Syncing…' : justSynced ? 'Synced ✓' : 'Sync with Google'}
          </button>
        ) : (
          <a
            href="/api/google-calendar/auth"
            className="flex items-center gap-1.5 text-xs text-stone-500 hover:text-stone-700 transition-colors"
          >
            <CalendarDays className="w-3.5 h-3.5" />
            Connect Google Calendar
          </a>
        )}
        <div className="flex-1" />
        <button
          onClick={() => router.push(`/calendar/new?date=${selected}`)}
          className="flex items-center gap-1.5 bg-stone-800 text-white text-sm font-medium px-3.5 py-2 rounded-xl hover:bg-stone-700 transition-colors"
        >
          <Plus className="w-4 h-4" /> Add event
        </button>
      </div>

      {/* Month navigation */}
      <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-stone-100">
          <button onClick={prevMonth} className="p-1 rounded-lg hover:bg-stone-50 transition-colors">
            <ChevronLeft className="w-5 h-5 text-stone-600" />
          </button>
          <span className="text-sm font-semibold text-stone-900">{MONTHS[month]} {year}</span>
          <button onClick={nextMonth} className="p-1 rounded-lg hover:bg-stone-50 transition-colors">
            <ChevronRight className="w-5 h-5 text-stone-600" />
          </button>
        </div>

        {/* Day-of-week headers */}
        <div className="grid grid-cols-7 border-b border-stone-100">
          {DAYS.map((d) => (
            <div key={d} className="text-center py-2 text-xs font-medium text-stone-400">{d}</div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7">
          {cells.map((day, idx) => {
            if (!day) return <div key={`empty-${idx}`} className="aspect-square" />
            const ds = dateStr(day)
            const dayEvents = eventsForDate(ds)
            const isToday = ds === today
            const isSelected = ds === selected

            return (
              <button
                key={ds}
                onClick={() => setSelected(ds)}
                className={cn(
                  'aspect-square flex flex-col items-center justify-start pt-1.5 gap-0.5 relative transition-colors',
                  isSelected ? 'bg-stone-800' : isToday ? 'bg-stone-100' : 'hover:bg-stone-50'
                )}
              >
                <span className={cn(
                  'text-xs font-medium leading-none',
                  isSelected ? 'text-white' : isToday ? 'text-stone-900' : 'text-stone-700'
                )}>
                  {day}
                </span>
                {/* Event dots */}
                {dayEvents.length > 0 && (
                  <div className="flex gap-0.5">
                    {dayEvents.slice(0, 3).map((e) => (
                      <span
                        key={e.id}
                        className={cn('w-1 h-1 rounded-full', isSelected ? 'bg-white/70' : CATEGORY_COLORS[e.category] ?? 'bg-stone-400')}
                      />
                    ))}
                  </div>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Selected day events */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-semibold text-stone-700">{formatSelectedDate(selected)}</p>
          {selectedEvents.length === 0 && (
            <button
              onClick={() => router.push(`/calendar/new?date=${selected}`)}
              className="text-xs text-stone-400 hover:text-stone-600 transition-colors"
            >
              + Add event
            </button>
          )}
        </div>

        {selectedEvents.length === 0 ? (
          <p className="text-sm text-stone-400 text-center py-6 bg-white rounded-xl border border-stone-100">
            No events
          </p>
        ) : (
          <div className="space-y-2">
            {selectedEvents
              .sort((a, b) => {
                if (!a.start_time) return -1
                if (!b.start_time) return 1
                return a.start_time.localeCompare(b.start_time)
              })
              .map((event) => (
                <button
                  key={event.id}
                  onClick={() => router.push(`/calendar/${event.id}/edit`)}
                  className="w-full bg-white rounded-xl border border-stone-200 px-4 py-3 flex items-start gap-3 text-left hover:bg-stone-50 transition-colors"
                >
                  <span className={cn('w-2.5 h-2.5 rounded-full mt-1 flex-shrink-0', CATEGORY_COLORS[event.category] ?? 'bg-stone-400')} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-stone-900">{event.title}</p>
                    <div className="flex flex-wrap gap-x-3 mt-0.5">
                      {event.all_day ? (
                        <span className="text-xs text-stone-400">All day</span>
                      ) : event.start_time ? (
                        <span className="text-xs text-stone-400 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatTime(event.start_time)}{event.end_time ? ` – ${formatTime(event.end_time)}` : ''}
                        </span>
                      ) : null}
                      {event.location && (
                        <span className="text-xs text-stone-400 flex items-center gap-1 truncate">
                          <MapPin className="w-3 h-3 flex-shrink-0" />
                          <span className="truncate">{event.location}</span>
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              ))}
          </div>
        )}
      </div>
    </div>
  )
}
