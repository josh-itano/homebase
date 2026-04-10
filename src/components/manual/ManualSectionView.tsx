'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ChevronLeft, Check, Loader2 } from 'lucide-react'
import type { ManualChapter, ManualSection } from '@/types/app'

interface Props {
  chapter: ManualChapter
  section: ManualSection
  isOwner: boolean
  userId: string
}

export default function ManualSectionView({ chapter, section: initial, userId }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const [body, setBody] = useState(initial.body ?? '')
  const [saved, setSaved] = useState(true)
  const [saving, setSaving] = useState(false)

  async function save() {
    setSaving(true)
    await supabase.from('manual_sections').update({
      body: body.trim() || null,
      updated_by: userId,
      updated_at: new Date().toISOString(),
    }).eq('id', initial.id)
    setSaved(true)
    setSaving(false)
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <button
        onClick={() => router.push(`/manual/${chapter.id}`)}
        className="flex items-center gap-1 text-stone-500 hover:text-stone-800 text-sm transition-colors mb-6"
      >
        <ChevronLeft className="w-4 h-4" /> {chapter.title}
      </button>

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-stone-900">{initial.title}</h1>
        {!saved && (
          <button
            onClick={save}
            disabled={saving}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-800 text-white rounded-lg text-sm font-medium hover:bg-stone-700 disabled:opacity-50 transition-colors"
          >
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
            Save
          </button>
        )}
      </div>

      <textarea
        value={body}
        onChange={(e) => { setBody(e.target.value); setSaved(false) }}
        placeholder="Write the content here..."
        className="w-full min-h-[60vh] px-0 py-0 text-stone-700 text-sm leading-relaxed focus:outline-none resize-none bg-transparent placeholder-stone-300"
      />
    </div>
  )
}
