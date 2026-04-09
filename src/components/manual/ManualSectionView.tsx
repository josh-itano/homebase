'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ChevronLeft, Plus, Lock, Pencil, Check, X, Trash2 } from 'lucide-react'
import type { ManualChapter, ManualSection, ManualEntry } from '@/types/app'

interface Props {
  chapter: ManualChapter
  section: ManualSection
  entries: ManualEntry[]
  isOwner: boolean
  userId: string
}

export default function ManualSectionView({ chapter, section, entries: initial, isOwner, userId }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const [entries, setEntries] = useState(initial)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editBody, setEditBody] = useState('')
  const [editTitle, setEditTitle] = useState('')
  const [showNew, setShowNew] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newBody, setNewBody] = useState('')
  const [newOwnerOnly, setNewOwnerOnly] = useState(false)
  const [saving, setSaving] = useState(false)

  function startEdit(entry: ManualEntry) {
    setEditingId(entry.id)
    setEditTitle(entry.title)
    setEditBody(entry.body ?? '')
  }

  async function saveEdit(entry: ManualEntry) {
    setSaving(true)
    const { error } = await supabase.from('manual_entries').update({
      title: editTitle.trim(),
      body: editBody.trim() || null,
      updated_by: userId,
      updated_at: new Date().toISOString(),
    }).eq('id', entry.id)

    if (!error) {
      setEntries((prev) => prev.map((e) =>
        e.id === entry.id ? { ...e, title: editTitle.trim(), body: editBody.trim() || null } : e
      ))
      setEditingId(null)
    }
    setSaving(false)
  }

  async function deleteEntry(id: string) {
    await supabase.from('manual_entries').delete().eq('id', id)
    setEntries((prev) => prev.filter((e) => e.id !== id))
  }

  async function addEntry() {
    if (!newTitle.trim()) return
    setSaving(true)
    const { data } = await supabase.from('manual_entries').insert({
      section_id: section.id,
      title: newTitle.trim(),
      body: newBody.trim() || null,
      owner_only: newOwnerOnly,
      updated_by: userId,
    }).select().single()

    if (data) {
      setEntries((prev) => [...prev, data as ManualEntry])
      setShowNew(false)
      setNewTitle(''); setNewBody(''); setNewOwnerOnly(false)
    }
    setSaving(false)
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
      <button
        onClick={() => router.push(`/manual/${chapter.id}`)}
        className="flex items-center gap-1 text-stone-500 hover:text-stone-800 text-sm transition-colors"
      >
        <ChevronLeft className="w-4 h-4" /> {chapter.title}
      </button>

      <h1 className="text-2xl font-semibold text-stone-900">{section.title}</h1>

      <div className="space-y-3">
        {entries.map((entry) => (
          <div key={entry.id} className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
            {editingId === entry.id ? (
              <div className="p-4 space-y-3">
                <input
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-stone-200 rounded-lg text-stone-900 font-medium text-sm focus:outline-none focus:ring-2 focus:ring-stone-800"
                />
                <textarea
                  value={editBody}
                  onChange={(e) => setEditBody(e.target.value)}
                  rows={6}
                  placeholder="Write the content here..."
                  className="w-full px-3 py-2 border border-stone-200 rounded-lg text-stone-900 text-sm focus:outline-none focus:ring-2 focus:ring-stone-800 resize-none"
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => saveEdit(entry)}
                    disabled={saving}
                    className="flex items-center gap-1.5 px-3 py-2 bg-stone-800 text-white rounded-lg text-sm font-medium hover:bg-stone-700 transition-colors disabled:opacity-50"
                  >
                    <Check className="w-3.5 h-3.5" /> Save
                  </button>
                  <button
                    onClick={() => setEditingId(null)}
                    className="flex items-center gap-1.5 px-3 py-2 border border-stone-200 text-stone-600 rounded-lg text-sm hover:bg-stone-50 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" /> Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-stone-900">{entry.title}</h3>
                    {entry.owner_only && <Lock className="w-3.5 h-3.5 text-stone-400" aria-label="Owner only" />}
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={() => startEdit(entry)}
                      className="text-stone-300 hover:text-stone-600 transition-colors p-1"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => deleteEntry(entry.id)}
                      className="text-stone-300 hover:text-red-400 transition-colors p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                {entry.body ? (
                  <p className="text-sm text-stone-700 whitespace-pre-wrap">{entry.body}</p>
                ) : (
                  <button
                    onClick={() => startEdit(entry)}
                    className="text-sm text-stone-400 italic hover:text-stone-600 transition-colors"
                  >
                    Tap to add content...
                  </button>
                )}
                {entry.updated_at && (
                  <p className="text-xs text-stone-300 mt-3">
                    Updated {new Date(entry.updated_at).toLocaleDateString()}
                  </p>
                )}
              </div>
            )}
          </div>
        ))}

        {entries.length === 0 && !showNew && (
          <p className="text-stone-400 text-sm text-center py-4">No entries yet</p>
        )}

        {/* New entry form */}
        {showNew ? (
          <div className="bg-white rounded-2xl border border-stone-200 p-4 space-y-3">
            <input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Entry title"
              autoFocus
              className="w-full px-3 py-2 border border-stone-200 rounded-lg text-stone-900 font-medium text-sm focus:outline-none focus:ring-2 focus:ring-stone-800"
            />
            <textarea
              value={newBody}
              onChange={(e) => setNewBody(e.target.value)}
              rows={5}
              placeholder="Write the content here..."
              className="w-full px-3 py-2 border border-stone-200 rounded-lg text-stone-900 text-sm focus:outline-none focus:ring-2 focus:ring-stone-800 resize-none"
            />
            {isOwner && (
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={newOwnerOnly}
                  onChange={(e) => setNewOwnerOnly(e.target.checked)}
                  className="rounded border-stone-300"
                />
                <span className="text-xs text-stone-600">Owner only (hidden from house manager)</span>
              </label>
            )}
            <div className="flex gap-2">
              <button onClick={addEntry} disabled={saving || !newTitle.trim()}
                className="px-4 py-2 bg-stone-800 text-white rounded-lg text-sm font-medium hover:bg-stone-700 transition-colors disabled:opacity-50">
                {saving ? 'Saving...' : 'Add entry'}
              </button>
              <button onClick={() => setShowNew(false)}
                className="px-4 py-2 border border-stone-200 text-stone-600 rounded-lg text-sm hover:bg-stone-50 transition-colors">
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowNew(true)}
            className="w-full flex items-center justify-center gap-2 py-3 border border-dashed border-stone-300 rounded-xl text-stone-500 text-sm hover:border-stone-400 hover:text-stone-700 transition-colors"
          >
            <Plus className="w-4 h-4" /> Add entry
          </button>
        )}
      </div>
    </div>
  )
}
