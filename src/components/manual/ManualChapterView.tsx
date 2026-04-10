'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ChevronLeft, Plus, Check, X, Trash2, Lock, Loader2 } from 'lucide-react'
import type { ManualChapter, ManualSection } from '@/types/app'

interface Props {
  chapter: ManualChapter
  sections: ManualSection[]
  isOwner: boolean
  userId: string
}

export default function ManualChapterView({ chapter, sections: initial, isOwner, userId }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const [sections, setSections] = useState(initial)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editBody, setEditBody] = useState('')
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [showAddSection, setShowAddSection] = useState(false)
  const [newSectionTitle, setNewSectionTitle] = useState('')

  function startEdit(section: ManualSection) {
    setEditingId(section.id)
    setEditBody(section.body ?? '')
  }

  async function saveEdit(section: ManualSection) {
    setSaving(true)
    const { error } = await supabase.from('manual_sections').update({
      body: editBody.trim() || null,
      updated_by: userId,
      updated_at: new Date().toISOString(),
    }).eq('id', section.id)

    if (!error) {
      setSections((prev) =>
        prev.map((s) => s.id === section.id ? { ...s, body: editBody.trim() || null } : s)
      )
      setEditingId(null)
    }
    setSaving(false)
  }

  async function deleteSection(section: ManualSection) {
    if (!confirm(`Delete "${section.title}" and all its content?`)) return
    setDeletingId(section.id)
    await supabase.from('manual_sections').delete().eq('id', section.id)
    setSections((prev) => prev.filter((s) => s.id !== section.id))
    setDeletingId(null)
  }

  async function addSection() {
    if (!newSectionTitle.trim()) return
    const { data } = await supabase
      .from('manual_sections')
      .insert({ chapter_id: chapter.id, title: newSectionTitle.trim(), sort_order: sections.length })
      .select()
      .single()

    if (data) {
      const newSection = data as ManualSection
      setSections((prev) => [...prev, newSection])
      setNewSectionTitle('')
      setShowAddSection(false)
      setEditingId(newSection.id)
      setEditBody('')
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <button
        onClick={() => router.push('/manual')}
        className="flex items-center gap-1 text-stone-500 hover:text-stone-800 text-sm transition-colors mb-6"
      >
        <ChevronLeft className="w-4 h-4" /> Manual
      </button>

      <h1 className="text-2xl font-semibold text-stone-900 mb-8">{chapter.title}</h1>

      <div className="space-y-0">
        {sections.map((section, i) => {
          const visible = !section.owner_only || isOwner
          if (!visible) return null

          return (
            <div key={section.id}>
              {/* Section header */}
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-2 min-w-0">
                  <h2 className="text-sm font-semibold text-stone-800 uppercase tracking-wide">
                    {section.title}
                  </h2>
                  {section.owner_only && <Lock className="w-3 h-3 text-stone-300 flex-shrink-0" />}
                </div>
                {isOwner && editingId !== section.id && (
                  <button
                    onClick={() => deleteSection(section)}
                    disabled={deletingId === section.id}
                    className="flex-shrink-0 text-stone-200 hover:text-red-400 transition-colors p-0.5 mt-0.5"
                  >
                    {deletingId === section.id
                      ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      : <Trash2 className="w-3.5 h-3.5" />
                    }
                  </button>
                )}
              </div>

              {/* Content */}
              {editingId === section.id ? (
                <div className="space-y-2 mb-8">
                  <textarea
                    value={editBody}
                    onChange={(e) => setEditBody(e.target.value)}
                    rows={8}
                    autoFocus
                    placeholder="Write the content here..."
                    className="w-full px-4 py-3 border border-stone-300 rounded-xl text-stone-800 text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-stone-800 resize-none bg-white"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => saveEdit(section)}
                      disabled={saving}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-800 text-white rounded-lg text-xs font-medium hover:bg-stone-700 disabled:opacity-50 transition-colors"
                    >
                      {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                      Save
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="flex items-center gap-1.5 px-3 py-1.5 border border-stone-200 text-stone-600 rounded-lg text-xs hover:bg-stone-50 transition-colors"
                    >
                      <X className="w-3 h-3" /> Cancel
                    </button>
                  </div>
                </div>
              ) : section.body ? (
                <p
                  onClick={() => startEdit(section)}
                  className="text-sm text-stone-600 leading-relaxed whitespace-pre-wrap cursor-text hover:bg-stone-50 rounded-lg px-3 py-2 -mx-3 transition-colors mb-8"
                >
                  {section.body}
                </p>
              ) : (
                <button
                  onClick={() => startEdit(section)}
                  className="text-sm text-stone-400 italic hover:text-stone-600 transition-colors mb-8 block"
                >
                  Click to add content...
                </button>
              )}

              {i < sections.filter((s) => !s.owner_only || isOwner).length - 1 && (
                <div className="border-b border-stone-100 mb-8" />
              )}
            </div>
          )
        })}

        {sections.filter((s) => !s.owner_only || isOwner).length === 0 && !showAddSection && (
          <p className="text-stone-400 text-sm text-center py-8">No sections yet</p>
        )}

        {/* Add section */}
        {showAddSection ? (
          <div className="flex gap-2 pt-2">
            <input
              value={newSectionTitle}
              onChange={(e) => setNewSectionTitle(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addSection()}
              placeholder="Section title"
              autoFocus
              className="flex-1 px-3.5 py-2.5 border border-stone-200 rounded-xl text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-800 text-sm"
            />
            <button onClick={addSection} className="px-4 py-2.5 bg-stone-800 text-white rounded-xl text-sm font-medium hover:bg-stone-700 transition-colors">Add</button>
            <button onClick={() => setShowAddSection(false)} className="px-4 py-2.5 border border-stone-200 text-stone-600 rounded-xl text-sm hover:bg-stone-50 transition-colors">Cancel</button>
          </div>
        ) : (
          <button
            onClick={() => setShowAddSection(true)}
            className="w-full flex items-center justify-center gap-2 py-3 border border-dashed border-stone-300 rounded-xl text-stone-500 text-sm hover:border-stone-400 hover:text-stone-700 transition-colors"
          >
            <Plus className="w-4 h-4" /> Add section
          </button>
        )}
      </div>
    </div>
  )
}
