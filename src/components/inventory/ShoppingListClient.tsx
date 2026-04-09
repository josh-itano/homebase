'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus, Check, Trash2, AlertTriangle, ShoppingCart, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { InventoryItem, ShoppingListItem } from '@/types/app'

interface Props {
  initialList: ShoppingListItem[]
  lowStockItems: InventoryItem[]
  householdId: string
  userId: string
}

export default function ShoppingListClient({ initialList, lowStockItems, householdId, userId }: Props) {
  const supabase = createClient()
  const [list, setList] = useState(initialList)
  const [newItem, setNewItem] = useState('')
  const [adding, setAdding] = useState(false)
  const [generating, setGenerating] = useState(false)

  // Which low-stock items are already on the list
  const onListIds = new Set(list.map((i) => i.linked_inventory_id).filter(Boolean))
  const unaddedLowStock = lowStockItems.filter((i) => !onListIds.has(i.id))

  async function addItem(name: string, linkedId?: string) {
    const { data } = await supabase
      .from('shopping_list')
      .insert({
        household_id: householdId,
        item_name: name,
        linked_inventory_id: linkedId ?? null,
        added_by: userId,
      })
      .select()
      .single()

    if (data) setList((prev) => [...prev, data as ShoppingListItem])
  }

  async function addManualItem() {
    if (!newItem.trim()) return
    setAdding(true)
    await addItem(newItem.trim())
    setNewItem('')
    setAdding(false)
  }

  async function generateFromLowStock() {
    if (unaddedLowStock.length === 0) return
    setGenerating(true)
    for (const item of unaddedLowStock) {
      await addItem(item.name, item.id)
    }
    setGenerating(false)
  }

  async function toggleChecked(item: ShoppingListItem) {
    const { error } = await supabase
      .from('shopping_list')
      .update({ checked: !item.checked })
      .eq('id', item.id)

    if (!error) {
      setList((prev) => prev.map((i) => i.id === item.id ? { ...i, checked: !i.checked } : i))
    }
  }

  async function removeItem(id: string) {
    await supabase.from('shopping_list').delete().eq('id', id)
    setList((prev) => prev.filter((i) => i.id !== id))
  }

  async function clearChecked() {
    const checked = list.filter((i) => i.checked)
    await Promise.all(checked.map((i) => supabase.from('shopping_list').delete().eq('id', i.id)))
    setList((prev) => prev.filter((i) => !i.checked))
  }

  const unchecked = list.filter((i) => !i.checked)
  const checked = list.filter((i) => i.checked)

  return (
    <div className="space-y-5">
      {/* Generate from low stock */}
      {unaddedLowStock.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 space-y-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0" />
            <p className="text-sm font-medium text-amber-800">
              {unaddedLowStock.length} low-stock item{unaddedLowStock.length > 1 ? 's' : ''} not on list
            </p>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {unaddedLowStock.map((item) => (
              <span key={item.id} className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full">
                {item.name}
              </span>
            ))}
          </div>
          <button
            onClick={generateFromLowStock}
            disabled={generating}
            className="flex items-center gap-2 text-sm font-medium text-amber-800 hover:text-amber-900 transition-colors disabled:opacity-50"
          >
            {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShoppingCart className="w-4 h-4" />}
            {generating ? 'Adding...' : 'Add all to list'}
          </button>
        </div>
      )}

      {/* Add manual item */}
      <div className="flex gap-2">
        <input
          value={newItem}
          onChange={(e) => setNewItem(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && addManualItem()}
          placeholder="Add an item..."
          className="flex-1 px-3.5 py-2.5 border border-stone-200 rounded-xl text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-800"
        />
        <button
          onClick={addManualItem}
          disabled={adding || !newItem.trim()}
          className="px-4 py-2.5 bg-stone-800 text-white rounded-xl font-medium hover:bg-stone-700 transition-colors disabled:opacity-50 flex items-center gap-1.5"
        >
          {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
          Add
        </button>
      </div>

      {/* Empty state */}
      {list.length === 0 && (
        <div className="text-center py-10">
          <ShoppingCart className="w-10 h-10 text-stone-200 mx-auto mb-3" />
          <p className="text-stone-400 text-sm">Your shopping list is empty</p>
        </div>
      )}

      {/* Unchecked items */}
      {unchecked.length > 0 && (
        <div className="space-y-2">
          {unchecked.map((item) => (
            <ShoppingRow key={item.id} item={item} onToggle={() => toggleChecked(item)} onRemove={() => removeItem(item.id)} />
          ))}
        </div>
      )}

      {/* Checked items */}
      {checked.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-stone-400 uppercase tracking-wide">Got it</p>
            <button onClick={clearChecked} className="text-xs text-stone-400 hover:text-red-400 transition-colors">
              Clear all
            </button>
          </div>
          {checked.map((item) => (
            <ShoppingRow key={item.id} item={item} onToggle={() => toggleChecked(item)} onRemove={() => removeItem(item.id)} />
          ))}
        </div>
      )}
    </div>
  )
}

function ShoppingRow({ item, onToggle, onRemove }: {
  item: ShoppingListItem
  onToggle: () => void
  onRemove: () => void
}) {
  return (
    <div className={cn('flex items-center gap-3 bg-white rounded-xl border px-4 py-3', item.checked ? 'border-stone-100 opacity-60' : 'border-stone-200')}>
      <button onClick={onToggle} className="flex-shrink-0">
        <div className={cn(
          'w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors',
          item.checked ? 'bg-green-500 border-green-500' : 'border-stone-300 hover:border-stone-500'
        )}>
          {item.checked && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
        </div>
      </button>
      <p className={cn('flex-1 text-sm', item.checked ? 'line-through text-stone-400' : 'text-stone-900')}>
        {item.item_name}
      </p>
      <button onClick={onRemove} className="text-stone-300 hover:text-red-400 transition-colors flex-shrink-0">
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  )
}
