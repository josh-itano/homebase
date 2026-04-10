import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { Pencil } from 'lucide-react'
import LogDetail from '@/components/log/LogDetail'
import type { DailyLog } from '@/types/app'

interface Props { params: Promise<{ id: string }> }

export default async function LogDetailPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()
  const { data: authData } = await supabase.auth.getUser()
  const user = authData?.user
  if (!user) redirect('/auth/login')

  const { data: memberData } = await supabase
    .from('household_members')
    .select('household_id, display_name')
    .eq('user_id', user.id)
    .limit(1)
    .single()

  if (!memberData) redirect('/onboarding')

  const [{ data: logRaw }, { data: commentsRaw }, { data: membersRaw }] = await Promise.all([
    supabase.from('daily_logs').select('*').eq('id', id).single(),
    supabase
      .from('daily_log_comments')
      .select('*')
      .eq('log_id', id)
      .order('created_at', { ascending: true }),
    supabase
      .from('household_members')
      .select('user_id, display_name')
      .eq('household_id', memberData.household_id),
  ])

  if (!logRaw) notFound()
  const log = logRaw as DailyLog
  const isAuthor = log.author_id === user.id

  // Build display name map
  const nameMap: Record<string, string> = {}
  for (const m of membersRaw ?? []) {
    nameMap[m.user_id] = m.display_name ?? 'Someone'
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-stone-900">{formatDate(log.date)}</h1>
          <p className="text-sm text-stone-400 mt-0.5">by {nameMap[log.author_id] ?? 'Someone'}</p>
        </div>
        {isAuthor && (
          <Link
            href={`/log/${id}/edit`}
            className="flex items-center gap-1.5 border border-stone-200 text-stone-700 text-sm font-medium px-3.5 py-2 rounded-xl hover:bg-stone-50 transition-colors"
          >
            <Pencil className="w-4 h-4" /> Edit
          </Link>
        )}
      </div>
      <LogDetail
        log={log}
        comments={(commentsRaw ?? []) as { id: string; log_id: string; user_id: string; body: string; created_at: string }[]}
        nameMap={nameMap}
        currentUserId={user.id}
      />
    </div>
  )
}

function formatDate(d: string) {
  return new Date(d + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric',
  })
}
