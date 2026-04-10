'use client'

import { useRouter } from 'next/navigation'
import { BookOpen, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { DailyLog } from '@/types/app'

interface Props {
  logs: DailyLog[]
  todayDate: string
  userId: string
}

export default function LogList({ logs, todayDate, userId }: Props) {
  const router = useRouter()

  if (logs.length === 0) {
    return (
      <div className="text-center py-16 space-y-4">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-stone-100 rounded-2xl">
          <BookOpen className="w-8 h-8 text-stone-400" />
        </div>
        <div>
          <p className="text-stone-700 font-medium">No logs yet</p>
          <p className="text-stone-400 text-sm mt-1">Write a daily handoff note to keep everyone in sync</p>
        </div>
        <button
          onClick={() => router.push('/log/new')}
          className="inline-flex items-center gap-2 px-5 py-3 bg-stone-800 text-white rounded-xl font-medium hover:bg-stone-700 transition-colors"
        >
          <Plus className="w-4 h-4" /> Write today's log
        </button>
      </div>
    )
  }

  // Group by month
  const groups: { label: string; entries: DailyLog[] }[] = []
  for (const log of logs) {
    const d = new Date(log.date + 'T00:00:00')
    const label = d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    const last = groups[groups.length - 1]
    if (last?.label === label) {
      last.entries.push(log)
    } else {
      groups.push({ label, entries: [log] })
    }
  }

  return (
    <div className="space-y-6">
      {groups.map((group) => (
        <div key={group.label}>
          <p className="text-xs font-semibold text-stone-400 uppercase tracking-wide mb-2">{group.label}</p>
          <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
            {group.entries.map((log, i) => {
              const isToday = log.date === todayDate
              const isOwn = log.author_id === userId
              const d = new Date(log.date + 'T00:00:00')
              const dayLabel = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
              const preview = log.summary ?? log.kids_update ?? log.pet_update ?? log.inventory_notes ?? log.issues

              return (
                <button
                  key={log.id}
                  onClick={() => router.push(`/log/${log.id}`)}
                  className={cn(
                    'w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-stone-50 transition-colors',
                    i < group.entries.length - 1 && 'border-b border-stone-100'
                  )}
                >
                  <div className={cn(
                    'w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-xs font-semibold',
                    isToday ? 'bg-stone-800 text-white' : 'bg-stone-100 text-stone-600'
                  )}>
                    {d.getDate()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-stone-900">
                      {dayLabel}
                      {isToday && <span className="ml-1.5 text-xs font-normal text-stone-400">Today</span>}
                    </p>
                    {preview && (
                      <p className="text-xs text-stone-400 truncate mt-0.5">{preview}</p>
                    )}
                  </div>
                  {isOwn && (
                    <span className="text-xs text-stone-300 flex-shrink-0">Mine</span>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
