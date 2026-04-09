'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { BookOpen, ChevronRight, Plus, Loader2 } from 'lucide-react'
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

export default function ManualHome({ chapters: initial, householdId, isOwner, userId }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const [chapters, setChapters] = useState(initial)
  const [seeding, setSeeding] = useState(false)
  const [addingTitle, setAddingTitle] = useState('')
  const [showAdd, setShowAdd] = useState(false)

  async function seedTemplates() {
    setSeeding(true)
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
        <button
          onClick={seedTemplates}
          disabled={seeding}
          className="inline-flex items-center gap-2 px-5 py-3 bg-stone-800 text-white rounded-xl font-medium hover:bg-stone-700 transition-colors disabled:opacity-50"
        >
          {seeding && <Loader2 className="w-4 h-4 animate-spin" />}
          {seeding ? 'Setting up...' : 'Use full template'}
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {chapters.map((chapter) => (
        <Link
          key={chapter.id}
          href={`/manual/${chapter.id}`}
          className="flex items-center gap-3 bg-white rounded-xl border border-stone-200 px-4 py-3.5 hover:bg-stone-50 transition-colors"
        >
          <span className="text-xl w-8 text-center flex-shrink-0">
            {CHAPTER_ICONS[chapter.title] ?? '📄'}
          </span>
          <span className="flex-1 text-sm font-medium text-stone-900">{chapter.title}</span>
          <ChevronRight className="w-4 h-4 text-stone-300 flex-shrink-0" />
        </Link>
      ))}

      {/* Add chapter */}
      {showAdd ? (
        <div className="flex gap-2 pt-2">
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
          className="w-full flex items-center justify-center gap-2 py-3 border border-dashed border-stone-300 rounded-xl text-stone-500 text-sm hover:border-stone-400 hover:text-stone-700 transition-colors mt-2"
        >
          <Plus className="w-4 h-4" /> Add chapter
        </button>
      )}
    </div>
  )
}
