import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import SettingsClient from '@/components/settings/SettingsClient'
import type { HouseholdInvite } from '@/types/app'

export default async function SettingsPage() {
  const supabase = await createClient()

  const { data: authData } = await supabase.auth.getUser()
  const user = authData?.user
  if (!user) redirect('/auth/login')

  const { data: memberData } = await supabase
    .from('household_members')
    .select('*')
    .eq('user_id', user!.id)
    .limit(1)

  const member = memberData?.[0] as { household_id: string; role: string } | undefined
  if (!member) redirect('/onboarding')

  const isOwner = member.role === 'owner'
  const householdId = member.household_id

  const { data: gcalData } = await supabase
    .from('google_calendar_tokens')
    .select('user_id')
    .eq('user_id', user!.id)
    .limit(1)

  const isGoogleConnected = !!(gcalData && gcalData.length > 0)

  if (!isOwner) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-6">
        <h1 className="text-2xl font-semibold text-stone-900 mb-6">Settings</h1>
        <SettingsClient
          isOwner={false}
          household={{ id: householdId, name: '' }}
          members={[]}
          invites={[]}
          currentUserId={user!.id}
          householdId={householdId}
          isGoogleConnected={isGoogleConnected}
        />
      </div>
    )
  }

  const [{ data: householdRaw }, { data: membersRaw }, { data: invitesRaw }] = await Promise.all([
    supabase.from('households').select('*').eq('id', householdId).limit(1),
    supabase.from('household_members').select('*').eq('household_id', householdId),
    supabase
      .from('household_invites')
      .select('*')
      .eq('household_id', householdId)
      .is('used_at', null)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false }),
  ])

  const household = householdRaw?.[0] as { id: string; name: string } | undefined

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-semibold text-stone-900 mb-6">Settings</h1>
      <SettingsClient
        isOwner={true}
        household={household ?? { id: householdId, name: '' }}
        members={(membersRaw ?? []) as { id: string; user_id: string; display_name: string | null; role: string; joined_at: string }[]}
        invites={(invitesRaw ?? []) as HouseholdInvite[]}
        currentUserId={user!.id}
        householdId={householdId}
        isGoogleConnected={isGoogleConnected}
      />
    </div>
  )
}
