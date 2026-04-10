import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import DocumentsClient from '@/components/documents/DocumentsClient'
import type { HouseholdDocument } from '@/types/app'

export default async function DocumentsPage() {
  const supabase = await createClient()
  const { data: authData } = await supabase.auth.getUser()
  const user = authData?.user
  if (!user) redirect('/auth/login')

  const { data: memberData } = await supabase
    .from('household_members')
    .select('household_id, role')
    .eq('user_id', user.id)
    .limit(1)
    .single()

  if (!memberData) redirect('/onboarding')

  const { data: docsRaw } = await supabase
    .from('documents')
    .select('*')
    .eq('household_id', memberData.household_id)
    .order('uploaded_at', { ascending: false })

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-semibold text-stone-900 mb-6">Documents</h1>
      <DocumentsClient
        initialDocs={(docsRaw ?? []) as HouseholdDocument[]}
        householdId={memberData.household_id}
        userId={user.id}
        isOwner={memberData.role === 'owner'}
      />
    </div>
  )
}
