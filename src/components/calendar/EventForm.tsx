'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Trash2 } from 'lucide-react'
import type { CalendarEvent, EventCategory } from '@/types/app'

const CATEGORIES: { value: EventCategory; label: string }[] = [
  { value: 'family', label: 'Family' },
  { value: 'kids', label: 'Kids' },
  { value: 'school', label: 'School' },
  { value: 'appointments', label: 'Appointments' },
  { value: 'home_maintenance', label: 'Home Maintenance' },
  { value: 'social', label: 'Social' },
  { value: 'travel', label: 'Travel' },
  { value: 'other', label: 'Other' },
]

interface Props {
  item?: CalendarEvent
  defaultDate?: string
}

export default function EventForm({ item, defaultDate }: Props) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [title, setTitle] = useState(item?.title ?? '')
  const [date, setDate] = useState(item?.date ?? defaultDate ?? '')
  const [allDay, setAllDay] = useState(item?.all_day ?? true)
  const [startTime, setStartTime] = useState(item?.start_time?.substring(0, 5) ?? '')
  const [endTime, setEndTime] = useState(item?.end_time?.substring(0, 5) ?? '')
  const [category, setCategory] = useState<EventCategory>(item?.category ?? 'other')
  const [location, setLocation] = useState(item?.location ?? '')
  const [notes, setNotes] = useState(item?.notes ?? '')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim() || !date) return
    setSaving(true)
    setError(null)

    const payload = {
      title: title.trim(),
      date,
      all_day: allDay,
      start_time: allDay ? null : startTime || null,
      end_time: allDay ? null : endTime || null,
      category,
      location: location.trim() || null,
      notes: notes.trim() || null,
      recurring_rule: item?.recurring_rule ?? 'none',
    }

    const url = item ? `/api/events/${item.id}` : '/api/events'
    const method = item ? 'PATCH' : 'POST'

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      setError(data.error ?? 'Something went wrong')
      setSaving(false)
      return
    }

    router.push('/calendar')
    router.refresh()
  }

  async function handleDelete() {
    if (!item || !confirm('Delete this event?')) return
    setDeleting(true)
    await fetch(`/api/events/${item.id}`, { method: 'DELETE' })
    router.push('/calendar')
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Title */}
      <div>
        <label className="block text-sm font-medium text-stone-700 mb-1.5">Title</label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Event title"
          required
          className="w-full px-3.5 py-2.5 border border-stone-200 rounded-xl text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-800"
        />
      </div>

      {/* Date */}
      <div>
        <label className="block text-sm font-medium text-stone-700 mb-1.5">Date</label>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          required
          className="w-full px-3.5 py-2.5 border border-stone-200 rounded-xl text-stone-900 focus:outline-none focus:ring-2 focus:ring-stone-800"
        />
      </div>

      {/* All day toggle */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => setAllDay(!allDay)}
          className={`relative w-10 h-6 rounded-full transition-colors ${allDay ? 'bg-stone-800' : 'bg-stone-200'}`}
        >
          <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${allDay ? 'translate-x-5' : 'translate-x-1'}`} />
        </button>
        <span className="text-sm text-stone-700">All day</span>
      </div>

      {/* Time fields */}
      {!allDay && (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1.5">Start time</label>
            <input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="w-full px-3.5 py-2.5 border border-stone-200 rounded-xl text-stone-900 focus:outline-none focus:ring-2 focus:ring-stone-800"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1.5">End time</label>
            <input
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="w-full px-3.5 py-2.5 border border-stone-200 rounded-xl text-stone-900 focus:outline-none focus:ring-2 focus:ring-stone-800"
            />
          </div>
        </div>
      )}

      {/* Category */}
      <div>
        <label className="block text-sm font-medium text-stone-700 mb-1.5">Category</label>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value as EventCategory)}
          className="w-full px-3.5 py-2.5 border border-stone-200 rounded-xl text-stone-900 focus:outline-none focus:ring-2 focus:ring-stone-800 bg-white"
        >
          {CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>{c.label}</option>
          ))}
        </select>
      </div>

      {/* Location */}
      <div>
        <label className="block text-sm font-medium text-stone-700 mb-1.5">Location <span className="text-stone-400 font-normal">(optional)</span></label>
        <input
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="Where is it?"
          className="w-full px-3.5 py-2.5 border border-stone-200 rounded-xl text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-800"
        />
      </div>

      {/* Notes */}
      <div>
        <label className="block text-sm font-medium text-stone-700 mb-1.5">Notes <span className="text-stone-400 font-normal">(optional)</span></label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          placeholder="Any details..."
          className="w-full px-3.5 py-2.5 border border-stone-200 rounded-xl text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-800 resize-none"
        />
      </div>

      {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}

      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex-1 py-3 border border-stone-200 text-stone-700 rounded-xl font-medium hover:bg-stone-50 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving || !title.trim() || !date}
          className="flex-1 py-3 bg-stone-800 text-white rounded-xl font-medium hover:bg-stone-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {saving && <Loader2 className="w-4 h-4 animate-spin" />}
          {item ? 'Save changes' : 'Add event'}
        </button>
      </div>

      {item && (
        <button
          type="button"
          onClick={handleDelete}
          disabled={deleting}
          className="w-full py-2.5 text-sm text-red-500 hover:text-red-600 transition-colors flex items-center justify-center gap-1.5"
        >
          {deleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
          Delete event
        </button>
      )}
    </form>
  )
}
