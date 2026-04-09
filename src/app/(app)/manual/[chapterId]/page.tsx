import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import ManualChapterView from '@/components/manual/ManualChapterView'
import type { ManualChapter, ManualSection } from '@/types/app'

interface Props { params: Promise<{ chapterId: string }> }

export default async function ChapterPage({ params }: Props) {
  const { chapterId } = await params
  const supabase = await createClient()
  const { data: authData } = await supabase.auth.getUser()
  const user = authData?.user
  if (!user) redirect('/auth/login')

  const { data: memberData } = await supabase.from('household_members').select('*').eq('user_id', user!.id).limit(1)
  const member = memberData?.[0] as { household_id: string; role: string } | undefined
  if (!member) redirect('/onboarding')

  const { data: chapterRaw } = await supabase.from('manual_chapters').select('*').eq('id', chapterId).limit(1)
  const chapter = chapterRaw?.[0] as ManualChapter | undefined
  if (!chapter || chapter.household_id !== member.household_id) notFound()

  const { data: sectionsRaw } = await supabase
    .from('manual_sections')
    .select('*')
    .eq('chapter_id', chapterId)
    .order('sort_order', { ascending: true })

  return (
    <ManualChapterView
      chapter={chapter}
      sections={(sectionsRaw ?? []) as ManualSection[]}
      isOwner={member.role === 'owner'}
    />
  )
}
