import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import AppShell from '@/components/AppShell'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()

  const { data: authData } = await supabase.auth.getUser()
  const user = authData?.user
  if (!user) redirect('/auth/login')

  const { data: memberData } = await supabase
    .from('household_members')
    .select('*')
    .eq('user_id', user!.id)
    .limit(1)

  const member = memberData?.[0]
  if (!member) redirect('/onboarding')

  return (
    <AppShell
      member={{
        household_id: member.household_id,
        role: member.role,
        display_name: member.display_name,
      }}
      userEmail={user!.email ?? ''}
    >
      {children}
    </AppShell>
  )
}
