'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Loader2 } from 'lucide-react'
import type { DailyLog } from '@/types/app'

interface Props {
  householdId: string
  userId: string
  date: string
  item?: DailyLog
}

const SECTIONS = [
  { key: 'summary',          label: 'General summary',    placeholder: "How did the day go? Anything the team should know?" },
  { key: 'kids_update',      label: 'Kids',               placeholder: "School, activities, moods, appointments..." },
  { key: 'pet_update',       label: 'Pets',               placeholder: "Walks, feeding, vet notes..." },
  { key: 'inventory_notes',  label: 'Supplies & inventory', placeholder: "What's running low, what was used..." },
  { key: 'issues',           label: 'Issues & follow-ups', placeholder: "Anything that needs attention or follow-up..." },
] as const

type SectionKey = typeof SECTIONS[number]['key']

export default function LogForm({ householdId, userId, date, item }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [fields, setFields] = useState<Record<SectionKey, string>>({
    summary:         item?.summary ?? '',
    kids_update:     item?.kids_update ?? '',
    pet_update:      item?.pet_update ?? '',
    inventory_notes: item?.inventory_notes ?? '',
    issues:          item?.issues ?? '',
  })

  function set(key: SectionKey, value: string) {
    setFields((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)

    const payload = {
      household_id:    householdId,
      author_id:       userId,
      date,
      summary:         fields.summary.trim() || null,
      kids_update:     fields.kids_update.trim() || null,
      pet_update:      fields.pet_update.trim() || null,
      inventory_notes: fields.inventory_notes.trim() || null,
      issues:          fields.issues.trim() || null,
    }

    if (item) {
      const { error: err } = await supabase
        .from('daily_logs')
        .update(payload)
        .eq('id', item.id)
      if (err) { setError(err.message); setSaving(false); return }
      router.push(`/log/${item.id}`)
    } else {
      const { data, error: err } = await supabase
        .from('daily_logs')
        .insert(payload)
        .select('id')
        .single()
      if (err) { setError(err.message); setSaving(false); return }
      router.push(`/log/${data.id}`)
    }

    router.refresh()
  }

  const hasContent = Object.values(fields).some((v) => v.trim().length > 0)

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {SECTIONS.map((section) => (
        <div key={section.key}>
          <label className="block text-sm font-medium text-stone-700 mb-1.5">{section.label}</label>
          <textarea
            value={fields[section.key]}
            onChange={(e) => set(section.key, e.target.value)}
            placeholder={section.placeholder}
            rows={3}
            className="w-full px-3.5 py-2.5 border border-stone-200 rounded-xl text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-800 resize-none text-sm"
          />
        </div>
      ))}

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
          disabled={saving || !hasContent}
          className="flex-1 py-3 bg-stone-800 text-white rounded-xl font-medium hover:bg-stone-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {saving && <Loader2 className="w-4 h-4 animate-spin" />}
          {item ? 'Save changes' : 'Save log'}
        </button>
      </div>
    </form>
  )
}
