import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import ContactForm from '@/components/contacts/ContactForm'
import type { Contact } from '@/types/app'

interface Props { params: Promise<{ id: string }> }

export default async function EditContactPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()
  const { data: authData } = await supabase.auth.getUser()
  const user = authData?.user
  if (!user) redirect('/auth/login')

  const { data: memberData } = await supabase.from('household_members').select('*').eq('user_id', user!.id).limit(1)
  const member = memberData?.[0] as { household_id: string; role: string } | undefined
  if (!member) redirect('/onboarding')

  const { data: contactRaw } = await supabase.from('contacts').select('*').eq('id', id).limit(1)
  const contact = contactRaw?.[0] as Contact | undefined
  if (!contact) notFound()

  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      <h1 className="text-2xl font-semibold text-stone-900 mb-6">Edit Contact</h1>
      <ContactForm
        householdId={member.household_id}
        userId={user!.id}
        isOwner={member.role === 'owner'}
        contact={contact}
      />
    </div>
  )
}
