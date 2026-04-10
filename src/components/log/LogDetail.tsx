'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Send, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { DailyLog } from '@/types/app'

interface Comment {
  id: string
  log_id: string
  user_id: string
  body: string
  created_at: string
}

interface Props {
  log: DailyLog
  comments: Comment[]
  nameMap: Record<string, string>
  currentUserId: string
}

const SECTIONS = [
  { key: 'summary'         as const, label: 'General summary' },
  { key: 'kids_update'     as const, label: 'Kids' },
  { key: 'pet_update'      as const, label: 'Pets' },
  { key: 'inventory_notes' as const, label: 'Supplies & inventory' },
  { key: 'issues'          as const, label: 'Issues & follow-ups' },
]

export default function LogDetail({ log, comments: initialComments, nameMap, currentUserId }: Props) {
  const supabase = createClient()
  const [comments, setComments] = useState<Comment[]>(initialComments)
  const [newComment, setNewComment] = useState('')
  const [posting, setPosting] = useState(false)

  const filledSections = SECTIONS.filter((s) => log[s.key])

  async function postComment() {
    if (!newComment.trim()) return
    setPosting(true)
    const { data } = await supabase
      .from('daily_log_comments')
      .insert({ log_id: log.id, user_id: currentUserId, body: newComment.trim() })
      .select()
      .single()
    if (data) {
      setComments((prev) => [...prev, data as Comment])
      setNewComment('')
    }
    setPosting(false)
  }

  return (
    <div className="space-y-6">
      {/* Log sections */}
      {filledSections.length === 0 ? (
        <p className="text-stone-400 text-sm">No content in this log.</p>
      ) : (
        <div className="space-y-4">
          {filledSections.map((section) => (
            <div key={section.key} className="bg-white rounded-2xl border border-stone-200 px-4 py-4">
              <p className="text-xs font-semibold text-stone-400 uppercase tracking-wide mb-2">{section.label}</p>
              <p className="text-sm text-stone-800 whitespace-pre-wrap">{log[section.key]}</p>
            </div>
          ))}
        </div>
      )}

      {/* Comments */}
      <div>
        <p className="text-xs font-semibold text-stone-400 uppercase tracking-wide mb-3">
          Notes {comments.length > 0 && `· ${comments.length}`}
        </p>

        {comments.length > 0 && (
          <div className="space-y-2 mb-3">
            {comments.map((c) => {
              const isMine = c.user_id === currentUserId
              return (
                <div key={c.id} className={cn('flex gap-2', isMine && 'flex-row-reverse')}>
                  <div className="w-7 h-7 rounded-full bg-stone-100 flex items-center justify-center flex-shrink-0 text-xs font-medium text-stone-600">
                    {(nameMap[c.user_id] ?? '?')[0].toUpperCase()}
                  </div>
                  <div className={cn(
                    'max-w-[75%] px-3 py-2 rounded-2xl text-sm',
                    isMine ? 'bg-stone-800 text-white rounded-tr-sm' : 'bg-white border border-stone-200 text-stone-900 rounded-tl-sm'
                  )}>
                    {!isMine && (
                      <p className="text-xs font-medium mb-0.5" style={{ color: isMine ? 'rgba(255,255,255,0.7)' : undefined }}>
                        {nameMap[c.user_id] ?? 'Someone'}
                      </p>
                    )}
                    <p className="whitespace-pre-wrap">{c.body}</p>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Comment input */}
        <div className="flex gap-2">
          <input
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), postComment())}
            placeholder="Add a note..."
            className="flex-1 px-3.5 py-2.5 border border-stone-200 rounded-xl text-sm text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-800"
          />
          <button
            onClick={postComment}
            disabled={posting || !newComment.trim()}
            className="px-3.5 py-2.5 bg-stone-800 text-white rounded-xl hover:bg-stone-700 transition-colors disabled:opacity-50 flex items-center"
          >
            {posting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  )
}
