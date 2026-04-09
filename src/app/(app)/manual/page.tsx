import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ManualHome from '@/components/manual/ManualHome'
import type { ManualChapter } from '@/types/app'

export default async function ManualPage() {
  const supabase = await createClient()
  const { data: authData } = await supabase.auth.getUser()
  const user = authData?.user
  if (!user) redirect('/auth/login')

  const { data: memberData } = await supabase.from('household_members').select('*').eq('user_id', user!.id).limit(1)
  const member = memberData?.[0] as { household_id: string; role: string } | undefined
  if (!member) redirect('/onboarding')

  const { data: chaptersRaw } = await supabase
    .from('manual_chapters')
    .select('*')
    .eq('household_id', member.household_id)
    .order('sort_order', { ascending: true })

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-stone-900">Household Manual</h1>
      </div>
      <ManualHome
        chapters={(chaptersRaw ?? []) as ManualChapter[]}
        householdId={member.household_id}
        isOwner={member.role === 'owner'}
        userId={user!.id}
      />
    </div>
  )
}
