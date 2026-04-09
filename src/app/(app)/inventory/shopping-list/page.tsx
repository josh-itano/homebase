import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ShoppingListClient from '@/components/inventory/ShoppingListClient'
import type { InventoryItem, ShoppingListItem } from '@/types/app'

export default async function ShoppingListPage() {
  const supabase = await createClient()
  const { data: authData } = await supabase.auth.getUser()
  const user = authData?.user
  if (!user) redirect('/auth/login')

  const { data: memberData } = await supabase.from('household_members').select('*').eq('user_id', user!.id).limit(1)
  const member = memberData?.[0] as { household_id: string } | undefined
  if (!member) redirect('/onboarding')

  const householdId = member.household_id

  const [{ data: listRaw }, { data: lowStockRaw }] = await Promise.all([
    supabase
      .from('shopping_list')
      .select('*')
      .eq('household_id', householdId)
      .order('created_at', { ascending: true }),
    supabase
      .from('inventory_items')
      .select('*')
      .eq('household_id', householdId)
      .filter('qty', 'lte', 'min_qty')
      .order('name', { ascending: true }),
  ])

  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      <h1 className="text-2xl font-semibold text-stone-900 mb-6">Shopping List</h1>
      <ShoppingListClient
        initialList={(listRaw ?? []) as ShoppingListItem[]}
        lowStockItems={(lowStockRaw ?? []) as InventoryItem[]}
        householdId={householdId}
        userId={user!.id}
      />
    </div>
  )
}
