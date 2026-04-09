'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Minus, Plus, AlertTriangle, Pencil, Package, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { InventoryItem, InventoryCategory } from '@/types/app'

const CATEGORIES: { value: InventoryCategory | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'pantry', label: 'Pantry' },
  { value: 'refrigerator', label: 'Fridge' },
  { value: 'freezer', label: 'Freezer' },
  { value: 'cleaning', label: 'Cleaning' },
  { value: 'bathroom', label: 'Bathroom' },
  { value: 'laundry', label: 'Laundry' },
  { value: 'kids', label: 'Kids' },
  { value: 'dog', label: 'Dog' },
  { value: 'medicine', label: 'Medicine' },
  { value: 'office', label: 'Office' },
  { value: 'other', label: 'Other' },
]

interface Props {
  initialItems: InventoryItem[]
  householdId: string
  userId: string
}


// Track which items we've already auto-added this session to avoid duplicate toasts/adds
const autoAdded = new Set<string>()

export default function InventoryClient({ initialItems, householdId, userId }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const [items, setItems] = useState(initialItems)
  const [filter, setFilter] = useState<InventoryCategory | 'all'>('all')
  const [adjusting, setAdjusting] = useState<string | null>(null)

  const filtered = filter === 'all' ? items : items.filter((i) => i.category === filter)
  const lowStockCount = items.filter((i) => i.qty <= i.min_qty).length

  async function adjustQty(item: InventoryItem, delta: number) {
    const newQty = Math.max(0, item.qty + delta)
    setAdjusting(item.id)

    const update: Partial<InventoryItem> = { qty: newQty }
    if (delta > 0) update.last_restocked = new Date().toISOString()

    const { error } = await supabase.from('inventory_items').update(update).eq('id', item.id)
    if (!error) {
      setItems((prev) => prev.map((i) => i.id === item.id ? { ...i, ...update } : i))

      // Auto-add to shopping list when hitting minimum quantity
      if (newQty <= item.min_qty && !autoAdded.has(item.id)) {
        autoAdded.add(item.id)
        const { data: existing } = await supabase
          .from('shopping_list')
          .select('id')
          .eq('household_id', householdId)
          .eq('linked_inventory_id', item.id)
          .eq('checked', false)
          .limit(1)

        if (!existing || existing.length === 0) {
          await supabase.from('shopping_list').insert({
            household_id: householdId,
            item_name: item.name,
            linked_inventory_id: item.id,
            added_by: userId,
          })
        }
      }
    }
    setAdjusting(null)
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-16 space-y-4">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-stone-100 rounded-2xl">
          <Package className="w-8 h-8 text-stone-400" />
        </div>
        <div>
          <p className="text-stone-700 font-medium">No items yet</p>
          <p className="text-stone-400 text-sm mt-1">Add items to track quantities and get low-stock alerts</p>
        </div>
        <button
          onClick={() => router.push('/inventory/new')}
          className="inline-flex items-center gap-2 px-5 py-3 bg-stone-800 text-white rounded-xl font-medium hover:bg-stone-700 transition-colors"
        >
          <Plus className="w-4 h-4" /> Add your first item
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Low stock banner */}
      {lowStockCount > 0 && (
        <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
          <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0" />
          <p className="text-sm text-amber-700 flex-1">
            {lowStockCount} item{lowStockCount > 1 ? 's' : ''} running low
          </p>
          <button
            onClick={() => router.push('/inventory/shopping-list')}
            className="text-xs font-medium text-amber-700 hover:text-amber-900 underline"
          >
            View shopping list
          </button>
        </div>
      )}

      {/* Category filter */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4">
        {CATEGORIES.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => setFilter(value as InventoryCategory | 'all')}
            className={cn(
              'flex-shrink-0 text-xs px-3 py-1.5 rounded-full font-medium transition-colors',
              filter === value
                ? 'bg-stone-800 text-white'
                : 'bg-white border border-stone-200 text-stone-600 hover:bg-stone-50'
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Items */}
      {filtered.length === 0 ? (
        <p className="text-center text-stone-400 text-sm py-8">No items in this category</p>
      ) : (
        <div className="space-y-2">
          {filtered.map((item) => {
            const isLow = item.qty <= item.min_qty
            const isAdjusting = adjusting === item.id

            return (
              <div
                key={item.id}
                className={cn(
                  'bg-white rounded-xl border px-4 py-3 flex items-center gap-3',
                  isLow ? 'border-amber-200' : 'border-stone-200'
                )}
              >
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm font-medium text-stone-900 truncate">{item.name}</p>
                    {isLow && <AlertTriangle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />}
                  </div>
                  <p className="text-xs text-stone-400 mt-0.5 capitalize">
                    {item.category}
                    {item.preferred_brand ? ` · ${item.preferred_brand}` : ''}
                  </p>
                </div>

                {/* Quantity controls */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => adjustQty(item, -1)}
                    disabled={item.qty === 0 || isAdjusting}
                    className="w-7 h-7 rounded-lg border border-stone-200 flex items-center justify-center text-stone-600 hover:bg-stone-50 disabled:opacity-30 transition-colors"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>

                  <div className="text-center min-w-[3rem]">
                    {isAdjusting ? (
                      <Loader2 className="w-4 h-4 animate-spin text-stone-400 mx-auto" />
                    ) : (
                      <>
                        <span className={cn('text-sm font-semibold', isLow ? 'text-amber-600' : 'text-stone-900')}>
                          {item.qty}
                        </span>
                        <span className="text-xs text-stone-400 ml-1">{item.unit}</span>
                      </>
                    )}
                  </div>

                  <button
                    onClick={() => adjustQty(item, 1)}
                    disabled={isAdjusting}
                    className="w-7 h-7 rounded-lg border border-stone-200 flex items-center justify-center text-stone-600 hover:bg-stone-50 disabled:opacity-30 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Edit */}
                <button
                  onClick={() => router.push(`/inventory/${item.id}/edit`)}
                  className="text-stone-300 hover:text-stone-600 transition-colors flex-shrink-0"
                >
                  <Pencil className="w-4 h-4" />
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
