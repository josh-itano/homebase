'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { BookOpen, Plus, Loader2, X } from 'lucide-react'
import type { ManualChapter } from '@/types/app'

const CHAPTER_ICONS: Record<string, string> = {
  'Daily Routines': '🌅',
  'Household Standards': '🏠',
  'Children': '👧',
  'Pet Care': '🐾',
  'Home Systems & Information': '⚡',
  'Emergency Procedures': '🚨',
  'Entertaining & Guests': '🥂',
  'Seasonal': '🍂',
}

const TEMPLATES = [
  { title: 'Daily Routines', sections: ['Morning routine (kids)', 'Morning routine (house)', 'Afternoon / after-school routine', 'Evening / bedtime routine', 'Dog morning routine', 'Dog evening routine'] },
  { title: 'Household Standards', sections: ['Cleaning standards & preferences', 'Laundry protocols', 'Kitchen organization & rules', 'Pantry organization', 'Bathroom standards', 'Bed-making preferences', 'Tidying standards'] },
  { title: 'Children', sections: ['Child profiles', 'School information', 'Extracurricular activities', 'Dietary preferences & restrictions', 'Screen time rules', 'Discipline approach', 'Approved activities & playdate contacts', 'Babysitter instructions'] },
  { title: 'Pet Care', sections: ['Pet profile', 'Feeding schedule & diet', 'Medication schedule', 'Exercise / walking routine', 'Grooming schedule', 'Vet information', 'Boarding & emergency care', 'Behavioral notes'] },
  { title: 'Home Systems & Information', sections: ['WiFi network & passwords', 'Alarm system instructions & codes', 'HVAC operation', 'Water shutoff locations', 'Electrical panel', 'Garage / gate codes', 'Trash & recycling schedule', 'Mail & package handling', 'Spare key locations'] },
  { title: 'Emergency Procedures', sections: ['Fire safety & evacuation plan', 'Medical emergency protocol', 'Power outage procedures', 'Severe weather protocol', 'Emergency contacts', 'First aid kit locations', 'Insurance information'] },
  { title: 'Entertaining & Guests', sections: ['Guest room preparation checklist', 'Hosting preferences & standards', 'Dietary considerations for common guests', 'Gift tracking'] },
  { title: 'Seasonal', sections: ['Spring maintenance checklist', 'Summer maintenance checklist', 'Fall maintenance checklist', 'Winter / winterization checklist', 'Holiday preparation & traditions'] },
]

interface Props {
  chapters: ManualChapter[]
  householdId: string
  isOwner: boolean
  userId: string
}

export default function ManualHome({ chapters: initial, householdId }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const [chapters, setChapters] = useState(initial)
  const [seeding, setSeeding] = useState(false)
  const [seedProgress, setSeedProgress] = useState(0)
  const [showAdd, setShowAdd] = useState(false)
  const [addingTitle, setAddingTitle] = useState('')

  async function seedTemplates() {
    if (seeding) return
    setSeeding(true)
    setSeedProgress(0)

    for (let i = 0; i < TEMPLATES.length; i++) {
      const t = TEMPLATES[i]
      const { data: chapter } = await supabase
        .from('manual_chapters')
        .insert({ household_id: householdId, title: t.title, sort_order: i })
        .select()
        .single()

      if (chapter) {
        for (let j = 0; j < t.sections.length; j++) {
          await supabase.from('manual_sections').insert({
            chapter_id: (chapter as { id: string }).id,
            title: t.sections[j],
            sort_order: j,
          })
        }
      }
      setSeedProgress(i + 1)
    }

    router.refresh()
    setSeeding(false)
  }

  async function addChapter() {
    if (!addingTitle.trim()) return
    const { data } = await supabase
      .from('manual_chapters')
      .insert({ household_id: householdId, title: addingTitle.trim(), sort_order: chapters.length })
      .select()
      .single()

    if (data) {
      setChapters((prev) => [...prev, data as ManualChapter])
      setAddingTitle('')
      setShowAdd(false)
    }
  }

  if (chapters.length === 0) {
    return (
      <div className="text-center py-16 space-y-4">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-stone-100 rounded-2xl">
          <BookOpen className="w-8 h-8 text-stone-400" />
        </div>
        <div>
          <p className="text-stone-700 font-medium">Your manual is empty</p>
          <p className="text-stone-400 text-sm mt-1">Start with the pre-built template or add chapters manually</p>
        </div>

        {seeding ? (
          <div className="space-y-3">
            <div className="flex items-center justify-center gap-2 text-stone-600">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="text-sm font-medium">Setting up chapter {seedProgress} of {TEMPLATES.length}...</span>
            </div>
            <div className="w-48 mx-auto h-1.5 bg-stone-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-stone-800 rounded-full transition-all duration-300"
                style={{ width: `${(seedProgress / TEMPLATES.length) * 100}%` }}
              />
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <button
              onClick={seedTemplates}
              className="inline-flex items-center gap-2 px-5 py-3 bg-stone-800 text-white rounded-xl font-medium hover:bg-stone-700 transition-colors"
            >
              Use full template
            </button>
            <button
              onClick={() => setShowAdd(true)}
              className="text-sm text-stone-500 hover:text-stone-700 transition-colors"
            >
              or add a chapter manually
            </button>
          </div>
        )}

        {showAdd && (
          <div className="flex gap-2 max-w-sm mx-auto pt-2">
            <input
              value={addingTitle}
              onChange={(e) => setAddingTitle(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addChapter()}
              placeholder="Chapter title"
              autoFocus
              className="flex-1 px-3.5 py-2.5 border border-stone-200 rounded-xl text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-800 text-sm"
            />
            <button onClick={addChapter} className="px-4 py-2.5 bg-stone-800 text-white rounded-xl text-sm font-medium hover:bg-stone-700">Add</button>
            <button onClick={() => setShowAdd(false)} className="p-2.5 text-stone-400 hover:text-stone-600"><X className="w-4 h-4" /></button>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3">
        {chapters.map((chapter) => (
          <Link
            key={chapter.id}
            href={`/manual/${chapter.id}`}
            className="flex flex-col items-start gap-2 bg-white rounded-2xl border border-stone-200 px-4 py-4 hover:bg-stone-50 hover:border-stone-300 transition-all"
          >
            <span className="text-2xl">{CHAPTER_ICONS[chapter.title] ?? '📄'}</span>
            <span className="text-sm font-medium text-stone-900 leading-snug">{chapter.title}</span>
          </Link>
        ))}
      </div>

      {showAdd ? (
        <div className="flex gap-2">
          <input
            value={addingTitle}
            onChange={(e) => setAddingTitle(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addChapter()}
            placeholder="Chapter title"
            autoFocus
            className="flex-1 px-3.5 py-2.5 border border-stone-200 rounded-xl text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-800 text-sm"
          />
          <button onClick={addChapter} className="px-4 py-2.5 bg-stone-800 text-white rounded-xl text-sm font-medium hover:bg-stone-700 transition-colors">Add</button>
          <button onClick={() => setShowAdd(false)} className="px-4 py-2.5 border border-stone-200 text-stone-600 rounded-xl text-sm hover:bg-stone-50 transition-colors">Cancel</button>
        </div>
      ) : (
        <button
          onClick={() => setShowAdd(true)}
          className="w-full flex items-center justify-center gap-2 py-3 border border-dashed border-stone-300 rounded-xl text-stone-500 text-sm hover:border-stone-400 hover:text-stone-700 transition-colors"
        >
          <Plus className="w-4 h-4" /> Add chapter
        </button>
      )}
    </div>
  )
}
