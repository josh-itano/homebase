import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ContactForm from '@/components/contacts/ContactForm'

export default async function NewContactPage() {
  const supabase = await createClient()
  const { data: authData } = await supabase.auth.getUser()
  const user = authData?.user
  if (!user) redirect('/auth/login')

  const { data: memberData } = await supabase.from('household_members').select('*').eq('user_id', user!.id).limit(1)
  const member = memberData?.[0] as { household_id: string; role: string } | undefined
  if (!member) redirect('/onboarding')

  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      <h1 className="text-2xl font-semibold text-stone-900 mb-6">New Contact</h1>
      <ContactForm
        householdId={member.household_id}
        userId={user!.id}
        isOwner={member.role === 'owner'}
      />
    </div>
  )
}
