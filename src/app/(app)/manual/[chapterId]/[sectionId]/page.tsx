import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import ManualSectionView from '@/components/manual/ManualSectionView'
import type { ManualChapter, ManualSection, ManualEntry } from '@/types/app'

interface Props { params: Promise<{ chapterId: string; sectionId: string }> }

export default async function SectionPage({ params }: Props) {
  const { chapterId, sectionId } = await params
  const supabase = await createClient()
  const { data: authData } = await supabase.auth.getUser()
  const user = authData?.user
  if (!user) redirect('/auth/login')

  const { data: memberData } = await supabase.from('household_members').select('*').eq('user_id', user!.id).limit(1)
  const member = memberData?.[0] as { household_id: string; role: string } | undefined
  if (!member) redirect('/onboarding')

  const [{ data: chapterRaw }, { data: sectionRaw }, { data: entriesRaw }] = await Promise.all([
    supabase.from('manual_chapters').select('*').eq('id', chapterId).limit(1),
    supabase.from('manual_sections').select('*').eq('id', sectionId).limit(1),
    supabase.from('manual_entries').select('*').eq('section_id', sectionId).order('created_at', { ascending: true }),
  ])

  const chapter = chapterRaw?.[0] as ManualChapter | undefined
  const section = sectionRaw?.[0] as ManualSection | undefined
  if (!chapter || !section) notFound()

  // Filter owner-only entries for managers
  const entries = ((entriesRaw ?? []) as ManualEntry[]).filter(
    (e) => member.role === 'owner' || !e.owner_only
  )

  return (
    <ManualSectionView
      chapter={chapter}
      section={section}
      entries={entries}
      isOwner={member.role === 'owner'}
      userId={user!.id}
    />
  )
}
