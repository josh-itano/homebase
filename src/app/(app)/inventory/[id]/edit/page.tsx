import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import InventoryForm from '@/components/inventory/InventoryForm'
import type { InventoryItem } from '@/types/app'

interface Props { params: Promise<{ id: string }> }

export default async function EditInventoryItemPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()
  const { data: authData } = await supabase.auth.getUser()
  const user = authData?.user
  if (!user) redirect('/auth/login')

  const { data: memberData } = await supabase.from('household_members').select('*').eq('user_id', user!.id).limit(1)
  const member = memberData?.[0] as { household_id: string } | undefined
  if (!member) redirect('/onboarding')

  const { data: itemRaw } = await supabase.from('inventory_items').select('*').eq('id', id).limit(1)
  const item = itemRaw?.[0] as InventoryItem | undefined
  if (!item) notFound()

  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      <h1 className="text-2xl font-semibold text-stone-900 mb-6">Edit Item</h1>
      <InventoryForm householdId={member.household_id} userId={user!.id} item={item} />
    </div>
  )
}
