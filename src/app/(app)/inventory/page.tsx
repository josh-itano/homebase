import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Plus, ShoppingCart } from 'lucide-react'
import InventoryClient from '@/components/inventory/InventoryClient'
import type { InventoryItem } from '@/types/app'

export default async function InventoryPage() {
  const supabase = await createClient()
  const { data: authData } = await supabase.auth.getUser()
  const user = authData?.user
  if (!user) redirect('/auth/login')

  const { data: memberData } = await supabase.from('household_members').select('*').eq('user_id', user!.id).limit(1)
  const member = memberData?.[0] as { household_id: string; role: string } | undefined
  if (!member) redirect('/onboarding')

  const { data: itemsRaw } = await supabase
    .from('inventory_items')
    .select('*')
    .eq('household_id', member.household_id)
    .order('name', { ascending: true })

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-stone-900">Inventory</h1>
        <div className="flex items-center gap-2">
          <Link
            href="/inventory/shopping-list"
            className="flex items-center gap-1.5 border border-stone-200 text-stone-700 text-sm font-medium px-3.5 py-2 rounded-xl hover:bg-stone-50 transition-colors"
          >
            <ShoppingCart className="w-4 h-4" />
            Shopping list
          </Link>
          <Link
            href="/inventory/new"
            className="flex items-center gap-1.5 bg-stone-800 text-white text-sm font-medium px-3.5 py-2 rounded-xl hover:bg-stone-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add item
          </Link>
        </div>
      </div>
      <InventoryClient
        initialItems={(itemsRaw ?? []) as InventoryItem[]}
        householdId={member.household_id}
        userId={user!.id}
      />
    </div>
  )
}
