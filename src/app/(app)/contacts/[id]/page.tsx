import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import ContactDetail from '@/components/contacts/ContactDetail'
import type { Contact, ServiceHistory } from '@/types/app'

interface Props { params: Promise<{ id: string }> }

export default async function ContactDetailPage({ params }: Props) {
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

  // Managers can't see owner-only contacts
  if (member.role === 'manager' && contact.owner_only) notFound()

  const { data: historyRaw } = await supabase
    .from('service_history')
    .select('*')
    .eq('contact_id', id)
    .order('date', { ascending: false })

  return (
    <ContactDetail
      contact={contact}
      history={(historyRaw ?? []) as ServiceHistory[]}
      isOwner={member.role === 'owner'}
      userId={user!.id}
    />
  )
}
