'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import type { ManualChapter, ManualSection } from '@/types/app'

interface Props {
  chapter: ManualChapter
  sections: ManualSection[]
  isOwner: boolean
}

export default function ManualChapterView({ chapter, sections: initial, isOwner }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const [sections, setSections] = useState(initial)
  const [showAdd, setShowAdd] = useState(false)
  const [addingTitle, setAddingTitle] = useState('')

  async function addSection() {
    if (!addingTitle.trim()) return
    const { data } = await supabase
      .from('manual_sections')
      .insert({ chapter_id: chapter.id, title: addingTitle.trim(), sort_order: sections.length })
      .select()
      .single()

    if (data) {
      setSections((prev) => [...prev, data as ManualSection])
      setAddingTitle('')
      setShowAdd(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
      <button onClick={() => router.push('/manual')} className="flex items-center gap-1 text-stone-500 hover:text-stone-800 text-sm transition-colors">
        <ChevronLeft className="w-4 h-4" /> Manual
      </button>

      <h1 className="text-2xl font-semibold text-stone-900">{chapter.title}</h1>

      <div className="space-y-2">
        {sections.map((section) => (
          <Link
            key={section.id}
            href={`/manual/${chapter.id}/${section.id}`}
            className="flex items-center gap-3 bg-white rounded-xl border border-stone-200 px-4 py-3.5 hover:bg-stone-50 transition-colors"
          >
            <span className="flex-1 text-sm font-medium text-stone-900">{section.title}</span>
            <ChevronRight className="w-4 h-4 text-stone-300 flex-shrink-0" />
          </Link>
        ))}

        {sections.length === 0 && (
          <p className="text-stone-400 text-sm text-center py-6">No sections yet</p>
        )}

        {showAdd ? (
          <div className="flex gap-2 pt-1">
            <input
              value={addingTitle}
              onChange={(e) => setAddingTitle(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addSection()}
              placeholder="Section title"
              autoFocus
              className="flex-1 px-3.5 py-2.5 border border-stone-200 rounded-xl text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-800 text-sm"
            />
            <button onClick={addSection} className="px-4 py-2.5 bg-stone-800 text-white rounded-xl text-sm font-medium hover:bg-stone-700 transition-colors">Add</button>
            <button onClick={() => setShowAdd(false)} className="px-4 py-2.5 border border-stone-200 text-stone-600 rounded-xl text-sm hover:bg-stone-50 transition-colors">Cancel</button>
          </div>
        ) : (
          <button
            onClick={() => setShowAdd(true)}
            className="w-full flex items-center justify-center gap-2 py-3 border border-dashed border-stone-300 rounded-xl text-stone-500 text-sm hover:border-stone-400 hover:text-stone-700 transition-colors"
          >
            <Plus className="w-4 h-4" /> Add section
          </button>
        )}
      </div>
    </div>
  )
}
